const axios = require('axios');
const mapService = require('./mapService');

class HotelService {
  constructor() {
    this.apiKey = process.env.HOTEL_API_KEY;
  }

  async searchHotels(location, checkIn, checkOut, budget, travelers = 1, currency = 'USD') {
    try {
      console.log(`Searching hotels in ${location} with real pricing...`);
      
      // Use mapService to get real hotel pricing
      const hotels = await mapService.searchHotels(
        location,
        checkIn,
        checkOut,
        travelers,
        5,
        'KM',
        currency
      );

      // Filter by budget if specified
      if (budget) {
        const budgetRanges = {
          'low': { min: 0, max: 70 },
          'moderate': { min: 50, max: 150 },
          'high': { min: 120, max: 1000 }
        };

        const range = budgetRanges[budget.toLowerCase()];
        if (range) {
          return hotels.filter(hotel => 
            hotel.realPrice.amount >= range.min && 
            hotel.realPrice.amount <= range.max
          );
        }
      }

      return hotels;
    } catch (error) {
      console.error('Hotel search failed:', error);
      throw new Error(`Hotel search failed: ${error.message}`);
    }
  }

  async getHotelDetails(hotelId, checkIn, checkOut, currency = 'USD') {
    try {
      console.log(`Getting real pricing for hotel ${hotelId}...`);
      
      const offers = await mapService.getHotelOffers(
        hotelId,
        checkIn,
        checkOut,
        1,
        currency
      );

      if (offers && offers.length > 0) {
        return offers[0];
      }

      throw new Error('No hotel offers found');
    } catch (error) {
      console.error('Hotel details failed:', error);
      throw new Error(`Hotel details failed: ${error.message}`);
    }
  }
}

module.exports = new HotelService();
