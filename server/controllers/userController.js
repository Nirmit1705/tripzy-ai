const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/user/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    preferences: {
      currency: 'USD'
    }
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/user/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    preferences: req.user.preferences,
    travelStats: req.user.travelStats
  });
});

// @desc    Get user's trip history (past trips only)
// @route   GET /api/user/trip-history
// @access  Private
const getTripHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get completed itineraries where end date has passed
  const pastTrips = await Itinerary.find({
    user: userId,
    endDate: { $lt: new Date() }, // End date is in the past
    status: { $in: ['completed', 'cancelled'] }
  })
  .select('title startingPoint destinations startDate endDate totalCost status rating userReview completedAt')
  .sort({ endDate: -1 }); // Most recent first

  // Update user's trip history if needed
  await updateUserTripHistory(userId, pastTrips);

  res.json({
    success: true,
    data: pastTrips,
    count: pastTrips.length
  });
});

// @desc    Get user's current and upcoming trips
// @route   GET /api/user/current-trips
// @access  Private
const getCurrentTrips = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  
  const currentTrips = await Itinerary.find({
    user: userId,
    $or: [
      { startDate: { $lte: now }, endDate: { $gte: now } }, // Ongoing
      { startDate: { $gt: now } } // Upcoming
    ],
    status: { $nin: ['cancelled', 'completed'] }
  })
  .select('title startingPoint destinations startDate endDate totalCost status')
  .sort({ startDate: 1 }); // Earliest first

  res.json({
    success: true,
    data: currentTrips,
    count: currentTrips.length
  });
});

// @desc    Get user's travel statistics
// @route   GET /api/user/travel-stats
// @access  Private
const getTravelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const user = await User.findById(userId).select('travelStats');
  
  // Calculate real-time stats from itineraries
  const completedTrips = await Itinerary.find({
    user: userId,
    status: 'completed'
  });

  const stats = {
    totalTrips: completedTrips.length,
    totalDestinations: [...new Set(completedTrips.flatMap(trip => 
      trip.destinations.map(dest => dest.name)
    ))].length,
    totalSpent: completedTrips.reduce((sum, trip) => sum + (trip.totalCost || 0), 0),
    favoriteDestinations: getFavoriteDestinations(completedTrips),
    lastTripDate: completedTrips.length > 0 ? 
      Math.max(...completedTrips.map(trip => trip.endDate)) : null,
    averageRating: calculateAverageRating(completedTrips),
    tripsByYear: getTripsByYear(completedTrips)
  };

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Rate and review a completed trip
// @route   PUT /api/user/rate-trip/:id
// @access  Private
const rateTripAndReview = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const itineraryId = req.params.id;
  const userId = req.user._id;
  
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const itinerary = await Itinerary.findOne({
    _id: itineraryId,
    user: userId,
    status: 'completed'
  });

  if (!itinerary) {
    res.status(404);
    throw new Error('Completed trip not found');
  }

  itinerary.rating = rating;
  if (review) {
    itinerary.userReview = review;
  }

  await itinerary.save();

  res.json({
    success: true,
    message: 'Trip rated successfully',
    data: {
      rating: itinerary.rating,
      review: itinerary.userReview
    }
  });
});

// @desc    Google OAuth authentication
// @route   GET /api/user/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  console.log('Redirecting to Google OAuth URL:', googleAuthUrl);
  res.redirect(googleAuthUrl);
});

// @desc    Google OAuth callback
// @route   GET /api/user/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;
  
  console.log('Google OAuth callback received:', { code: !!code, error });
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }

  try {
    console.log('Exchanging code for token...');
    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('Access token received');

    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const { email, name, picture, verified_email } = userResponse.data;
    console.log('User info received:', { email, name, verified_email });

    // Ensure email is verified
    if (!verified_email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=email_not_verified`);
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      console.log('Creating new user...');
      // Create new user
      user = await User.create({
        name,
        email,
        profileImage: picture,
        isGoogleUser: true,
        preferences: {
          currency: 'USD'
        }
      });
    } else if (!user.isGoogleUser) {
      console.log('Updating existing user to Google user...');
      // Update existing user to Google user
      user.isGoogleUser = true;
      user.profileImage = picture;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend login page with token and user data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    };

    console.log('Redirecting to frontend with user data');
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);

  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// Helper function to update user trip history
const updateUserTripHistory = async (userId, pastTrips) => {
  const user = await User.findById(userId);
  
  // Update trip history array
  user.tripHistory = pastTrips.map(trip => ({
    itineraryId: trip._id,
    title: trip.title,
    destinations: trip.destinations.map(dest => dest.name),
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalCost: trip.totalCost,
    status: trip.status,
    rating: trip.rating,
    review: trip.userReview,
    completedAt: trip.completedAt || trip.endDate
  }));

  // Update travel stats
  user.travelStats.totalTrips = pastTrips.length;
  user.travelStats.totalSpent = pastTrips.reduce((sum, trip) => sum + (trip.totalCost || 0), 0);
  user.travelStats.lastTripDate = pastTrips.length > 0 ? pastTrips[0].endDate : null;

  await user.save();
};

// Helper function to get favorite destinations
const getFavoriteDestinations = (trips) => {
  const destinationCount = {};
  
  trips.forEach(trip => {
    trip.destinations.forEach(dest => {
      const destName = dest.name || dest;
      destinationCount[destName] = (destinationCount[destName] || 0) + 1;
    });
  });

  return Object.entries(destinationCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([dest]) => dest);
};

// Helper function to calculate average rating
const calculateAverageRating = (trips) => {
  const ratedTrips = trips.filter(trip => trip.rating);
  if (ratedTrips.length === 0) return null;
  
  const totalRating = ratedTrips.reduce((sum, trip) => sum + trip.rating, 0);
  return Math.round((totalRating / ratedTrips.length) * 10) / 10; // Round to 1 decimal
};

// Helper function to get trips by year
const getTripsByYear = (trips) => {
  const tripsByYear = {};
  
  trips.forEach(trip => {
    const year = new Date(trip.endDate).getFullYear();
    tripsByYear[year] = (tripsByYear[year] || 0) + 1;
  });

  return tripsByYear;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getTripHistory,
  getCurrentTrips,
  getTravelStats,
  rateTripAndReview,
  googleAuth,
  googleCallback
};
