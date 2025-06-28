const express = require('express');
const {
  getCurrentWeather,
  getForecast,
  getWeatherForDate,
  getWeatherForItinerary
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

// @desc    Get weather for specific date and location
// @route   GET /api/weather/date
// @access  Public
router.get('/date', getWeatherForDate);

// @desc    Get weather for entire itinerary
// @route   POST /api/weather/itinerary
// @access  Public
router.post('/itinerary', getWeatherForItinerary);

module.exports = router;
