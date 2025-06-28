const groqService = require('./groqService');
const PromptBuilder = require('../llm/promptBuilder');
const logger = require('../utils/logger');
const weatherService = require('./weatherService');

class ItineraryGeneratorService {
  async generateFullItinerary(itineraryData) {
    try {
      logger.info('Generating full itinerary with LLM', { 
        destinations: itineraryData.destinations.map(d => d.name),
        days: itineraryData.numberOfDays 
      });

      // Try multiple attempts to get valid LLM response
      let dailyItinerary = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!dailyItinerary && attempts < maxAttempts) {
        attempts++;
        logger.info(`LLM generation attempt ${attempts}/${maxAttempts}`);
        
        try {
          dailyItinerary = await this.attemptLLMGeneration(itineraryData);
        } catch (error) {
          logger.warn(`LLM attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) {
            throw error;
          }
        }
      }

      if (!dailyItinerary) {
        throw new Error('Failed to generate itinerary after multiple attempts');
      }
      
      // Fetch weather data for the itinerary
      const weatherData = await this.addWeatherToItinerary(dailyItinerary);
      
      return {
        success: true,
        dailyItinerary: weatherData,
        totalCost: this.calculateTotalCost(weatherData),
        aiModel: 'llama3-8b-8192'
      };

    } catch (error) {
      logger.error('Error generating itinerary:', error);
      throw new Error(`Itinerary generation failed: ${error.message}`);
    }
  }

  attemptLLMGeneration(itineraryData) {
    const prompt = this.buildEnhancedItineraryPrompt(itineraryData);
    
    return groqService.chatCompletion([
      {
        role: 'system',
        content: `You are an expert travel planner with extensive knowledge of real places worldwide. 
        
        CRITICAL REQUIREMENTS:
        1. Use ONLY real, existing places, hotels, restaurants, and attractions
        2. Research actual establishment names (e.g., "The Taj Mahal Palace Mumbai", "Karim's Restaurant Delhi")
        3. Provide specific addresses and realistic pricing
        4. Return ONLY valid JSON array - no markdown, no explanations
        5. Each day must have real activities with actual place names
        
        JSON Structure required:
        [
          {
            "day": 1,
            "date": "2024-01-15",
            "location": "City Name",
            "activities": ["Real Place 1", "Real Place 2", "Real Place 3", "Real Place 4"],
            "meals": {
              "breakfast": "Real Restaurant Name - Signature Dish",
              "lunch": "Real Restaurant Name - Recommended Item", 
              "dinner": "Real Restaurant Name - Cuisine Type"
            },
            "accommodation": {
              "name": "Real Hotel Name",
              "address": "Actual Street Address",
              "rating": 4.2,
              "price": 120,
              "currency": "USD"
            },
            "transportation": {
              "mode": "Specific Transport Type",
              "details": "Specific route/booking details",
              "cost": 50,
              "currency": "USD"
            },
            "estimatedCost": 250
          }
        ]`
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      maxTokens: 4000,
      temperature: 0.8
    }).then(response => {
      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from LLM service');
      }

      return this.parseAndValidateLLMResponse(aiResponse, itineraryData);
    });
  }

  buildEnhancedItineraryPrompt(itineraryData) {
    const destinations = itineraryData.destinations.map(d => d.name).join(', ');
    const interests = itineraryData.interests.join(', ') || 'general exploration';
    
    return `Create a ${itineraryData.numberOfDays}-day travel itinerary with REAL places and ACCURATE pricing.

TRIP REQUIREMENTS:
- Start: ${itineraryData.startLocation}
- Destinations: ${destinations}
- Start Date: ${itineraryData.startDate.toISOString().split('T')[0]}
- Travelers: ${itineraryData.travelers}
- Budget: ${itineraryData.budget} 
- Interests: ${interests}
- Currency: ${itineraryData.preferences.currency}

RESEARCH REAL PLACES WITH ACTUAL PRICING:
${destinations.split(', ').map(dest => `
${dest.toUpperCase()}:
- Find actual hotels with REAL current rates (check recent prices)
- Research real restaurants with actual menu prices
- Include specific attractions with real entry fees
- Use actual transport costs (metro fares, taxi rates)
`).join('')}

BUDGET GUIDELINES WITH REAL PRICING:
- Low: Budget hotels ($25-50/night), street food ($3-8/meal), public transport ($1-3/trip)
- Moderate: Mid-range hotels ($60-120/night), restaurants ($15-30/meal), mixed transport ($5-15/trip)  
- High: Luxury hotels ($150-400/night), fine dining ($40-80/meal), private transport ($20-50/trip)

MANDATORY REAL DATA WITH ACCURATE COSTS:
✓ Actual hotel names with current nightly rates
✓ Real restaurant names with approximate meal costs
✓ Specific attractions with actual entry fees
✓ Real transport costs (exact metro/taxi fares)
✓ Current exchange rates for pricing

PRICING ACCURACY REQUIREMENTS:
- Hotel prices must reflect current market rates
- Restaurant costs should match actual menu prices  
- Transport costs must be current fare structures
- Total daily costs should be realistic and achievable

Return JSON array starting with [ and ending with ]. No explanations.`;
  }

  parseAndValidateLLMResponse(aiResponse, itineraryData) {
    try {
      // Clean the response thoroughly
      let cleanedResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^[\{]*/, '') 
        .replace(/[^}\]]*$/, '')
        .trim();
      
      logger.info('Parsing LLM response length:', cleanedResponse.length);
      
      let dailyItinerary = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(dailyItinerary)) {
        if (typeof dailyItinerary === 'object' && dailyItinerary !== null) {
          dailyItinerary = [dailyItinerary];
        } else {
          throw new Error('LLM response is not valid JSON array');
        }
      }

      // Validate that we have the right number of days
      if (dailyItinerary.length !== itineraryData.numberOfDays) {
        throw new Error(`Expected ${itineraryData.numberOfDays} days, got ${dailyItinerary.length}`);
      }

      // Validate each day has required fields with real data
      return dailyItinerary.map((day, index) => {
        if (!day.activities || !Array.isArray(day.activities) || day.activities.length === 0) {
          throw new Error(`Day ${index + 1} missing activities`);
        }
        
        if (!day.meals || !day.meals.breakfast || !day.meals.lunch || !day.meals.dinner) {
          throw new Error(`Day ${index + 1} missing meal recommendations`);
        }
        
        if (!day.accommodation || !day.accommodation.name) {
          throw new Error(`Day ${index + 1} missing accommodation`);
        }

        // Ensure proper date formatting
        const dayDate = new Date(itineraryData.startDate);
        dayDate.setDate(dayDate.getDate() + index);

        return {
          day: day.day || (index + 1),
          date: day.date || dayDate.toISOString().split('T')[0],
          location: day.location,
          activities: day.activities,
          meals: day.meals,
          accommodation: {
            name: day.accommodation.name,
            address: day.accommodation.address,
            rating: day.accommodation.rating || 4.0,
            price: day.accommodation.price,
            currency: day.accommodation.currency || itineraryData.preferences.currency
          },
          transportation: {
            mode: day.transportation?.mode || 'Local transport',
            details: day.transportation?.details || 'As needed',
            cost: day.transportation?.cost || 0,
            currency: day.transportation?.currency || itineraryData.preferences.currency
          },
          estimatedCost: day.estimatedCost || 100
        };
      });

    } catch (error) {
      logger.error('Error parsing LLM response:', error);
      logger.error('Failed response sample:', aiResponse.substring(0, 500));
      throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
  }

  enhanceItineraryWithRealPricing(dailyItinerary, itineraryData) {
    const mapService = require('./mapService');
    
    return Promise.all(dailyItinerary.map(async (day) => {
      try {
        // Get real hotel pricing for this day's location
        const hotelResults = await mapService.searchHotels(
          day.location,
          day.date,
          day.date, // Same day for single night
          itineraryData.travelers,
          5,
          'KM',
          itineraryData.preferences.currency
        );

        if (hotelResults && hotelResults.length > 0) {
          // Filter hotels by budget preference
          let filteredHotels = hotelResults;
          
          if (itineraryData.budget === 'low') {
            filteredHotels = hotelResults.filter(h => h.realPrice.amount <= 70);
          } else if (itineraryData.budget === 'moderate') {
            filteredHotels = hotelResults.filter(h => h.realPrice.amount <= 150);
          } else if (itineraryData.budget === 'high') {
            filteredHotels = hotelResults.filter(h => h.realPrice.amount >= 120);
          }

          // Use filtered hotels or fall back to all hotels
          const availableHotels = filteredHotels.length > 0 ? filteredHotels : hotelResults;
          
          // Select a hotel (could be random or by preference)
          const selectedHotel = availableHotels[Math.floor(Math.random() * availableHotels.length)];
          
          // Update accommodation with real data
          return {
            ...day,
            accommodation: {
              name: selectedHotel.name,
              address: selectedHotel.address?.lines?.join(', ') || `${day.location} city center`,
              rating: selectedHotel.rating || 4.0,
              price: selectedHotel.realPrice.amount,
              currency: selectedHotel.realPrice.currency,
              isRealPrice: selectedHotel.realPrice.isRealPrice,
              hotelId: selectedHotel.hotelId
            },
            estimatedCost: this.recalculateDailyCost(day, selectedHotel.realPrice.amount)
          };
        }
      } catch (error) {
        console.warn(`Failed to get real pricing for ${day.location}:`, error.message);
      }
      
      // Return original day if pricing enhancement fails
      return day;
    }));
  }

  recalculateDailyCost(day, hotelPrice) {
    // Recalculate daily cost with real hotel price
    const mealCosts = {
      low: 20,      // $20 total for meals
      moderate: 50,  // $50 total for meals  
      high: 100     // $100 total for meals
    };
    
    const transportCosts = {
      low: 10,      // $10 for transport
      moderate: 25, // $25 for transport
      high: 50      // $50 for transport
    };
    
    // Estimate budget level from hotel price
    let budgetLevel = 'moderate';
    if (hotelPrice <= 50) budgetLevel = 'low';
    else if (hotelPrice >= 150) budgetLevel = 'high';
    
    return Math.round(hotelPrice + mealCosts[budgetLevel] + transportCosts[budgetLevel]);
  }

  async addWeatherToItinerary(dailyItinerary) {
    try {
      // First enhance with real pricing, then add weather
      const pricingEnhanced = await this.enhanceItineraryWithRealPricing(dailyItinerary, this.currentItineraryData);
      
      const weatherResults = await weatherService.getWeatherForItinerary(pricingEnhanced);
      
      return pricingEnhanced.map(day => {
        const dayWeather = weatherResults.find(w => w.day === day.day);
        return {
          ...day,
          weather: dayWeather ? dayWeather.weather : {
            temp: 'N/A',
            condition: 'Weather not available',
            humidity: 'N/A',
            available: false
          }
        };
      });
    } catch (error) {
      logger.warn('Failed to add weather to itinerary:', error);
      return dailyItinerary.map(day => ({
        ...day,
        weather: {
          temp: 'N/A',
          condition: 'Weather not available',
          humidity: 'N/A',
          available: false
        }
      }));
    }
  }

  async attemptLLMGeneration(itineraryData) {
    // Store for use in pricing enhancement
    this.currentItineraryData = itineraryData;
    
    const prompt = this.buildEnhancedItineraryPrompt(itineraryData);
    
    const response = await groqService.chatCompletion([
      {
        role: 'system',
        content: `You are an expert travel planner with extensive knowledge of real places worldwide. 
        
        CRITICAL REQUIREMENTS:
        1. Use ONLY real, existing places, hotels, restaurants, and attractions
        2. Research actual establishment names (e.g., "The Taj Mahal Palace Mumbai", "Karim's Restaurant Delhi")
        3. Provide specific addresses and realistic pricing
        4. Return ONLY valid JSON array - no markdown, no explanations
        5. Each day must have real activities with actual place names
        
        JSON Structure required:
        [
          {
            "day": 1,
            "date": "2024-01-15",
            "location": "City Name",
            "activities": ["Real Place 1", "Real Place 2", "Real Place 3", "Real Place 4"],
            "meals": {
              "breakfast": "Real Restaurant Name - Signature Dish",
              "lunch": "Real Restaurant Name - Recommended Item", 
              "dinner": "Real Restaurant Name - Cuisine Type"
            },
            "accommodation": {
              "name": "Real Hotel Name",
              "address": "Actual Street Address",
              "rating": 4.2,
              "price": 120,
              "currency": "USD"
            },
            "transportation": {
              "mode": "Specific Transport Type",
              "details": "Specific route/booking details",
              "cost": 50,
              "currency": "USD"
            },
            "estimatedCost": 250
          }
        ]`
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      maxTokens: 4000,
      temperature: 0.8
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from LLM service');
    }

    return this.parseAndValidateLLMResponse(aiResponse, itineraryData);
  }

  calculateTotalCost(dailyItinerary) {
    return dailyItinerary.reduce((total, day) => total + (day.estimatedCost || 0), 0);
  }

  // Remove all the generateDynamic* methods since we're using pure LLM data
}

module.exports = new ItineraryGeneratorService();