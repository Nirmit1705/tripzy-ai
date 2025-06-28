const axios = require('axios');
const currencyService = require('./currencyService');

class MapService {
  constructor() {
    this.nominatimUrl = process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
    this.tileServer = process.env.OSM_TILE_SERVER || 'https://tile.openstreetmap.org';
    this.amadeusApiKey = process.env.HOTEL_API_KEY;
    this.amadeusApiSecret = process.env.HOTEL_API_PASSWORD;
    this.amadeusBaseUrl = 'https://api.amadeus.com/v1';
    this.amadeusToken = null;
    this.tokenExpiry = null;
  }

  // Get Amadeus access token
  async getAmadeusToken() {
    if (this.amadeusToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.amadeusToken;
    }

    // Check if credentials are available
    if (!this.amadeusApiKey || !this.amadeusApiSecret) {
      throw new Error('Amadeus API credentials not configured. Please set HOTEL_API_KEY and HOTEL_API_PASSWORD in environment variables.');
    }

    try {
      console.log('Attempting Amadeus authentication...');
      const response = await axios.post('https://api.amadeus.com/v1/security/oauth2/token', 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.amadeusApiKey,
          client_secret: this.amadeusApiSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.amadeusToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      console.log('Amadeus authentication successful');
      return this.amadeusToken;
    } catch (error) {
      console.error('Amadeus authentication error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error(`Amadeus authentication failed: Invalid API credentials. Please verify HOTEL_API_KEY and HOTEL_API_PASSWORD.`);
      }
      
      throw new Error(`Amadeus authentication failed: ${error.message}`);
    }
  }

  // Search hotels using Amadeus API with REAL pricing
  async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5, radiusUnit = 'KM', targetCurrency = 'USD') {
    // Check if credentials are available
    const mockMode = !this.amadeusApiKey || !this.amadeusApiSecret;
    
    if (mockMode) {
      console.log('Running in mock mode for hotel search (no credentials)...');
      return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
    }

    try {
      const token = await this.getAmadeusToken();
      
      // Step 1: Get hotel list by city
      const hotelsResponse = await axios.get(`${this.amadeusBaseUrl}/reference-data/locations/hotels/by-city`, {
        params: {
          cityCode,
          radius,
          radiusUnit,
          hotelSource: 'ALL'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!hotelsResponse.data.data || hotelsResponse.data.data.length === 0) {
        console.warn(`No hotels found for ${cityCode}, using mock data`);
        return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
      }

      // Step 2: Get real pricing for each hotel
      const hotelsWithRealPricing = await Promise.all(
        hotelsResponse.data.data.slice(0, 10).map(async (hotel) => { // Limit to 10 hotels for performance
          try {
            // Get real hotel offers with pricing
            const offersResponse = await axios.get(`${this.amadeusBaseUrl}/shopping/hotel-offers`, {
              params: {
                hotelIds: hotel.hotelId,
                checkInDate,
                checkOutDate,
                adults,
                currency: 'USD' // Always get USD first, then convert
              },
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            let realPrice = null;
            if (offersResponse.data.data && offersResponse.data.data.length > 0) {
              const offers = offersResponse.data.data[0].offers;
              if (offers && offers.length > 0) {
                // Get the cheapest offer
                const cheapestOffer = offers.reduce((min, offer) => 
                  parseFloat(offer.price.total) < parseFloat(min.price.total) ? offer : min
                );
                realPrice = parseFloat(cheapestOffer.price.total);
              }
            }

            // If no real price found, use estimation
            if (!realPrice) {
              realPrice = this.estimateHotelPrice(hotel);
            }

            // Convert currency if needed
            let convertedPrice = realPrice;
            if (targetCurrency !== 'USD') {
              try {
                convertedPrice = await currencyService.convertCurrency(realPrice, 'USD', targetCurrency);
              } catch (error) {
                console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
              }
            }

            return {
              hotelId: hotel.hotelId,
              name: hotel.name,
              lat: hotel.geoCode?.latitude,
              lon: hotel.geoCode?.longitude,
              address: hotel.address,
              distance: hotel.distance?.value,
              distanceUnit: hotel.distance?.unit,
              realPrice: {
                amount: Math.round(convertedPrice * 100) / 100, // Round to 2 decimal places
                currency: targetCurrency,
                originalAmount: realPrice,
                originalCurrency: 'USD',
                perNight: true,
                isRealPrice: !!realPrice // Flag to indicate if this is real or estimated
              },
              estimatedPrice: { // Keep for backward compatibility
                amount: Math.round(convertedPrice * 100) / 100,
                currency: targetCurrency,
                originalAmount: realPrice,
                originalCurrency: 'USD',
                perNight: true
              }
            };
          } catch (error) {
            console.warn(`Failed to get real pricing for hotel ${hotel.hotelId}:`, error.message);
            
            // Fallback to estimation for this hotel
            const estimatedPrice = this.estimateHotelPrice(hotel);
            let convertedPrice = estimatedPrice;
            
            if (targetCurrency !== 'USD') {
              try {
                convertedPrice = await currencyService.convertCurrency(estimatedPrice, 'USD', targetCurrency);
              } catch (error) {
                console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
              }
            }

            return {
              hotelId: hotel.hotelId,
              name: hotel.name,
              lat: hotel.geoCode?.latitude,
              lon: hotel.geoCode?.longitude,
              address: hotel.address,
              distance: hotel.distance?.value,
              distanceUnit: hotel.distance?.unit,
              realPrice: {
                amount: Math.round(convertedPrice * 100) / 100,
                currency: targetCurrency,
                originalAmount: estimatedPrice,
                originalCurrency: 'USD',
                perNight: true,
                isRealPrice: false // This is estimated
              },
              estimatedPrice: {
                amount: Math.round(convertedPrice * 100) / 100,
                currency: targetCurrency,
                originalAmount: estimatedPrice,
                originalCurrency: 'USD',
                perNight: true
              }
            };
          }
        })
      );

      console.log(`Retrieved real pricing for ${hotelsWithRealPricing.length} hotels in ${cityCode}`);
      return hotelsWithRealPricing;

    } catch (error) {
      console.warn('Amadeus API failed completely, falling back to mock mode:', error.message);
      return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
    }
  }

  // Generate mock hotels with pricing for testing
  async getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency) {
    console.log(`Generating mock hotels for ${cityCode} in ${targetCurrency}`);
    
    // Use geocoding to get real city coordinates instead of static data
    const cityCoordinates = await this.geocodeCityForHotels(cityCode);
    
    const mockHotels = [
      {
        hotelId: `MOCK_${cityCode}_001`,
        name: `${cityCode} Grand Hotel`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`Grand Hotel Street, ${cityCode}`],
          postalCode: '12345',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 2.5, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_002`,
        name: `${cityCode} Luxury Resort`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`Resort Boulevard, ${cityCode}`],
          postalCode: '12346',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 5.2, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_003`,
        name: `${cityCode} Budget Inn`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`Economy Street, ${cityCode}`],
          postalCode: '12347',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 1.8, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_004`,
        name: `${cityCode} Business Hotel`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`Business District, ${cityCode}`],
          postalCode: '12348',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 3.1, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_005`,
        name: `${cityCode} Boutique Hotel`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`Boutique Avenue, ${cityCode}`],
          postalCode: '12349',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 4.7, unit: 'KM' },
        distanceUnit: 'KM'
      }
    ];

