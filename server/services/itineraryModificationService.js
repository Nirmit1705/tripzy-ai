const groqService = require('./groqService');
const Itinerary = require('../models/Itinerary');
const logger = require('../utils/logger');

class ItineraryModificationService {
  async modifyItinerary(itineraryId, userRequest, userId) {
    try {
      logger.info('Starting itinerary modification', { itineraryId, userRequest: userRequest.substring(0, 100) });

      // Get current itinerary
      const itinerary = await Itinerary.findOne({ _id: itineraryId, user: userId });
      
      if (!itinerary) {
        throw new Error('Itinerary not found or access denied');
      }

      // Analyze the modification request
      const modificationAnalysis = await this.analyzeModificationRequest(userRequest, itinerary);
      
      if (!modificationAnalysis.requiresModification) {
        return {
          success: false,
          message: modificationAnalysis.response,
          modified: false
        };
      }

      // Generate modified itinerary
      const modifiedItinerary = await this.generateModifiedItinerary(itinerary, userRequest, modificationAnalysis);
      
      // Update the itinerary in database
      itinerary.dailyItinerary = modifiedItinerary.dailyItinerary;
      itinerary.totalCost = this.calculateTotalCost(modifiedItinerary.dailyItinerary);
      itinerary.estimatedCost = itinerary.totalCost;
      
      await itinerary.save();

      return {
        success: true,
        message: modifiedItinerary.explanation,
        modified: true,
        itinerary: itinerary,
        changes: modificationAnalysis.changes
      };

    } catch (error) {
      logger.error('Error modifying itinerary:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an issue while modifying your itinerary. Please try again.',
        modified: false
      };
    }
  }

