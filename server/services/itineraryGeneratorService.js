const groqService = require('./groqService');
const PromptBuilder = require('../llm/promptBuilder');
const logger = require('../utils/logger');

class ItineraryGeneratorService {
  async generateFullItinerary(itineraryData) {
    try {
      logger.info('Generating full itinerary with LLM', { 
        destinations: itineraryData.destinations.map(d => d.name),
        days: itineraryData.numberOfDays 
      });

      // Build comprehensive prompt for itinerary generation
      const prompt = this.buildItineraryGenerationPrompt(itineraryData);
      
      const response = await groqService.chatCompletion([
        {
          role: 'system',
          content: `You are an expert travel planner. Generate detailed day-by-day itineraries in JSON format. 
          Your response must be valid JSON that matches the dailyItinerary schema.
          
          For each day, provide:
          - day: number
          - date: ISO date string
          - location: string
          - activities: array of strings (3-5 activities per day)
          - meals: object with breakfast, lunch, dinner recommendations
          - accommodation: object with name, address, rating, price, currency
          - transportation: object with mode, details, cost, currency
          - estimatedCost: number (daily total cost)
          
          Consider the user's budget level, interests, and travel style.`
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        maxTokens: 4000,
        temperature: 0.7
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      // Parse the JSON response
      const dailyItinerary = this.parseAIResponse(aiResponse, itineraryData);
      
      return {
        success: true,
        dailyItinerary,
        totalCost: this.calculateTotalCost(dailyItinerary),
        aiModel: 'llama3-8b-8192'
      };

    } catch (error) {
      logger.error('Error generating itinerary:', error);
      
      // Fallback to template-based generation
      return this.generateFallbackItinerary(itineraryData);
    }
  }

  buildItineraryGenerationPrompt(itineraryData) {
    const destinations = itineraryData.destinations.map(d => d.name).join(', ');
    const interests = itineraryData.interests.join(', ') || 'general sightseeing';
    
    return `Generate a detailed ${itineraryData.numberOfDays}-day travel itinerary for ${itineraryData.travelers} traveler(s).

TRIP DETAILS:
- Start Location: ${itineraryData.startLocation}
- Destinations: ${destinations}
- Start Date: ${itineraryData.startDate.toISOString().split('T')[0]}
- Budget Level: ${itineraryData.budget}
- Interests: ${interests}
- Daily Time: ${itineraryData.preferences.startTime} to ${itineraryData.preferences.endTime}
- Currency: ${itineraryData.preferences.currency}

BUDGET GUIDELINES:
- Low: Budget accommodations, local food, public transport
- Moderate: Mid-range hotels, mix of local and restaurant meals, mix of transport
- High: Premium hotels, fine dining, private transport/taxis

For each day, provide a JSON object with:
1. day: day number (1, 2, 3...)
2. date: date in YYYY-MM-DD format
3. location: primary city/area for that day
4. activities: array of 3-5 specific activities with descriptions
5. meals: breakfast, lunch, dinner recommendations with restaurant names
6. accommodation: hotel name, address, rating (1-5), price per night, currency
7. transportation: mode (flight/train/bus/car), details, estimated cost, currency
8. estimatedCost: total estimated cost for the day in ${itineraryData.preferences.currency}

Return ONLY valid JSON array of daily itinerary objects. No explanations or markdown.`;
  }

  parseAIResponse(aiResponse, itineraryData) {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to parse as JSON
      let dailyItinerary = JSON.parse(cleanedResponse);
      
      // Ensure it's an array
      if (!Array.isArray(dailyItinerary)) {
        throw new Error('Response is not an array');
      }

      // Validate and enhance each day
      return dailyItinerary.map((day, index) => {
        const dayDate = new Date(itineraryData.startDate);
        dayDate.setDate(dayDate.getDate() + index);

        return {
          day: day.day || (index + 1),
          date: day.date || dayDate.toISOString().split('T')[0],
          location: day.location || itineraryData.destinations[0]?.name || 'Unknown',
          activities: Array.isArray(day.activities) ? day.activities : ['Explore the area', 'Local sightseeing'],
          meals: {
            breakfast: day.meals?.breakfast || 'Local café breakfast',
            lunch: day.meals?.lunch || 'Local restaurant lunch',
            dinner: day.meals?.dinner || 'Local restaurant dinner'
          },
          accommodation: {
            name: day.accommodation?.name || 'Local hotel',
            address: day.accommodation?.address || 'City center',
            rating: day.accommodation?.rating || 3,
            price: day.accommodation?.price || this.getDefaultPrice(itineraryData.budget),
            currency: day.accommodation?.currency || itineraryData.preferences.currency
          },
          transportation: {
            mode: day.transportation?.mode || 'walking',
            details: day.transportation?.details || 'Local transportation',
            cost: day.transportation?.cost || 0,
            currency: day.transportation?.currency || itineraryData.preferences.currency
          },
          estimatedCost: day.estimatedCost || this.getDefaultDailyCost(itineraryData.budget)
        };
      });

    } catch (error) {
      logger.error('Error parsing AI response:', error);
      
      // Return fallback structure
      return this.generateFallbackItinerary(itineraryData).dailyItinerary;
    }
  }

  generateFallbackItinerary(itineraryData) {
    logger.info('Generating fallback itinerary');
    
    const dailyItinerary = [];
    const defaultCost = this.getDefaultDailyCost(itineraryData.budget);
    const defaultPrice = this.getDefaultPrice(itineraryData.budget);

    for (let i = 0; i < itineraryData.numberOfDays; i++) {
      const dayDate = new Date(itineraryData.startDate);
      dayDate.setDate(dayDate.getDate() + i);
      
      const destinationIndex = Math.floor(i / Math.ceil(itineraryData.numberOfDays / itineraryData.destinations.length));
      const currentDestination = itineraryData.destinations[destinationIndex]?.name || 'Unknown';

      dailyItinerary.push({
        day: i + 1,
        date: dayDate.toISOString().split('T')[0],
        location: currentDestination,
        activities: [
          `Explore ${currentDestination} city center`,
          'Visit local attractions',
          'Try local cuisine',
          'Evening leisure time'
        ],
        meals: {
          breakfast: 'Local café breakfast',
          lunch: 'Traditional local restaurant',
          dinner: 'Recommended local dining'
        },
        accommodation: {
          name: `${currentDestination} Hotel`,
          address: `${currentDestination} city center`,
          rating: 3,
          price: defaultPrice,
          currency: itineraryData.preferences.currency
        },
        transportation: {
          mode: 'walking',
          details: 'Local transportation and walking',
          cost: 20,
          currency: itineraryData.preferences.currency
        },
        estimatedCost: defaultCost
      });
    }

    return {
      success: true,
      dailyItinerary,
      totalCost: defaultCost * itineraryData.numberOfDays,
      aiModel: 'fallback'
    };
  }

  getDefaultDailyCost(budget) {
    switch (budget) {
      case 'low': return 50;
      case 'moderate': return 150;
      case 'high': return 400;
      default: return 150;
    }
  }

  getDefaultPrice(budget) {
    switch (budget) {
      case 'low': return 25;
      case 'moderate': return 80;
      case 'high': return 200;
      default: return 80;
    }
  }

  calculateTotalCost(dailyItinerary) {
    return dailyItinerary.reduce((total, day) => total + (day.estimatedCost || 0), 0);
  }
}

module.exports = new ItineraryGeneratorService();