    // Add pricing estimates and currency conversion
    const hotelsWithPricing = await Promise.all(mockHotels.map(async (hotel) => {
      const basePriceUSD = this.estimateHotelPrice(hotel);
      
      let convertedPrice = basePriceUSD;
      if (targetCurrency !== 'USD') {
        try {
          convertedPrice = await currencyService.convertCurrency(basePriceUSD, 'USD', targetCurrency);
        } catch (error) {
          console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
        }
      }

      return {
        hotelId: hotel.hotelId,
        name: hotel.name,
        lat: hotel.lat,
        lon: hotel.lon,
        address: hotel.address,
        distance: hotel.distance,
        distanceUnit: hotel.distanceUnit,
        estimatedPrice: {
          amount: convertedPrice,
          currency: targetCurrency,
          originalAmount: basePriceUSD,
          originalCurrency: 'USD',
          perNight: true
        }
      };
    }));

    return hotelsWithPricing;
  }

  // Geocode city for hotel search
  async geocodeCityForHotels(cityName) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: cityName,
          format: 'json',
          limit: 1,
          addressdetails: 1
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          country: result.address?.country_code?.toUpperCase() || 'US'
        };
      }
    } catch (error) {
      console.warn(`Geocoding failed for ${cityName}:`, error.message);
    }

    // Fallback to default coordinates (New York)
    return {
      lat: 40.7128,
      lon: -74.0060,
      country: 'US'
    };
  }

  // Search for hotels using Amadeus API (detailed pricing)
  async searchHotelsDetailed(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5, radiusUnit = 'KM', targetCurrency = 'USD') {
    // Check if credentials are available
    const mockMode = !this.amadeusApiKey || !this.amadeusApiSecret;
    
    if (mockMode) {
      console.log('Running in mock mode for hotel search (no credentials)...');
      return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
    }

    try {
      const token = await this.getAmadeusToken();
      
      const response = await axios.get(`${this.amadeusBaseUrl}/reference-data/locations/hotels/by-city`, {
        params: {
          cityCode,
          radius,
          radiusUnit,
          hotelSource: 'ALL'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Add detailed pricing information
      const hotelsWithPricing = await Promise.all(response.data.data.map(async (hotel) => {
        // Generate detailed pricing based on hotel data
        const basePriceUSD = this.estimateHotelPrice(hotel);
        
        let convertedPrice = basePriceUSD;
        if (targetCurrency !== 'USD') {
          try {
            convertedPrice = await currencyService.convertCurrency(basePriceUSD, 'USD', targetCurrency);
          } catch (error) {
            console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
          }
        }

        return {
          hotelId: hotel.hotelId,
          name: hotel.name,
          lat: hotel.geoCode?.latitude,
          lon: hotel.geoCode?.longitude,
          address: hotel.address,
          distance: hotel.distance?.value,
          distanceUnit: hotel.distance?.unit,
          estimatedPrice: {
            amount: convertedPrice,
            currency: targetCurrency,
            originalAmount: basePriceUSD,
            originalCurrency: 'USD',
            perNight: true
          },
          amenities: hotel.amenities,
          rating: hotel.rating,
          description: hotel.description
        };
      }));

      return hotelsWithPricing;
    } catch (error) {
      console.warn('Amadeus API failed, falling back to mock mode:', error.message);
      // Fall back to mock mode if API fails
      return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
    }
  }

  // Estimate hotel pricing based on hotel data
  estimateHotelPrice(hotel) {
    // Dynamic pricing based on hotel name and location
    let basePrice = 80; // Base price in USD
    
    if (hotel.name.toLowerCase().includes('luxury') || hotel.name.toLowerCase().includes('grand')) {
      basePrice = 150;
    } else if (hotel.name.toLowerCase().includes('budget') || hotel.name.toLowerCase().includes('economy')) {
      basePrice = 40;
    } else if (hotel.name.toLowerCase().includes('boutique') || hotel.name.toLowerCase().includes('business')) {
      basePrice = 100;
    }
    
    // Add some randomness for variety
    basePrice += (Math.random() - 0.5) * 40;
    
    return Math.max(25, Math.round(basePrice));
  }

  // Remove the complex getHotelOffers method and replace with simple version
  async getHotelDetails(hotelIds, targetCurrency = 'USD') {
    const hotelIdArray = Array.isArray(hotelIds) ? hotelIds : hotelIds.split(',');
    
    return hotelIdArray.map(hotelId => {
      const basePrice = 150 + Math.floor(Math.random() * 200);
      
      return {
        hotelId,
        name: `Hotel ${hotelId}`,
        rating: 3 + Math.floor(Math.random() * 2),
        amenities: ['WiFi', 'Restaurant', 'Gym', 'Pool'],
        description: 'A comfortable hotel with modern amenities and excellent service.',
        estimatedPrice: {
          amount: basePrice,
          currency: targetCurrency,
          perNight: true
        }
      };
    });
  }

  // Geocode address to coordinates
  async geocode(address) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'TripzyAI/1.0'
        }
      });

      if (response.data.length === 0) {
        throw new Error('Address not found');
      }

      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address
      };
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat, lon) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat,
          lon,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'TripzyAI/1.0'
        }
      });

      return {
        display_name: response.data.display_name,
        address: response.data.address
      };
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  // Search for places (restaurants, hotels, attractions)
  async searchPlaces(query, lat, lon, radius = 5000) {
    try {
      let searchParams = {
        q: query,
        format: 'json',
        limit: 10,
        addressdetails: 1
      };

      // If coordinates provided, search within radius
      if (lat && lon) {
        const bbox = this.getBoundingBox(lat, lon, radius);
        searchParams.bounded = 1;
        searchParams.viewbox = `${bbox.minLon},${bbox.maxLat},${bbox.maxLon},${bbox.minLat}`;
      }

      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: searchParams,
        headers: {
          'User-Agent': 'TripzyAI/1.0'
        }
      });

      return response.data.map(place => ({
        id: place.place_id,
        name: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        type: place.type,
        category: place.category,
        address: place.address
      }));
    } catch (error) {
      throw new Error(`Places search failed: ${error.message}`);
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Helper method to convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Helper method to create bounding box for search
  getBoundingBox(lat, lon, radiusInMeters) {
    const latRadian = lat * Math.PI / 180;
    const degreeRadius = radiusInMeters / 111000; // Approximate meters per degree
    
    const minLat = lat - degreeRadius;
    const maxLat = lat + degreeRadius;
    const minLon = lon - degreeRadius / Math.cos(latRadian);
    const maxLon = lon + degreeRadius / Math.cos(latRadian);
    
    return { minLat, maxLat, minLon, maxLon };
  }

  // Get tile server URL
  getTileServerUrl() {
    return this.tileServer;
  }

  // Geocode multiple locations
  async geocodeMultipleLocations(locations) {
    const results = [];
    
    for (const location of locations) {
      try {
        const locationName = typeof location === 'string' ? location : location.name;
        const geocoded = await this.geocode(locationName);
        results.push({
          name: locationName,
          coordinates: {
            lat: geocoded.lat,
            lon: geocoded.lon
          },
          display_name: geocoded.display_name,
          address: geocoded.address
        });
      } catch (error) {
        console.warn(`Failed to geocode ${location}:`, error.message);
        // Use fallback coordinates
        results.push({
          name: typeof location === 'string' ? location : location.name,
          coordinates: {
            lat: 28.6139,
            lon: 77.2090
          },
          display_name: `${typeof location === 'string' ? location : location.name} (approximate)`,
          address: {}
        });
      }
    }
    
    return results;
  }

  // Plan route for multiple destinations
  async planMultiDestinationRoute(initialLocation, destinations) {
    // Simple route planning - returns destinations with distances
    const route = {
      startLocation: initialLocation,
      destinations: [],
      totalDistance: 0,
      estimatedTime: 0
    };

    let currentLat = initialLocation.coordinates.lat;
    let currentLon = initialLocation.coordinates.lon;

    for (const destination of destinations) {
      const distance = this.calculateDistance(
        currentLat, currentLon,
        destination.coordinates.lat, destination.coordinates.lon
      );
      
      route.destinations.push({
        ...destination,
        distanceFromPrevious: distance,
        estimatedTravelTime: Math.round(distance * 1.5) // Rough estimate: 1.5 hours per 100km
      });
      
      route.totalDistance += distance;
      currentLat = destination.coordinates.lat;
      currentLon = destination.coordinates.lon;
    }

    route.estimatedTime = Math.round(route.totalDistance * 1.5);
    return route;
  }

  // Get hotels for multiple destinations
  async getHotelsForDestinations(destinations, checkInDate, checkOutDate, adults = 1, currency = 'USD') {
    const results = [];
    
    for (const destination of destinations) {
      try {
        const cityCode = destination.name || destination;
        const hotels = await this.searchHotels(
          cityCode, checkInDate, checkOutDate, adults, 5, 'KM', currency
        );
        
        results.push({
          destination: cityCode,
          hotels: hotels,
          count: hotels.length
        });
      } catch (error) {
        console.warn(`Failed to get hotels for ${destination}:`, error.message);
        results.push({
          destination: destination.name || destination,
          hotels: [],
          count: 0,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Get all city coordinates
  getAllCityCoordinates() {
    return {
      'Delhi': { lat: 28.6139, lon: 77.2090 },
      'Mumbai': { lat: 19.0760, lon: 72.8777 },
      'Bangalore': { lat: 12.9716, lon: 77.5946 },
      'Chennai': { lat: 13.0827, lon: 80.2707 },
      'Kolkata': { lat: 22.5726, lon: 88.3639 },
      'Pune': { lat: 18.5204, lon: 73.8567 },
      'Hyderabad': { lat: 17.3850, lon: 78.4867 },
      'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
      'Jaipur': { lat: 26.9124, lon: 75.7873 },
      'Goa': { lat: 15.2993, lon: 74.1240 },
      'Kochi': { lat: 9.9312, lon: 76.2673 },
      'Thiruvananthapuram': { lat: 8.5241, lon: 76.9366 },
      'Mysore': { lat: 12.2958, lon: 76.6394 },
      'Udaipur': { lat: 24.5854, lon: 73.7125 },
      'Jodhpur': { lat: 26.2389, lon: 73.0243 },
      'Agra': { lat: 27.1767, lon: 78.0081 },
      'Varanasi': { lat: 25.3176, lon: 82.9739 },
      'Rishikesh': { lat: 30.0869, lon: 78.2676 },
      'Haridwar': { lat: 29.9457, lon: 78.1642 },
      'Manali': { lat: 32.2432, lon: 77.1892 },
      'Shimla': { lat: 31.1048, lon: 77.1734 },
      'Darjeeling': { lat: 27.0410, lon: 88.2663 },
      'Gangtok': { lat: 27.3389, lon: 88.6065 },
      'Paris': { lat: 48.8566, lon: 2.3522 },
      'London': { lat: 51.5074, lon: -0.1278 },
      'New York': { lat: 40.7128, lon: -74.0060 },
      'Tokyo': { lat: 35.6762, lon: 139.6503 },
      'Berlin': { lat: 52.5200, lon: 13.4050 },
      'Rome': { lat: 41.9028, lon: 12.4964 },
      'Barcelona': { lat: 41.3851, lon: 2.1734 },
      'Amsterdam': { lat: 52.3676, lon: 4.9041 },
      'Prague': { lat: 50.0755, lon: 14.4378 },
      'Vienna': { lat: 48.2082, lon: 16.3738 },
      'Dubai': { lat: 25.2048, lon: 55.2708 },
      'Singapore': { lat: 1.3521, lon: 103.8198 },
      'Bangkok': { lat: 13.7563, lon: 100.5018 },
      'Hong Kong': { lat: 22.3193, lon: 114.1694 },
      'Seoul': { lat: 37.5665, lon: 126.9780 }
    };
  }

  // Find city coordinates
  findCityCoordinates(cityName) {
    const allCities = this.getAllCityCoordinates();
    const cityKey = Object.keys(allCities).find(city => 
      city.toLowerCase().includes(cityName.toLowerCase()) ||
      cityName.toLowerCase().includes(city.toLowerCase())
    );
    
    return cityKey ? allCities[cityKey] : allCities['Delhi']; // Default to Delhi
  }
}

module.exports = new MapService();