  async analyzeModificationRequest(userRequest, itinerary) {
    try {
      // Check if Groq API is available
      if (!process.env.GROQ_API_KEY) {
        logger.warn('Groq API key not configured, using fallback analysis');
        return this.getFallbackAnalysis(userRequest, itinerary);
      }

      const analysisPrompt = `Analyze this user request to determine if it requires modifying an existing travel itinerary:

USER REQUEST: "${userRequest}"

CURRENT ITINERARY SUMMARY:
- Destinations: ${itinerary.destinations?.map(d => d.name || d).join(', ') || 'Unknown'}
- Duration: ${itinerary.numberOfDays || 'Unknown'} days
- Budget: ${itinerary.budget || 'Unknown'}
- Current activities: ${itinerary.dailyItinerary?.map(day => day.activities?.slice(0, 2).join(', ')).join(' | ') || 'None set'}

CURRENT DAILY BREAKDOWN:
${itinerary.dailyItinerary?.map((day, index) => `
Day ${day.day || index + 1}:
- Location: ${day.location || 'Unknown'}
- Activities: ${day.activities?.join(', ') || 'None'}
- Hotel: ${day.accommodation?.name || 'Not set'}
- Meals: ${day.meals ? `${day.meals.breakfast || ''}, ${day.meals.lunch || ''}, ${day.meals.dinner || ''}` : 'Not set'}
`).join('') || 'No daily breakdown available'}

TASK: Determine if this request requires modifying the itinerary. Create SPECIFIC actionable changes based on the user's request and current itinerary.

Respond with JSON:
{
  "requiresModification": boolean,
  "modificationType": "add_activity" | "remove_activity" | "change_hotel" | "change_restaurant" | "change_transport" | "change_timing" | "change_day_plan" | "general_info",
  "targetDay": number or null,
  "changes": ["list of specific changes needed"],
  "actionableChanges": [
    {
      "id": "unique_id",
      "type": "add_activity" | "remove_activity" | "change_accommodation" | "change_meal" | "change_transport",
      "description": "Human readable description with SPECIFIC details",
      "targetDay": number,
      "targetField": "activities" | "accommodation" | "meals.breakfast" | "meals.lunch" | "meals.dinner" | "transportation",
      "newValue": "SPECIFIC new value based on destination and user request",
      "oldValue": "current value (if applicable)"
    }
  ],
  "response": "Brief response if no modification needed"
}

IMPORTANT GUIDELINES:
1. Make descriptions SPECIFIC to the request and destination
2. For activities: suggest real attractions, museums, restaurants, etc.
3. For hotels: suggest actual hotel types or specific accommodations
4. For meals: suggest specific cuisines or restaurant types
5. Extract day numbers from user request (e.g., "day 2", "second day")
6. If user says "change whole day" or "replace entire day", create multiple actionable changes

EXAMPLES:
- "Add Taj Mahal to day 2" → {"description": "Visit Taj Mahal on day 2", "newValue": "Visit Taj Mahal - UNESCO World Heritage Site"}
- "Change hotel to luxury" → {"description": "Upgrade to luxury accommodation", "newValue": "Luxury hotel with premium amenities"}
- "Replace lunch with Italian food" → {"description": "Change lunch to Italian cuisine", "newValue": "Italian restaurant for lunch"}`;

      const response = await groqService.chatCompletion([
        {
          role: 'system',
          content: 'You are an expert itinerary analysis assistant. Create SPECIFIC, actionable changes based on user requests and current itinerary data. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ], {
        maxTokens: 800,
        temperature: 0.4
      });

      let analysisResult;
      try {
        const cleanedResponse = response.choices[0]?.message?.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        logger.error('Failed to parse LLM response:', parseError);
        return this.getEnhancedFallbackAnalysis(userRequest, itinerary);
      }
      
      // Ensure actionableChanges exists
      if (!analysisResult.actionableChanges) {
        analysisResult.actionableChanges = [];
      }

      logger.info('Modification analysis result:', analysisResult);
      return analysisResult;

    } catch (error) {
      logger.error('Error analyzing modification request:', error);
      return this.getEnhancedFallbackAnalysis(userRequest, itinerary);
    }
  }

  getEnhancedFallbackAnalysis(userRequest, itinerary) {
    const lowerRequest = userRequest.toLowerCase();
    const destinations = itinerary.destinations?.map(d => d.name || d) || ['Unknown'];
    const currentDestination = destinations[0] || 'your destination';
    
    // Detect modification keywords and context
    const addKeywords = ['add', 'include', 'visit', 'go to', 'see', 'try', 'want to'];
    const changeKeywords = ['change', 'replace', 'instead of', 'switch', 'different', 'upgrade'];
    const removeKeywords = ['remove', 'skip', 'don\'t want', 'cancel', 'delete'];
    const swapKeywords = ['swap', 'exchange', 'switch', 'move', 'transfer'];
    
    const isAdd = addKeywords.some(keyword => lowerRequest.includes(keyword));
    const isChange = changeKeywords.some(keyword => lowerRequest.includes(keyword));
    const isRemove = removeKeywords.some(keyword => lowerRequest.includes(keyword));
    const isSwap = swapKeywords.some(keyword => lowerRequest.includes(keyword));
    
    // Enhanced swap detection patterns
    const swapPatterns = [
      /swap.*day\s*(\d+).*day\s*(\d+)/i,
      /exchange.*day\s*(\d+).*day\s*(\d+)/i,
      /switch.*day\s*(\d+).*day\s*(\d+)/i,
      /move.*day\s*(\d+).*day\s*(\d+)/i,
      /day\s*(\d+).*activities.*day\s*(\d+)/i,
      /day\s*(\d+).*with.*day\s*(\d+)/i
    ];
    
    // Check for swap patterns
    let swapDays = null;
    for (const pattern of swapPatterns) {
      const match = userRequest.match(pattern);
      if (match) {
        swapDays = {
          day1: parseInt(match[1]),
          day2: parseInt(match[2])
        };
        break;
      }
    }
    
    if (!isAdd && !isChange && !isRemove && !isSwap && !swapDays) {
      return {
        requiresModification: false,
        actionableChanges: [],
        response: 'I can help you with your travel plans. Could you be more specific about what you\'d like to change?'
      };
    }

    // Validate feasibility first
    const feasibilityCheck = this.checkRequestFeasibility(userRequest, itinerary);
    if (!feasibilityCheck.feasible) {
      return {
        requiresModification: false,
        actionableChanges: [],
        response: feasibilityCheck.reason
      };
    }

    // Handle specific swap requests
    if (swapDays || isSwap) {
      return this.handleSwapRequest(userRequest, itinerary, swapDays);
    }

    // Extract potential day number for other modifications
    const dayMatch = userRequest.match(/day\s+(\d+)/i);
    const targetDay = dayMatch ? parseInt(dayMatch[1]) : 1;

    // Generate SPECIFIC actionable changes based on destination and context
    const actionableChanges = [];
    
    // Get destination-specific recommendations
    const specificRecommendations = this.getDestinationSpecificRecommendations(currentDestination);
    
    // Check for specific attractions or places mentioned
    const specificPlaces = this.extractSpecificPlaces(userRequest);
    const specificCuisines = this.extractSpecificCuisines(userRequest);
    const hotelTypes = this.extractHotelTypes(userRequest);
    
    if (isAdd || isChange) {
      // Handle specific attractions mentioned in request
      if (specificPlaces.length > 0) {
        specificPlaces.forEach(place => {
          actionableChanges.push({
            id: `add_${place.toLowerCase().replace(/\s+/g, '_')}_d${targetDay}`,
            type: 'add_activity',
            description: `Visit ${place} in ${currentDestination}`,
            targetDay: targetDay,
            targetField: 'activities',
            newValue: `Visit ${place} - ${this.getAttractionDescription(place)}`,
            oldValue: ''
          });
        });
      } else {
        // Use destination-specific recommendations
        const attractions = specificRecommendations.attractions;
        attractions.slice(0, 3).forEach((attraction, index) => {
          actionableChanges.push({
            id: `add_${attraction.name.toLowerCase().replace(/\s+/g, '_')}_d${targetDay}_${index}`,
            type: 'add_activity',
            description: `Visit ${attraction.name}`,
            targetDay: targetDay,
            targetField: 'activities',
            newValue: `Visit ${attraction.name} - ${attraction.description}`,
            oldValue: ''
          });
        });
      }
      
      // Handle food/cuisine changes with specific restaurants
      if (specificCuisines.length > 0 || lowerRequest.includes('restaurant') || lowerRequest.includes('food')) {
        const cuisine = specificCuisines[0] || 'local cuisine';
        const mealType = this.detectMealType(userRequest);
        const restaurants = specificRecommendations.restaurants.filter(r => 
          r.cuisine.toLowerCase().includes(cuisine.toLowerCase()) || cuisine === 'local cuisine'
        );
        
        if (restaurants.length > 0) {
          const restaurant = restaurants[0];
          actionableChanges.push({
            id: `change_meal_${restaurant.name.toLowerCase().replace(/\s+/g, '_')}_d${targetDay}`,
            type: 'change_meal',
            description: `Try ${restaurant.name} for ${mealType}`,
            targetDay: targetDay,
            targetField: `meals.${mealType}`,
            newValue: `${restaurant.name} - ${restaurant.specialty} (${restaurant.cuisine})`,
            oldValue: ''
          });
        }
      }
      
      // Handle hotel changes with specific hotel recommendations
      if (hotelTypes.length > 0 || lowerRequest.includes('hotel') || lowerRequest.includes('accommodation')) {
        const hotelType = hotelTypes[0] || this.detectHotelType(userRequest);
        const hotels = specificRecommendations.hotels.filter(h => 
          h.type.toLowerCase().includes(hotelType.toLowerCase())
        );
        
        if (hotels.length > 0) {
          const hotel = hotels[0];
          actionableChanges.push({
            id: `change_hotel_${hotel.name.toLowerCase().replace(/\s+/g, '_')}_d${targetDay}`,
            type: 'change_accommodation',
            description: `Stay at ${hotel.name}`,
            targetDay: targetDay,
            targetField: 'accommodation',
            newValue: `${hotel.name} - ${hotel.description}`,
            oldValue: ''
          });
        }
      }
      
      // Handle whole day changes with multiple specific recommendations
      if (lowerRequest.includes('whole day') || lowerRequest.includes('entire day') || lowerRequest.includes('full day')) {
        const morningActivity = specificRecommendations.attractions[0];
        const afternoonActivity = specificRecommendations.attractions[1];
        const restaurant = specificRecommendations.restaurants[0];
        
        actionableChanges.push(
          {
            id: `change_morning_activities_d${targetDay}`,
            type: 'add_activity',
            description: `Morning: ${morningActivity.name}`,
            targetDay: targetDay,
            targetField: 'activities',
            newValue: `Morning visit to ${morningActivity.name} - ${morningActivity.description}`,
            oldValue: ''
          },
          {
            id: `change_lunch_${restaurant.name.toLowerCase().replace(/\s+/g, '_')}_d${targetDay}`,
            type: 'change_meal',
            description: `Lunch at ${restaurant.name}`,
            targetDay: targetDay,
            targetField: 'meals.lunch',
            newValue: `${restaurant.name} - ${restaurant.specialty}`,
            oldValue: ''
          },
          {
            id: `change_afternoon_activities_d${targetDay}`,
            type: 'add_activity',
            description: `Afternoon: ${afternoonActivity.name}`,
            targetDay: targetDay,
            targetField: 'activities',
            newValue: `Afternoon at ${afternoonActivity.name} - ${afternoonActivity.description}`,
            oldValue: ''
          }
        );
      }
    }

    // If no specific changes generated, provide default destination-specific ones
    if (actionableChanges.length === 0) {
      const defaultRecommendations = specificRecommendations.attractions.slice(0, 2);
      defaultRecommendations.forEach((attraction, index) => {
        actionableChanges.push({
          id: `add_default_${attraction.name.toLowerCase().replace(/\s+/g, '_')}_d${targetDay}_${index}`,
          type: 'add_activity',
          description: `Visit ${attraction.name}`,
          targetDay: targetDay,
          targetField: 'activities',
          newValue: `Visit ${attraction.name} - ${attraction.description}`,
          oldValue: ''
        });
      });
    }

    return {
      requiresModification: true,
      modificationType: isAdd ? 'add_activity' : isChange ? 'change_day_plan' : isSwap ? 'swap_activities' : 'remove_activity',
      targetDay: targetDay,
      changes: [`User wants to modify day ${targetDay} itinerary with specific recommendations`],
      actionableChanges: actionableChanges,
      response: ''
    };
  }

  // Add new method to handle swap requests
  handleSwapRequest(userRequest, itinerary, swapDays) {
    const lowerRequest = userRequest.toLowerCase();
    
    // If swapDays not detected, try to extract from request
    if (!swapDays) {
      const dayNumbers = userRequest.match(/day\s*(\d+)/gi);
      if (dayNumbers && dayNumbers.length >= 2) {
        const day1 = parseInt(dayNumbers[0].match(/\d+/)[0]);
        const day2 = parseInt(dayNumbers[1].match(/\d+/)[0]);
        swapDays = { day1, day2 };
      } else {
        return {
          requiresModification: false,
          actionableChanges: [],
          response: 'Please specify which two days you want to swap activities between. For example: "swap day 1 activities with day 2"'
        };
      }
    }

    const { day1, day2 } = swapDays;
    const totalDays = itinerary.numberOfDays || 3;

    // Validate day numbers
    if (day1 < 1 || day1 > totalDays || day2 < 1 || day2 > totalDays) {
      return {
        requiresModification: false,
        actionableChanges: [],
        response: `Invalid day numbers. Your trip has ${totalDays} days. Please specify days between 1 and ${totalDays}.`
      };
    }

    if (day1 === day2) {
      return {
        requiresModification: false,
        actionableChanges: [],
        response: `You cannot swap a day with itself. Please specify two different days.`
      };
    }

    // Find the actual day data
    const day1Data = itinerary.dailyItinerary?.find(d => d.day === day1);
    const day2Data = itinerary.dailyItinerary?.find(d => d.day === day2);

    if (!day1Data || !day2Data) {
      return {
        requiresModification: false,
        actionableChanges: [],
        response: `Could not find data for the specified days. Please try again.`
      };
    }

    // Create swap actionable changes
    const actionableChanges = [
      {
        id: `swap_activities_d${day1}_d${day2}`,
        type: 'swap_activities',
        description: `Swap all activities between Day ${day1} and Day ${day2}`,
        targetDay: day1,
        targetDay2: day2,
        targetField: 'activities',
        newValue: `Swap activities: Day ${day1} ↔ Day ${day2}`,
        oldValue: `Day ${day1}: ${day1Data.activities?.slice(0, 2).join(', ') || 'No activities'} | Day ${day2}: ${day2Data.activities?.slice(0, 2).join(', ') || 'No activities'}`
      }
    ];

    // Check if user wants to swap everything or just activities
    if (lowerRequest.includes('everything') || lowerRequest.includes('entire day') || lowerRequest.includes('whole day')) {
      actionableChanges.push(
        {
          id: `swap_accommodation_d${day1}_d${day2}`,
          type: 'swap_accommodation',
          description: `Swap accommodations between Day ${day1} and Day ${day2}`,
          targetDay: day1,
          targetDay2: day2,
          targetField: 'accommodation',
          newValue: `Swap hotels: Day ${day1} ↔ Day ${day2}`,
          oldValue: ''
        },
        {
          id: `swap_meals_d${day1}_d${day2}`,
          type: 'swap_meals',
          description: `Swap meal plans between Day ${day1} and Day ${day2}`,
          targetDay: day1,
          targetDay2: day2,
          targetField: 'meals',
          newValue: `Swap meals: Day ${day1} ↔ Day ${day2}`,
          oldValue: ''
        }
      );
    }

    return {
      requiresModification: true,
      modificationType: 'swap_activities',
      targetDay: day1,
      targetDay2: day2,
      changes: [`User wants to swap activities between day ${day1} and day ${day2}`],
      actionableChanges: actionableChanges,
      response: ''
    };
  }

  // Add missing helper methods
  checkRequestFeasibility(userRequest, itinerary) {
    const lowerRequest = userRequest.toLowerCase();
    
    // Check for impossible travel times
    if (lowerRequest.includes('travel') && lowerRequest.includes('day')) {
      // Extract potential travel distances/times
      const impossiblePatterns = [
        /travel.*usa.*india.*1\s*day/i,
        /travel.*america.*asia.*1\s*day/i,
        /fly.*(\d+)\s*hours.*(\d+)\s*minutes/i
      ];
      
      for (const pattern of impossiblePatterns) {
        if (pattern.test(userRequest)) {
          const match = userRequest.match(/(\d+)\s*day/i);
          const days = match ? parseInt(match[1]) : 1;
          
          if (days === 1 && (lowerRequest.includes('usa') || lowerRequest.includes('america')) && 
              (lowerRequest.includes('india') || lowerRequest.includes('asia'))) {
            return {
              feasible: false,
              reason: "I'm sorry, but traveling from USA to India in 1 day is not feasible. International flights typically take 15-20 hours plus layover time. I'd recommend allowing at least 2-3 days for such long-distance travel including jet lag recovery."
            };
          }
        }
      }
    }
    
    // Check for impossible budget constraints
    if (lowerRequest.includes('budget') && lowerRequest.includes('luxury')) {
      const budgetMatch = userRequest.match(/budget.*\$(\d+)/i);
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        if (budget < 100 && lowerRequest.includes('luxury')) {
          return {
            feasible: false,
            reason: `A budget of $${budget} for luxury accommodations is not realistic. Luxury hotels typically start from $200+ per night. Consider upgrading your budget or choosing mid-range accommodations instead.`
          };
        }
      }
    }
    
    // Check for day constraints
    const dayMatch = userRequest.match(/day\s+(\d+)/i);
    if (dayMatch) {
      const requestedDay = parseInt(dayMatch[1]);
      const totalDays = itinerary.numberOfDays || 3;
      
      if (requestedDay > totalDays) {
        return {
          feasible: false,
          reason: `Your trip is only ${totalDays} days long, but you're asking about day ${requestedDay}. Please choose a day between 1 and ${totalDays}, or extend your trip duration.`
        };
      }
      
      if (requestedDay < 1) {
        return {
          feasible: false,
          reason: `Day ${requestedDay} doesn't exist. Please choose a day between 1 and ${totalDays}.`
        };
      }
    }
    
    return { feasible: true };
  }

