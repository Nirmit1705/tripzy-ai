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

  // Clear cache when needed
  clearCache() {
    this.cityCoordinatesCache = null;
  }
}

export default new MapService();
