const groqService = require('../services/groqService');
const PromptBuilder = require('./promptBuilder');
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

      // Check if Groq API key is configured
      if (!process.env.GROQ_API_KEY) {
        logger.warn('Groq API key not configured, using fallback response');
        return this.getFallbackResponse(userMessage, context);
      }

      const prompt = PromptBuilder.buildChatPrompt(userMessage, context);
      
      const response = await groqService.chatCompletion([
        {
          role: 'system',
          content: `You are Tripzy's AI travel assistant. You help users plan trips, answer travel questions, and provide destination information. 
          Be helpful, friendly, and informative. If you don't know something specific, suggest general travel advice or ask clarifying questions.
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
        message: aiResponse
      };

    } catch (error) {
      logger.error('Error in handleChat:', error);
      return this.getFallbackResponse(userMessage, context);
    }
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