  extractSpecificPlaces(userRequest) {
    const places = [];
    const commonAttractions = [
      'Taj Mahal', 'Red Fort', 'Gateway of India', 'Lotus Temple', 'Qutub Minar',
      'India Gate', 'Hawa Mahal', 'City Palace', 'Amber Fort', 'Eiffel Tower',
      'Big Ben', 'Statue of Liberty', 'Times Square', 'Central Park', 'Louvre',
      'Colosseum', 'Vatican', 'Sagrada Familia', 'Brandenburg Gate', 'museum',
      'cathedral', 'palace', 'temple', 'fort', 'beach', 'park', 'market'
    ];
    
    for (const attraction of commonAttractions) {
      if (userRequest.toLowerCase().includes(attraction.toLowerCase())) {
        places.push(attraction);
      }
    }
    
    return places;
  }

  extractSpecificCuisines(userRequest) {
    const cuisines = [];
    const commonCuisines = [
      'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'French',
      'Mediterranean', 'Korean', 'Vietnamese', 'American', 'British', 'German',
      'Spanish', 'Greek', 'Turkish', 'Lebanese', 'Moroccan', 'Ethiopian',
      'pizza', 'pasta', 'sushi', 'curry', 'noodles', 'burger', 'steak'
    ];
    
    for (const cuisine of commonCuisines) {
      if (userRequest.toLowerCase().includes(cuisine.toLowerCase())) {
        cuisines.push(cuisine);
      }
    }
    
    return cuisines;
  }

