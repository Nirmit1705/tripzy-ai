class PromptBuilder {
  static buildItineraryPrompt(destination, days, budget, preferences) {
    const destinationsList = Array.isArray(destination) ? destination.join(', ') : destination;
    const interestsList = Array.isArray(preferences.interests) ? preferences.interests.join(', ') : 'general sightseeing';
    
    return `Create a detailed ${days}-day travel itinerary for ${destinationsList}.
    
Budget: ${budget} budget level
Travelers: ${preferences.travelers || 1} people
Interests: ${interestsList}
Travel style: ${preferences.travelStyle || 'balanced'}

Please provide:
1. Daily activities and attractions
2. Recommended accommodations
3. Transportation suggestions
4. Local food recommendations
5. Estimated costs
6. Practical tips

Make it engaging and practical for the specified budget and interests.`;
  }

  static buildChatPrompt(userMessage, context) {
    let prompt = `User question: ${userMessage}\n\n`;
    
    if (context.itinerary) {
      prompt += `Current trip context:
- Destination: ${context.itinerary.destinations?.join(', ') || context.itinerary.destination || 'Not specified'}
- Duration: ${context.itinerary.numberOfDays || context.itinerary.days || 'Not specified'} days
- Budget: ${context.itinerary.budget || 'Not specified'}
- Travelers: ${context.itinerary.travelers || 'Not specified'}
- Start date: ${context.itinerary.startDate || 'Not specified'}
`;
    }
    
    if (context.currentDay) {
      prompt += `\nCurrently viewing: Day ${context.currentDay} of the itinerary`;
    }
    
    prompt += `\nPlease provide helpful travel advice or information related to their question.`;
    
    return prompt;
  }

  static buildUpdatePrompt(currentItinerary, updateRequest) {
    return `Current itinerary details:
${JSON.stringify(currentItinerary, null, 2)}

User's update request: ${updateRequest}

Please provide specific suggestions for updating this itinerary based on the user's request. Include:
1. What changes to make
2. Alternative options
3. Any considerations (budget, time, logistics)
4. Step-by-step implementation if applicable

Keep suggestions practical and actionable.`;
  }

  static buildDestinationPrompt(destination, interests = []) {
    return `Provide comprehensive information about ${destination} as a travel destination.

Include:
1. Top attractions and landmarks
2. Best time to visit
3. Local culture and customs
4. Food and dining recommendations
5. Transportation options
6. Budget considerations
7. Safety tips
8. Hidden gems and local favorites

${interests.length > 0 ? `Focus especially on: ${interests.join(', ')}` : ''}

Make it informative and engaging for travelers.`;
  }

  static buildWeatherPrompt(destination, dates) {
    return `Provide weather information and packing advice for ${destination} during ${dates}.

Include:
1. Expected weather conditions
2. Temperature ranges
3. Rainfall/seasonal patterns
4. What to pack and wear
5. Weather-related activity recommendations
6. Any seasonal considerations

Be practical and helpful for trip planning.`;
  }
}

module.exports = PromptBuilder;
