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
        icon: response.data.weather[0].icon,
        condition: this.formatCondition(response.data.weather[0].main),
        temp: `${Math.round(response.data.main.temp)}°C`
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
          icon: forecast.weather[0].icon,
          condition: this.formatCondition(forecast.weather[0].main),
          temp: `${Math.round(forecast.main.temp)}°C`
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

  // Get weather for specific date and location
  async getWeatherForDate(city, date) {
    if (!this.apiKey) {
      console.warn('Weather API key not configured, returning mock data');
      return this.getMockWeatherForDate(city, date);
    }

    try {
      const currentDate = new Date();
      const targetDate = new Date(date);
      const daysDifference = Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24));

      // If the date is today or yesterday, get current weather
      if (daysDifference <= 1 && daysDifference >= -1) {
        return await this.getCurrentWeather(city);
      }

      // For future dates within 5 days, use forecast
      if (daysDifference > 1 && daysDifference <= 5) {
        const forecast = await this.getForecast(city, 5);
        const targetForecast = forecast.forecasts.find(f => f.date === date);
        
        if (targetForecast) {
          return {
            city: forecast.city,
            country: forecast.country,
            ...targetForecast
          };
        }
      }

      // For dates beyond forecast range, return mock data
      return this.getMockWeatherForDate(city, date);

    } catch (error) {
      console.warn(`Weather API failed for ${city} on ${date}, returning mock data:`, error.message);
      return this.getMockWeatherForDate(city, date);
    }
  }

  // Get weather for multiple locations and dates (for itinerary)
  async getWeatherForItinerary(dailyItinerary) {
    const weatherPromises = dailyItinerary.map(async (day) => {
      try {
        const weather = await this.getWeatherForDate(day.location, day.date);
        return {
          day: day.day,
          weather: {
            temp: weather.temp || `${weather.temperature}°C`,
            condition: weather.condition || weather.description,
            humidity: `${weather.humidity}%`,
            description: weather.description,
            icon: weather.icon,
            available: true
          }
        };
      } catch (error) {
        console.warn(`Failed to get weather for ${day.location} on ${day.date}:`, error.message);
        return {
          day: day.day,
          weather: {
            temp: 'N/A',
            condition: 'Weather not available',
            humidity: 'N/A',
            description: 'Weather data unavailable',
            available: false
          }
        };
      }
    });

    return Promise.all(weatherPromises);
  }

  formatCondition(weatherMain) {
    const conditionMap = {
      'Clear': 'Sunny',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Drizzle': 'Light Rain',
      'Thunderstorm': 'Thunderstorm',
      'Snow': 'Snowy',
      'Mist': 'Misty',
      'Fog': 'Foggy',
      'Haze': 'Hazy'
    };

    return conditionMap[weatherMain] || weatherMain || 'Pleasant';
  }

  getMockWeather(city) {
    const mockConditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
    const condition = mockConditions[Math.floor(Math.random() * mockConditions.length)];
    const temp = Math.floor(Math.random() * 15) + 20; // 20-35°C
    
    return {
      city: city || 'Unknown City',
      country: 'Unknown',
      temperature: temp,
      temp: `${temp}°C`,
      description: condition.toLowerCase(),
      condition: condition,
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
      icon: '01d',
      mockData: true,
      available: false
    };
  }

  getMockWeatherForDate(city, date) {
    const weather = this.getMockWeather(city);
    return {
      ...weather,
      date: date
    };
  }

  getMockForecast(city, days) {
    const forecasts = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const temp = Math.floor(Math.random() * 15) + 20;
      forecasts.push({
        date: date.toISOString().split('T')[0],
        temperature: temp,
        temp: `${temp}°C`,
        description: ['sunny', 'partly cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 10) + 5,
        icon: '01d',
        available: false
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