  extractHotelTypes(userRequest) {
    const types = [];
    const hotelTypes = [
      'luxury', 'budget', 'boutique', 'business', 'resort', 'hostel',
      'villa', 'apartment', '5 star', '4 star', '3 star', 'cheap', 'expensive'
    ];
    
    for (const type of hotelTypes) {
      if (userRequest.toLowerCase().includes(type.toLowerCase())) {
        types.push(type);
      }
    }
    
    return types;
  }

  detectMealType(userRequest) {
    const lowerRequest = userRequest.toLowerCase();
    if (lowerRequest.includes('breakfast') || lowerRequest.includes('morning')) return 'breakfast';
    if (lowerRequest.includes('lunch') || lowerRequest.includes('afternoon')) return 'lunch';
    if (lowerRequest.includes('dinner') || lowerRequest.includes('evening')) return 'dinner';
    return 'lunch'; // default
  }

  detectHotelType(userRequest) {
    const lowerRequest = userRequest.toLowerCase();
    if (lowerRequest.includes('luxury') || lowerRequest.includes('5 star') || lowerRequest.includes('premium')) return 'luxury';
    if (lowerRequest.includes('budget') || lowerRequest.includes('cheap') || lowerRequest.includes('economy')) return 'budget';
    if (lowerRequest.includes('boutique')) return 'boutique';
    if (lowerRequest.includes('business')) return 'business';
    return 'mid-range';
  }

