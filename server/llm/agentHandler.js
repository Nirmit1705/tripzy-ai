const groqService = require('../services/groqService');
const PromptBuilder = require('./promptBuilder');
const itineraryModificationService = require('../services/itineraryModificationService');
const logger = require('../utils/logger');

class AgentHandler {
  async handleItineraryUpdate(itinerary, userRequest) {
    try {
      logger.info('Handling itinerary update request', { userRequest: userRequest.substring(0, 100) });

      const prompt = PromptBuilder.buildUpdatePrompt(itinerary, userRequest);
      
      const response = await groqService.chatCompletion([
        {
          role: 'system',
          content: 'You are a helpful travel assistant. Provide specific, actionable suggestions for updating travel itineraries based on user requests.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        maxTokens: 500,
        temperature: 0.7
      });

      return {
        success: true,
        message: response.choices[0]?.message?.content || 'I can help you update your itinerary. What specific changes would you like to make?',
        suggestions: this.extractSuggestions(response.choices[0]?.message?.content)
      };
    } catch (error) {
      logger.error('Error in handleItineraryUpdate:', error);
      return {
        success: false,
        message: 'I apologize, but I\'m having trouble processing your itinerary update request. Please try again.',
        suggestions: []
      };
    }
  }

  async handleChat(userMessage, context) {
    try {
      logger.info('Handling chat request', { message: userMessage.substring(0, 100) });

      // Check if this is an itinerary modification request
      if (context.itineraryId && this.isModificationRequest(userMessage)) {
        logger.info('Detected modification request, processing...');
        return await this.handleItineraryModification(userMessage, context);
      }

      // Handle regular chat
      return await this.handleRegularChat(userMessage, context);

    } catch (error) {
      logger.error('Error in handleChat:', error);
      return this.getEnhancedFallbackResponse(userMessage, context);
    }
  }

  isModificationRequest(message) {
    const modificationKeywords = [
      // Add/include keywords
      'add', 'include', 'visit', 'go to', 'see', 'try', 'want to', 'can we',
      // Remove/skip keywords  
      'remove', 'skip', 'don\'t want', 'cancel', 'delete', 'take out',
      // Change/replace keywords
      'change', 'replace', 'instead of', 'switch', 'different', 'prefer',
      // Swap/exchange keywords
      'swap', 'exchange', 'move', 'transfer', 'switch between',
      // Hotel/accommodation keywords
      'hotel', 'accommodation', 'stay', 'room', 'lodge',
      // Food/restaurant keywords
      'restaurant', 'food', 'eat', 'meal', 'dining', 'lunch', 'dinner', 'breakfast',
      // Transport keywords
      'transport', 'travel', 'flight', 'train', 'car', 'taxi', 'bus',
      // Time keywords
      'time', 'schedule', 'earlier', 'later', 'morning', 'afternoon', 'evening'
    ];

    const lowerMessage = message.toLowerCase();
    
    // Check for basic modification keywords
    const hasModificationKeyword = modificationKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Check for specific swap patterns
    const swapPatterns = [
      /swap.*day\s*\d+.*day\s*\d+/i,
      /exchange.*day\s*\d+.*day\s*\d+/i,
      /switch.*day\s*\d+.*day\s*\d+/i,
      /move.*day\s*\d+.*day\s*\d+/i,
      /day\s*\d+.*activities.*day\s*\d+/i,
      /day\s*\d+.*with.*day\s*\d+/i
    ];
    
    const hasSwapPattern = swapPatterns.some(pattern => pattern.test(lowerMessage));
    
    return hasModificationKeyword || hasSwapPattern;
  }

  async handleItineraryModification(userMessage, context) {
    try {
      console.log('Processing modification request:', userMessage);
      console.log('Context received:', context);
      
      // Get the actual itinerary from database if ID is provided
      let itineraryForAnalysis = {
        destinations: context.itinerary?.destinations || [context.itinerary?.destination || 'Unknown'],
        numberOfDays: context.itinerary?.numberOfDays || 3,
        budget: context.itinerary?.budget || 'moderate',
        dailyItinerary: []
      };

      // If we have an itinerary ID, fetch the actual data
      if (context.itineraryId) {
        try {
          const Itinerary = require('../models/Itinerary');
          const actualItinerary = await Itinerary.findById(context.itineraryId);
          if (actualItinerary) {
            itineraryForAnalysis = {
              ...actualItinerary.toObject(),
              destinations: actualItinerary.destinations.map(d => d.name || d)
            };
            console.log('Using actual itinerary data:', {
              destinations: itineraryForAnalysis.destinations,
              dailyCount: itineraryForAnalysis.dailyItinerary?.length || 0
            });
          }
        } catch (error) {
          console.warn('Could not fetch actual itinerary:', error.message);
        }
      }

      // Analyze the modification request with actual data
      const modificationAnalysis = await itineraryModificationService.analyzeModificationRequest(
        userMessage,
        itineraryForAnalysis
      );

      console.log('Analysis result:', {
        requiresModification: modificationAnalysis.requiresModification,
        actionableChangesCount: modificationAnalysis.actionableChanges?.length || 0,
        response: modificationAnalysis.response
      });

      if (!modificationAnalysis.requiresModification) {
        return {
          success: true,
          message: modificationAnalysis.response || "I can help you modify your itinerary! Try being more specific like 'add Taj Mahal to day 2' or 'change the hotel on day 1 to luxury'.",
          modified: false,
          suggestions: [
            "Add a specific attraction to a day",
            "Change accommodation type", 
            "Update dining options with specific cuisine",
            "Modify transportation options"
          ],
          actionableChanges: []
        };
      }

      // Generate text suggestions
      const textSuggestions = await this.generateTextSuggestions(userMessage, context);

      return {
        success: true,
        message: textSuggestions.message,
        modified: false,
        suggestions: textSuggestions.suggestions,
        actionableChanges: modificationAnalysis.actionableChanges || [],
        canApplyChanges: true
      };

    } catch (error) {
      logger.error('Error handling itinerary modification:', error);
      console.error('Full error details:', error);
      
      // More specific error handling
      if (error.message.includes('Itinerary not found')) {
        return {
          success: false,
          message: 'I couldn\'t find your itinerary. Please try refreshing the page or creating a new trip.',
          modified: false,
          suggestions: [],
          actionableChanges: []
        };
      }
      
      return {
        success: false,
        message: 'I apologize, but I\'m having trouble processing your request. Please try being more specific about what you\'d like to change.',
        modified: false,
        suggestions: [
          "Try: 'Add Taj Mahal to day 2'",
          "Try: 'Change hotel on day 1 to luxury'",
          "Try: 'Replace lunch with Italian cuisine'"
        ],
        actionableChanges: []
      };
    }
  }

  async generateTextSuggestions(userMessage, context) {
    try {
      if (!process.env.GROQ_API_KEY) {
        return this.getFallbackSuggestions(userMessage, context);
      }

      const prompt = `The user wants to modify their travel itinerary. 

User request: "${userMessage}"

Current trip context:
- Destinations: ${context.itinerary?.destinations?.join(', ') || 'Not specified'}
- Budget: ${context.itinerary?.budget || 'Not specified'}
- Days: ${context.itinerary?.numberOfDays || 'Not specified'}

Provide helpful suggestions in text form for how to modify their itinerary. Include:
1. Specific recommendations
2. Alternative options
3. Practical tips
4. Any considerations (timing, budget, logistics)

Keep response concise but informative (max 150 words).`;

      const response = await groqService.chatCompletion([
        {
          role: 'system',
          content: 'You are a helpful travel assistant. Provide specific, actionable text suggestions for itinerary modifications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        maxTokens: 200,
        temperature: 0.7
      });

      const aiMessage = response.choices[0]?.message?.content || 'I can help you modify your itinerary.';
      
      return {
        message: aiMessage,
        suggestions: this.extractSuggestions(aiMessage)
      };

    } catch (error) {
      logger.error('Error generating text suggestions:', error);
      return this.getFallbackSuggestions(userMessage, context);
    }
  }

  getFallbackSuggestions(userMessage, context) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('add') || lowerMessage.includes('include')) {
      return {
        message: "I can help you add new activities to your itinerary! Consider adding local attractions, cultural experiences, or activities that match your interests.",
        suggestions: ["Add local attractions", "Include cultural activities", "Try local cuisine experiences"]
      };
    }
    
    if (lowerMessage.includes('change') || lowerMessage.includes('replace')) {
      return {
        message: "I can help you make changes to your itinerary! You can modify accommodations, activities, dining options, or transportation.",
        suggestions: ["Change accommodation", "Update activities", "Modify dining plans", "Adjust transportation"]
      };
    }
    
    return {
      message: "I can help you customize your itinerary! Let me know what specific changes you'd like to make.",
      suggestions: ["Add activities", "Change hotels", "Update meals", "Modify schedule"]
    };
  }

