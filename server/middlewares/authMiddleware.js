const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Auth middleware - Token received');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware - Token decoded for user ID:', decoded.id);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('Auth middleware - User not found for token');
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      console.log('Auth middleware - User authenticated:', req.user.email);
      next();
    } catch (error) {
      console.error('Auth middleware - Token verification failed:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    console.log('Auth middleware - No token provided in headers');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