  getDestinationSpecificRecommendations(destination) {
    const destinationLower = destination.toLowerCase();
    
    // Destination-specific data
    const destinationData = {
      'ahmedabad': {
        attractions: [
          { name: 'Sabarmati Ashram', description: 'Gandhi\'s historic residence and museum' },
          { name: 'Sidi Saiyyed Mosque', description: 'Famous for intricate stone lattice work' },
          { name: 'Adalaj Stepwell', description: 'Stunning 15th-century stepwell architecture' },
          { name: 'Kankaria Lake', description: 'Popular recreational lake with activities' },
          { name: 'Calico Museum', description: 'World-renowned textile museum' }
        ],
        restaurants: [
          { name: 'Agashiye', cuisine: 'Gujarati', specialty: 'Traditional thali on rooftop' },
          { name: 'Swathi Snacks', cuisine: 'Street Food', specialty: 'Famous khaman and dhokla' },
          { name: 'Gordhan Thal', cuisine: 'Gujarati', specialty: 'Authentic Gujarati cuisine' },
          { name: 'Cafe Baraco', cuisine: 'Continental', specialty: 'Coffee and continental dishes' }
        ],
        hotels: [
          { name: 'Hyatt Regency Ahmedabad', type: 'luxury', description: 'Premium 5-star hotel' },
          { name: 'Four Points by Sheraton', type: 'business', description: 'Modern business hotel' },
          { name: 'Hotel Cama', type: 'budget', description: 'Heritage budget hotel' }
        ]
      },
      'mumbai': {
        attractions: [
          { name: 'Gateway of India', description: 'Iconic monument overlooking Arabian Sea' },
          { name: 'Marine Drive', description: 'Famous promenade known as Queen\'s Necklace' },
          { name: 'Elephanta Caves', description: 'Ancient rock-cut caves on Elephanta Island' },
          { name: 'Chhatrapati Shivaji Terminus', description: 'UNESCO World Heritage railway station' },
          { name: 'Dhobi Ghat', description: 'World\'s largest outdoor laundry' }
        ],
        restaurants: [
          { name: 'Leopold Cafe', cuisine: 'Continental', specialty: 'Historic cafe with international menu' },
          { name: 'Trishna', cuisine: 'Seafood', specialty: 'Contemporary Indian seafood' },
          { name: 'Britannia & Co', cuisine: 'Parsi', specialty: 'Authentic Parsi cuisine' },
          { name: 'Mohammed Ali Road', cuisine: 'Street Food', specialty: 'Famous street food hub' }
        ],
        hotels: [
          { name: 'Taj Mahal Palace', type: 'luxury', description: 'Historic luxury hotel near Gateway' },
          { name: 'The Oberoi Mumbai', type: 'luxury', description: 'Modern luxury with sea views' },
          { name: 'Hotel City Palace', type: 'budget', description: 'Budget-friendly central location' }
        ]
      },
      'delhi': {
        attractions: [
          { name: 'Red Fort', description: 'Magnificent Mughal fortress and UNESCO site' },
          { name: 'India Gate', description: 'War memorial and popular gathering place' },
          { name: 'Qutub Minar', description: 'Tallest brick minaret in the world' },
          { name: 'Lotus Temple', description: 'Unique lotus-shaped Bahai temple' },
          { name: 'Chandni Chowk', description: 'Historic market with street food' }
        ],
        restaurants: [
          { name: 'Karim\'s', cuisine: 'Mughlai', specialty: 'Historic Mughlai cuisine since 1913' },
          { name: 'Paranthe Wali Gali', cuisine: 'Street Food', specialty: 'Famous paratha street' },
          { name: 'Indian Accent', cuisine: 'Modern Indian', specialty: 'Contemporary Indian fine dining' },
          { name: 'Al Jawahar', cuisine: 'Mughlai', specialty: 'Traditional Old Delhi flavors' }
        ],
        hotels: [
          { name: 'The Imperial New Delhi', type: 'luxury', description: 'Colonial-era luxury hotel' },
          { name: 'Hotel Tara Palace', type: 'budget', description: 'Budget hotel near Chandni Chowk' },
          { name: 'Radisson Blu', type: 'business', description: 'Modern business hotel' }
        ]
      }
    };

    // Return specific data for destination or generic fallback
    return destinationData[destinationLower] || {
      attractions: [
        { name: `${destination} Heritage Site`, description: 'Historic cultural landmark' },
        { name: `${destination} City Center`, description: 'Main commercial and cultural hub' },
        { name: `${destination} Local Market`, description: 'Traditional market experience' },
        { name: `${destination} Viewpoint`, description: 'Scenic viewpoint with panoramic views' }
      ],
      restaurants: [
        { name: `${destination} Heritage Restaurant`, cuisine: 'Local', specialty: 'Traditional local cuisine' },
        { name: `Local Street Food Corner`, cuisine: 'Street Food', specialty: 'Popular local street food' },
        { name: `${destination} Palace Restaurant`, cuisine: 'Multi-cuisine', specialty: 'Heritage dining experience' }
      ],
      hotels: [
        { name: `${destination} Palace Hotel`, type: 'luxury', description: 'Premium heritage hotel' },
        { name: `${destination} Business Hotel`, type: 'business', description: 'Modern business amenities' },
        { name: `${destination} Budget Inn`, type: 'budget', description: 'Clean and affordable accommodation' }
      ]
    };
  }

