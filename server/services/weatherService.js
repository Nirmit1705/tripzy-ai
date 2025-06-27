const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(city) {
    if (!this.apiKey) {
      console.warn('Weather API key not configured, returning mock data');
      return this.getMockWeather(city);
    }

    try {
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon
      };
    } catch (error) {
      console.warn('Weather API failed, returning mock data:', error.message);
      return this.getMockWeather(city);
    }
  }

  async getForecast(city, days = 5) {
    if (!this.apiKey) {
      console.warn('Weather API key not configured, returning mock data');
      return this.getMockForecast(city, days);
    }

    try {
      const response = await axios.get(`${this.baseURL}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        }
      });

      const dailyForecasts = [];
      for (let i = 0; i < response.data.list.length; i += 8) {
        const forecast = response.data.list[i];
        dailyForecasts.push({
          date: new Date(forecast.dt * 1000).toISOString().split('T')[0],
          temperature: Math.round(forecast.main.temp),
          description: forecast.weather[0].description,
          humidity: forecast.main.humidity,
          windSpeed: forecast.wind.speed,
          icon: forecast.weather[0].icon
        });
      }

      return {
        city: response.data.city.name,
        country: response.data.city.country,
        forecasts: dailyForecasts.slice(0, days)
      };
    } catch (error) {
      console.warn('Weather forecast API failed, returning mock data:', error.message);
      return this.getMockForecast(city, days);
    }
  }

  getMockWeather(city) {
    const mockConditions = ['sunny', 'partly cloudy', 'cloudy', 'light rain'];
    const condition = mockConditions[Math.floor(Math.random() * mockConditions.length)];
    
    return {
      city: city || 'Unknown City',
      country: 'Unknown',
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      description: condition,
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
      icon: '01d',
      mockData: true
    };
  }

  getMockForecast(city, days) {
    const forecasts = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        temperature: Math.floor(Math.random() * 15) + 20,
        description: ['sunny', 'partly cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 10) + 5,
        icon: '01d'
      });
    }

    return {
      city: city || 'Unknown City',
      country: 'Unknown',
      forecasts,
      mockData: true
    };
  }
}

module.exports = new WeatherService();
