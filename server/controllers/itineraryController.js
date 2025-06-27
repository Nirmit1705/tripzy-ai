const asyncHandler = require('express-async-handler');
const Itinerary = require('../models/Itinerary');
const User = require('../models/User');

// @desc    Generate new itinerary from form data
// @route   POST /api/itinerary/generate
// @access  Private
const generateItinerary = asyncHandler(async (req, res) => {
  console.log('Generate itinerary request received from user:', req.user.email);
  console.log('Request body:', req.body);

  const {
    startLocation,
    destinations,
    startDate,
    numberOfDays,
    budget,
    travelers,
    interests,
    startTime,
    endTime,
    currency,
    startingPoint
  } = req.body;

  // Validate required fields
  if (!startLocation) {
    res.status(400);
    throw new Error('Start location is required');
  }

  if (!destinations || destinations.length === 0) {
    res.status(400);
    throw new Error('At least one destination is required');
  }

  if (!startDate || !numberOfDays) {
    res.status(400);
    throw new Error('Start date and number of days are required');
  }

  // Calculate end date
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + parseInt(numberOfDays) - 1);

  // Create itinerary object
  const itineraryData = {
    user: req.user._id,
    title: `Trip from ${startLocation} to ${destinations.join(', ')}`,
    startLocation,
    destinations: destinations.map(dest => ({
      name: dest,
      coordinates: null // Will be filled by geocoding service later
    })),
    startingPoint: startingPoint || startLocation,
    startDate: start,
    endDate: end,
    numberOfDays: parseInt(numberOfDays),
    budget,
    travelers: parseInt(travelers),
    interests: interests || [],
    preferences: {
      startTime: startTime || '09:00',
      endTime: endTime || '18:00',
      currency: currency || 'USD'
    },
    status: 'draft',
    createdFrom: 'form'
  };

  console.log('Creating itinerary with data:', itineraryData);

  // Save to database
  const itinerary = await Itinerary.create(itineraryData);
  console.log('Itinerary created successfully:', itinerary._id);

  // Update user's travel stats - Fix the path
  try {
    const updateResult = await User.findByIdAndUpdate(
      req.user._id, 
      { 
        $inc: { 'travelStats.totalDrafts': 1 },
        $set: { 'travelStats.lastTripDate': new Date() }
      },
      { new: true }
    );
    console.log('User stats updated:', updateResult?.travelStats);
  } catch (statsError) {
    console.error('Error updating user stats:', statsError);
    // Don't fail the whole operation if stats update fails
  }

  res.status(201).json({
    success: true,
    message: 'Itinerary created successfully',
    data: itinerary,
    meta: {
      formDataStored: true,
      readyForGeneration: true,
      userStatsUpdated: true
    }
  });
});

// @desc    Save draft itinerary (without full generation)
// @route   POST /api/itinerary/save-draft
// @access  Private
const saveDraftItinerary = asyncHandler(async (req, res) => {
  const formData = req.body;

  // Create minimal itinerary for draft
  const draftData = {
    user: req.user._id,
    title: formData.title || `Draft - ${formData.startLocation || 'Unknown'} to ${formData.destinations?.[0] || 'New Trip'}`,
    startLocation: formData.startLocation || '',
    destinations: (formData.destinations || []).map(dest => ({
      name: dest,
      coordinates: null
    })),
    startingPoint: formData.startingPoint || formData.startLocation || '',
    startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
    numberOfDays: parseInt(formData.numberOfDays) || 3,
    budget: formData.budget || 'moderate',
    travelers: parseInt(formData.travelers) || 1,
    interests: formData.interests || [],
    preferences: {
      startTime: formData.startTime || '09:00',
      endTime: formData.endTime || '18:00',
      currency: formData.currency || 'USD'
    },
    status: 'draft',
    createdFrom: 'form'
  };

  const draft = await Itinerary.create(draftData);

  res.status(201).json({
    success: true,
    message: 'Draft saved successfully',
    data: draft
  });
});

// @desc    Get user's itineraries
// @route   GET /api/itinerary
// @access  Private
const getUserItineraries = asyncHandler(async (req, res) => {
  const { status, limit = 10, page = 1 } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const itineraries = await Itinerary.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Itinerary.countDocuments(filter);

  res.json({
    success: true,
    data: itineraries,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
});

// @desc    Get specific itinerary
// @route   GET /api/itinerary/:id
// @access  Private
const getItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  res.json({
    success: true,
    data: itinerary
  });
});

// @desc    Update itinerary
// @route   PUT /api/itinerary/:id
// @access  Private
const updateItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  const updatedItinerary = await Itinerary.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Itinerary updated successfully',
    data: updatedItinerary
  });
});

// @desc    Delete itinerary
// @route   DELETE /api/itinerary/:id
// @access  Private
const deleteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!itinerary) {
    res.status(404);
    throw new Error('Itinerary not found');
  }

  await Itinerary.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Itinerary deleted successfully'
  });
});

module.exports = {
  generateItinerary,
  saveDraftItinerary,
  getUserItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary
};