  getAttractionDescription(placeName) {
    const descriptions = {
      'taj mahal': 'UNESCO World Heritage Site and symbol of love',
      'red fort': 'Historic Mughal fortress in Delhi',
      'gateway of india': 'Iconic Mumbai monument',
      'lotus temple': 'Unique lotus-shaped Bahai temple',
      'museum': 'Cultural heritage and artifacts',
      'cathedral': 'Historic religious architecture',
      'palace': 'Royal heritage and architecture',
      'temple': 'Spiritual and architectural significance',
      'fort': 'Historic defense structure',
      'beach': 'Coastal recreation and relaxation',
      'park': 'Natural beauty and recreation',
      'market': 'Local culture and shopping experience'
    };

    const lowerPlace = placeName.toLowerCase();
    for (const [key, desc] of Object.entries(descriptions)) {
      if (lowerPlace.includes(key)) {
        return desc;
      }
    }
    return 'Popular local attraction';
  }

  // Update the old getFallbackAnalysis to use the enhanced version
  getFallbackAnalysis(userRequest, itinerary) {
    return this.getEnhancedFallbackAnalysis(userRequest, itinerary);
  }

  async generateModifiedItinerary(itinerary, userRequest, analysis) {
    try {
      const modificationPrompt = `Modify the following travel itinerary based on the user's request:

USER REQUEST: "${userRequest}"
MODIFICATION TYPE: ${analysis.modificationType}
TARGET DAY: ${analysis.targetDay || 'Not specified'}

CURRENT ITINERARY:
${JSON.stringify(itinerary.dailyItinerary, null, 2)}

ITINERARY DETAILS:
- Budget: ${itinerary.budget}
- Travelers: ${itinerary.travelers}
- Currency: ${itinerary.preferences.currency}
- Interests: ${itinerary.interests.join(', ')}

INSTRUCTIONS:
1. Make the specific changes requested by the user
2. Ensure all changes align with the budget level and travel preferences
3. Maintain realistic timing and logistics
4. Keep other parts of the itinerary intact unless they conflict with changes
5. Provide real place names, restaurants, and hotels
6. Update costs appropriately

REQUIRED RESPONSE FORMAT:
{
  "dailyItinerary": [complete modified daily itinerary array with same structure],
  "explanation": "Brief explanation of what was changed and why"
}

Make sure the response is valid JSON and maintains the exact same structure as the original itinerary.`;

      const response = await groqService.chatCompletion([
        {
          role: 'system',
          content: 'You are an expert travel itinerary modifier. Modify itineraries based on user requests while maintaining structure and realism. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: modificationPrompt
        }
      ], {
        maxTokens: 3000,
        temperature: 0.7
      });

      const modificationResult = JSON.parse(response.choices[0]?.message?.content);
      
      // Validate the result
      if (!modificationResult.dailyItinerary || !Array.isArray(modificationResult.dailyItinerary)) {
        throw new Error('Invalid modification result structure');
      }

      logger.info('Itinerary modification completed successfully');
      return modificationResult;

    } catch (error) {
      logger.error('Error generating modified itinerary:', error);
      throw new Error('Failed to generate modified itinerary');
    }
  }

