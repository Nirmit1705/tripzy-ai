import apiService from './api';

class WeatherService {
  // Get current weather for a city
  async getCurrentWeather(city) {
    try {
      const response = await apiService.getCurrentWeather(city);
      return response.data;
    } catch (error) {
      console.error('Failed to get current weather:', error);
      return this.getFallbackWeather(city);
    }
  }

  // Get weather forecast
  async getWeatherForecast(city, days = 5) {
    try {
      const response = await apiService.getWeatherForecast(city, days);
      return response.data;
    } catch (error) {
      console.error('Failed to get weather forecast:', error);
      return this.getFallbackForecast(city, days);
    }
  }

  // Get weather for specific date
  async getWeatherForDate(city, date) {
    try {
      const response = await apiService.getWeatherForDate(city, date);
      return response.data;
    } catch (error) {
      console.error('Failed to get weather for date:', error);
      return this.getFallbackWeather(city, date);
    }
  }

  // Get weather for entire itinerary
  async getWeatherForItinerary(dailyItinerary) {
    try {
      const response = await apiService.getWeatherForItinerary(dailyItinerary);
      return response.data;
    } catch (error) {
      console.error('Failed to get weather for itinerary:', error);
      return this.getFallbackItineraryWeather(dailyItinerary);
    }
  }

  // Fallback weather data
  getFallbackWeather(city, date = null) {
    const temp = 20 + Math.floor(Math.random() * 15);
    return {
      city: city || 'Unknown',
      temp: `${temp}°C`,
      condition: 'Weather not available',
      humidity: 'N/A',
      description: 'Weather data unavailable',
      available: false,
      date: date
    };
  }

  getFallbackForecast(city, days) {
    const forecasts = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecasts.push(this.getFallbackWeather(city, date.toISOString().split('T')[0]));
    }
    return { city, forecasts };
  }

  getFallbackItineraryWeather(dailyItinerary) {
    return dailyItinerary.map(day => ({
      day: day.day,
      weather: this.getFallbackWeather(day.location, day.date)
    }));
  }
}

export default new WeatherService();
