const asyncHandler = require('express-async-handler');
const weatherService = require('../services/weatherService');
const logger = require('../utils/logger');

// @desc    Get current weather
// @route   GET /api/weather/current
// @access  Public
const getCurrentWeather = asyncHandler(async (req, res) => {
  const { city } = req.query;
  
  if (!city) {
    res.status(400);
    throw new Error('City is required');
  }

  logger.info(`Weather request for city: ${city}`);
  
  const weather = await weatherService.getCurrentWeather(city);
  
  res.json({
    success: true,
    data: weather
  });
});

// @desc    Get weather forecast
// @route   GET /api/weather/forecast
// @access  Public
const getForecast = asyncHandler(async (req, res) => {
  const { city, days = 5 } = req.query;
  
  if (!city) {
    res.status(400);
    throw new Error('City is required');
  }

  logger.info(`Weather forecast request for city: ${city}, days: ${days}`);
  
  const forecast = await weatherService.getForecast(city, parseInt(days));
  
  res.json({
    success: true,
    data: forecast
  });
});

module.exports = {
  getCurrentWeather,
  getForecast
};