  async applyActionableChange(itineraryId, changeAction, userId) {
    try {
      logger.info('Applying actionable change', { itineraryId, changeAction });

      // Get current itinerary
      const itinerary = await Itinerary.findOne({ _id: itineraryId, user: userId });
      
      if (!itinerary) {
        throw new Error('Itinerary not found or access denied');
      }

      // Apply the specific change
      const updatedItinerary = await this.applySpecificChange(itinerary, changeAction);
      
      // Save the updated itinerary
      await updatedItinerary.save();

      return {
        success: true,
        message: `Successfully applied: ${changeAction.description}`,
        itinerary: updatedItinerary
      };

    } catch (error) {
      logger.error('Error applying actionable change:', error);
      return {
        success: false,
        message: 'Failed to apply the change. Please try again.'
      };
    }
  }

  async applySpecificChange(itinerary, changeAction) {
    const { type, targetDay, targetDay2, targetField, newValue, oldValue } = changeAction;

    // Handle swap operations
    if (type === 'swap_activities' || type === 'swap_accommodation' || type === 'swap_meals') {
      return this.handleSwapOperation(itinerary, changeAction);
    }

    // Find the target day
    const dayIndex = itinerary.dailyItinerary.findIndex(day => day.day === targetDay);
    if (dayIndex === -1) {
      throw new Error(`Day ${targetDay} not found in itinerary`);
    }

    const targetDayData = itinerary.dailyItinerary[dayIndex];

    switch (type) {
      case 'add_activity':
        if (!targetDayData.activities) targetDayData.activities = [];
        // Instead of just pushing, insert in a logical position
        if (newValue.toLowerCase().includes('morning')) {
          targetDayData.activities.unshift(newValue);
        } else if (newValue.toLowerCase().includes('evening')) {
          targetDayData.activities.push(newValue);
        } else {
          // Insert in middle for general activities
          const insertIndex = Math.floor(targetDayData.activities.length / 2);
          targetDayData.activities.splice(insertIndex, 0, newValue);
        }
        break;

      case 'remove_activity':
        if (targetDayData.activities) {
          targetDayData.activities = targetDayData.activities.filter(
            activity => !activity.toLowerCase().includes(oldValue.toLowerCase())
          );
        }
        break;

      case 'change_accommodation':
        if (!targetDayData.accommodation) {
          targetDayData.accommodation = {};
        }
        
        // Generate more specific hotel details
        const destination = targetDayData.location || itinerary.destinations[0]?.name || 'destination';
        const hotelType = this.extractHotelTypeFromValue(newValue);
        
        targetDayData.accommodation.name = newValue.includes('hotel') ? newValue : `${newValue} - ${destination}`;
        targetDayData.accommodation.address = `${destination} - Premium location`;
        
        // Update pricing based on type
        if (hotelType === 'luxury') {
          targetDayData.accommodation.price = Math.floor(200 + Math.random() * 200);
          targetDayData.accommodation.rating = 4.5 + Math.random() * 0.5;
        } else if (hotelType === 'budget') {
          targetDayData.accommodation.price = Math.floor(30 + Math.random() * 50);
          targetDayData.accommodation.rating = 3.0 + Math.random() * 1.0;
        } else {
          targetDayData.accommodation.price = Math.floor(80 + Math.random() * 100);
          targetDayData.accommodation.rating = 3.5 + Math.random() * 1.0;
        }
        break;

      case 'change_meal':
        const mealParts = targetField.split('.');
        if (mealParts.length === 2 && mealParts[0] === 'meals') {
          const mealType = mealParts[1]; // breakfast, lunch, dinner
          if (!targetDayData.meals) targetDayData.meals = {};
          
          // Make meal description more specific
          const destination = targetDayData.location || itinerary.destinations[0]?.name || 'local area';
          targetDayData.meals[mealType] = newValue.includes('restaurant') ? 
            newValue : `${newValue} in ${destination}`;
        }
        break;

      case 'change_transport':
        if (!targetDayData.transportation) {
          targetDayData.transportation = {};
        }
        targetDayData.transportation.mode = newValue;
        targetDayData.transportation.details = `${newValue} - Updated based on your preferences`;
        
        // Update cost based on transport type
        if (newValue.toLowerCase().includes('luxury') || newValue.toLowerCase().includes('private')) {
          targetDayData.transportation.cost = Math.floor(50 + Math.random() * 100);
        } else if (newValue.toLowerCase().includes('budget') || newValue.toLowerCase().includes('public')) {
          targetDayData.transportation.cost = Math.floor(5 + Math.random() * 15);
        } else {
          targetDayData.transportation.cost = Math.floor(20 + Math.random() * 30);
        }
        break;

      default:
        logger.warn('Unknown change type:', type);
    }

    // Recalculate total cost
    itinerary.totalCost = this.calculateTotalCost(itinerary.dailyItinerary);
    itinerary.estimatedCost = itinerary.totalCost;

    return itinerary;
  }

