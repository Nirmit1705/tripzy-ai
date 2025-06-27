const express = require('express');
const {
  getCurrentWeather,
  getForecast
} = require('../controllers/weatherController');

const router = express.Router();

// @desc    Get current weather for a city
// @route   GET /api/weather/current
// @access  Public
router.get('/current', getCurrentWeather);

// @desc    Get weather forecast for a city
// @route   GET /api/weather/forecast
// @access  Public
router.get('/forecast', getForecast);

module.exports = router;
