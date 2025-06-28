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

// @desc    Get weather for specific date and location
// @route   GET /api/weather/date
// @access  Public
const getWeatherForDate = asyncHandler(async (req, res) => {
  const { city, date } = req.query;
  
  if (!city || !date) {
    res.status(400);
    throw new Error('City and date are required');
  }

  logger.info(`Weather request for city: ${city}, date: ${date}`);
  
  const weather = await weatherService.getWeatherForDate(city, date);
  
  res.json({
    success: true,
    data: weather
  });
});

// @desc    Get weather for itinerary
// @route   POST /api/weather/itinerary
// @access  Public
const getWeatherForItinerary = asyncHandler(async (req, res) => {
  const { dailyItinerary } = req.body;
  
  if (!dailyItinerary || !Array.isArray(dailyItinerary)) {
    res.status(400);
    throw new Error('Daily itinerary array is required');
  }

  logger.info(`Weather request for itinerary with ${dailyItinerary.length} days`);
  
  const weatherData = await weatherService.getWeatherForItinerary(dailyItinerary);
  
  res.json({
    success: true,
    data: weatherData
  });
});

module.exports = {
  getCurrentWeather,
  getForecast,
  getWeatherForDate,
  getWeatherForItinerary
};