  // Add new method to handle swap operations
  handleSwapOperation(itinerary, changeAction) {
    const { type, targetDay, targetDay2 } = changeAction;

    // Find both days
    const day1Index = itinerary.dailyItinerary.findIndex(day => day.day === targetDay);
    const day2Index = itinerary.dailyItinerary.findIndex(day => day.day === targetDay2);

    if (day1Index === -1 || day2Index === -1) {
      throw new Error(`Could not find days ${targetDay} or ${targetDay2} in itinerary`);
    }

    const day1Data = itinerary.dailyItinerary[day1Index];
    const day2Data = itinerary.dailyItinerary[day2Index];

    switch (type) {
      case 'swap_activities':
        // Swap activities between the two days
        const tempActivities = [...(day1Data.activities || [])];
        day1Data.activities = [...(day2Data.activities || [])];
        day2Data.activities = tempActivities;
        break;

      case 'swap_accommodation':
        // Swap accommodation between the two days
        const tempAccommodation = { ...(day1Data.accommodation || {}) };
        day1Data.accommodation = { ...(day2Data.accommodation || {}) };
        day2Data.accommodation = tempAccommodation;
        break;

      case 'swap_meals':
        // Swap meals between the two days
        const tempMeals = { ...(day1Data.meals || {}) };
        day1Data.meals = { ...(day2Data.meals || {}) };
        day2Data.meals = tempMeals;
        break;

      default:
        throw new Error(`Unknown swap operation: ${type}`);
    }

    // Recalculate total cost
    itinerary.totalCost = this.calculateTotalCost(itinerary.dailyItinerary);
    itinerary.estimatedCost = itinerary.totalCost;

    return itinerary;
  }

  calculateTotalCost(dailyItinerary) {
    return dailyItinerary.reduce((total, day) => total + (day.estimatedCost || 0), 0);
  }
}

module.exports = new ItineraryModificationService();
