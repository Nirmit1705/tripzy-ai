import apiService from './api';

class MapService {
  constructor() {
    this.defaultTileServer = 'https://tile.openstreetmap.org';
    this.cityCoordinatesCache = null;
  }

  // Get map configuration from backend
  async getMapConfig() {
    try {
      const response = await apiService.get('/map/config');
      return response.data;
    } catch (error) {
      console.warn('Failed to get map config from backend, using defaults:', error);
      return {
        tileServer: this.defaultTileServer,
        attribution: '© OpenStreetMap contributors'
      };
    }
  }

  // Geocode an address
  async geocode(address) {
    try {
      const response = await apiService.get('/map/geocode', { params: { address } });
      return response.data;
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw error;
    }
  }

  // Search for places
  async searchPlaces(query, lat, lon, radius = 5000) {
    try {
      const response = await apiService.get('/map/search', {
        params: { query, lat, lon, radius }
      });
      return response.data;
    } catch (error) {
      console.error('Place search failed:', error);
      throw error;
    }
  }

  // Get hotels for a city
  async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5, currency = 'USD') {
    try {
      const response = await apiService.get('/map/hotels', {
        params: {
          cityCode,
          checkInDate,
          checkOutDate,
          adults,
          radius,
          currency
        }
      });
      return response.data;
    } catch (error) {
      console.error('Hotel search failed:', error);
      throw error;
    }
  }

  // Calculate distance between two points
  async calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      const response = await apiService.get('/map/distance', {
        params: { lat1, lon1, lat2, lon2 }
      });
      return response.data;
    } catch (error) {
      console.error('Distance calculation failed:', error);
      throw error;
    }
  }

  // Get city coordinates from backend (with caching)
  async getCityCoordinates(cityName) {
    try {
      // Load all coordinates once and cache them
      if (!this.cityCoordinatesCache) {
        const response = await apiService.get('/map/city-coordinates', {
          params: { all: 'true' }
        });
        this.cityCoordinatesCache = response.data.data;
      }

      // Find coordinates for the specific city
      const cityData = this.cityCoordinatesCache[cityName];
      if (cityData) {
        return [cityData.lat, cityData.lon];
      }

      // Fallback: try fuzzy search via backend
      const response = await apiService.get('/map/city-coordinates', {
        params: { city: cityName }
      });
      const coords = response.data.data.coordinates;
      return [coords.lat, coords.lon];
    } catch (error) {
      console.warn('Failed to get coordinates from backend, using fallback:', error);
      // Fallback to Delhi coordinates
      return [28.6139, 77.2090];
    }
  }

  // Geocode multiple places for itinerary
  async geocodePlaces(places) {
    const results = [];
    
    for (const place of places) {
      try {
        const response = await this.geocode(place);
        results.push({
          name: place,
          lat: response.data.lat,
          lon: response.data.lon,
          display_name: response.data.display_name
        });
      } catch (error) {
        console.warn(`Failed to geocode ${place}, using fallback coordinates`);
        // Use cached coordinates or fallback
        const fallbackCoords = this.getFallbackCoordinates(place);
        results.push({
          name: place,
          lat: fallbackCoords[0],
          lon: fallbackCoords[1],
          display_name: place
        });
      }
    }
    
    return results;
  }

  // Get fallback coordinates for common places
  getFallbackCoordinates(placeName) {
    const coordinates = {
      'Delhi': [28.6139, 77.2090],
      'Mumbai': [19.0760, 72.8777],
      'Bangalore': [12.9716, 77.5946],
      'Chennai': [13.0827, 80.2707],
      'Kolkata': [22.5726, 88.3639],
      'Pune': [18.5204, 73.8567],
      'Hyderabad': [17.3850, 78.4867],
      'Ahmedabad': [23.0225, 72.5714],
      'Jaipur': [26.9124, 75.7873],
      'Goa': [15.2993, 74.1240],
      'Agra': [27.1767, 78.0081],
      'Varanasi': [25.3176, 82.9739],
      'Paris': [48.8566, 2.3522],
      'London': [51.5074, -0.1278],
      'New York': [40.7128, -74.0060],
      'Tokyo': [35.6762, 139.6503]
    };

    // Try to find matching city
    for (const [city, coords] of Object.entries(coordinates)) {
      if (placeName.toLowerCase().includes(city.toLowerCase()) || 
          city.toLowerCase().includes(placeName.toLowerCase())) {
        return coords;
      }
    }

    // Default to Delhi
    return [28.6139, 77.2090];
  }

  // Clear cache when needed
  clearCache() {
    this.cityCoordinatesCache = null;
  }
}

export default new MapService();