  async handleRegularChat(userMessage, context) {
    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      logger.warn('Groq API key not configured, using enhanced fallback response');
      return this.getEnhancedFallbackResponse(userMessage, context);
    }

    const prompt = PromptBuilder.buildChatPrompt(userMessage, context);
    
    const response = await groqService.chatCompletion([
      {
        role: 'system',
        content: `You are Tripzy's AI travel assistant. You help users plan trips, answer travel questions, and provide destination information. 
        
        IMPORTANT: Always provide SPECIFIC recommendations with real place names, actual restaurant names, real hotel names, and concrete details.
        
        Be helpful, friendly, and informative. When suggesting places:
        - Use actual attraction names (e.g., "Red Fort in Delhi", not "historical site")
        - Recommend real restaurants with specific dishes
        - Suggest actual hotels that exist
        - Provide specific transportation details
        
        If users want to modify their itinerary, encourage them to be specific about what they want to change.
        
        Keep responses concise but informative (max 200 words).`
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      maxTokens: 300,
      temperature: 0.8
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI service');
    }

    return {
      success: true,
      message: aiResponse,
      modified: false
    };
  }

  getEnhancedFallbackResponse(userMessage, context) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for modification requests in fallback
    if (this.isModificationRequest(userMessage)) {
      // Create some default actionable changes for testing
      const defaultChanges = [
        {
          id: 'add_activity_test',
          type: 'add_activity',
          description: 'Add new activity',
          targetDay: 1,
          targetField: 'activities',
          newValue: 'New recommended activity',
          oldValue: ''
        },
        {
          id: 'change_hotel_test',
          type: 'change_accommodation',
          description: 'Change accommodation',
          targetDay: 1,
          targetField: 'accommodation',
          newValue: 'Alternative hotel option',
          oldValue: ''
        }
      ];

      return {
        success: true,
        message: `I understand you want to modify your itinerary. Here are some quick actions you can try:`,
        modified: false,
        suggestions: [
          "Add the Taj Mahal to day 2",
          "Change the hotel on day 1 to a luxury option", 
          "Replace lunch with a different restaurant",
          "Remove the morning activity on day 3"
        ],
        actionableChanges: defaultChanges,
        canApplyChanges: true
      };
    }
    
    // Enhanced keyword-based responses with specific examples
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        success: true,
        message: "Hello! I'm your travel assistant. I can help you with specific destinations, recommend real restaurants and hotels, provide activity suggestions, and modify your itinerary. What would you like to know or change?",
        modified: false
      };
    }
    
    if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation')) {
      const destination = context.itinerary?.destinations?.[0]?.name || 'your destination';
      return {
        success: true,
        message: `I can help you with hotels in ${destination}! You can ask me to:
        
        • "Change the hotel on day 2 to a budget option"
        • "Find a luxury hotel for day 1"
        • "Switch to a boutique hotel instead"
        
        What specific changes would you like to make to your accommodations?`,
        modified: false
      };
    }
    
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food')) {
      const destination = context.itinerary?.destinations?.[0]?.name || 'your destination';
      return {
        success: true,
        message: `I can help modify your dining plans in ${destination}! You can ask me to:
        
        • "Change dinner on day 1 to Italian cuisine"
        • "Add a local street food experience"
        • "Replace lunch with a rooftop restaurant"
        
        What dining changes would you like me to make?`,
        modified: false
      };
    }
    
    if (lowerMessage.includes('activity') || lowerMessage.includes('attraction')) {
      const destination = context.itinerary?.destinations?.[0]?.name || 'your destination';
      return {
        success: true,
        message: `I can modify your activities in ${destination}! You can ask me to:
        
        • "Add a museum visit to day 2"
        • "Remove the shopping activity on day 1"
        • "Include a sunset boat ride"
        
        What activities would you like to change or add?`,
        modified: false
      };
    }

    // Default enhanced response
    return {
      success: true,
      message: "I'm here to help with your travel planning! I can provide specific recommendations and modify your itinerary in real-time. Just tell me what you'd like to change, add, or remove from your trip.",
      modified: false
    };
  }

  getFallbackResponse(userMessage, context) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based responses for common queries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        success: true,
        message: "Hello! I'm your travel assistant. I can help you with trip planning, destination information, travel tips, and answering questions about your itinerary. What would you like to know?"
      };
    }
    
    if (lowerMessage.includes('weather')) {
      return {
        success: true,
        message: "I can help you with weather information! For accurate weather forecasts, I recommend checking the weather for your destination dates. Would you like me to suggest what to pack based on typical weather patterns?"
      };
    }
    
    if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation')) {
      return {
        success: true,
        message: "I can help you find accommodations! What type of accommodation are you looking for? I can suggest hotels, hostels, or vacation rentals based on your budget and preferences."
      };
    }
    
    if (lowerMessage.includes('food') || lowerMessage.includes('restaurant')) {
      return {
        success: true,
        message: "Food is one of the best parts of traveling! I can suggest local cuisines to try, popular restaurants, or dining tips for your destination. What type of food experience are you interested in?"
      };
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      return {
        success: true,
        message: "I can help you plan within your budget! Travel costs vary by destination, season, and travel style. Would you like tips on saving money or help estimating costs for specific activities?"
      };
    }
    
    if (lowerMessage.includes('transport') || lowerMessage.includes('flight')) {
      return {
        success: true,
        message: "I can provide transportation advice! Whether you need help with flights, local transport, or getting around your destination, I'm here to help. What transportation questions do you have?"
      };
    }

    // Default response
    return {
      success: true,
      message: "I'm here to help with your travel planning! I can assist with destinations, activities, accommodations, transportation, budgeting, and general travel advice. What specific aspect of your trip would you like help with?"
    };
  }

  extractSuggestions(responseText) {
    if (!responseText) return [];
    
    // Simple extraction of suggestions from response
    const suggestions = [];
    const lines = responseText.split('\n');
    
    lines.forEach(line => {
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./)) {
        suggestions.push(line.trim().replace(/^[-•\d\.]\s*/, ''));
      }
    });
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  async analyzeUserIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    const intents = {
      planning: ['plan', 'itinerary', 'schedule', 'organize'],
      booking: ['book', 'reserve', 'hotel', 'flight', 'accommodation'],
      information: ['tell me', 'what is', 'information', 'about'],
      weather: ['weather', 'climate', 'temperature', 'rain'],
      food: ['food', 'restaurant', 'eat', 'cuisine', 'dining'],
      transport: ['transport', 'flight', 'train', 'bus', 'taxi'],
      budget: ['budget', 'cost', 'price', 'expensive', 'cheap']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          success: true,
          intent,
          confidence: 0.8
        };
      }
    }
    
    return {
      success: true,
      intent: 'general',
      confidence: 0.5
    };
  }
}

module.exports = new AgentHandler();
