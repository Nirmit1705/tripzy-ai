const asyncHandler = require('express-async-handler');
const agentHandler = require('../llm/agentHandler');

// @desc    Chat with AI agent
// @route   POST /api/agent/chat
// @access  Private
const chatWithAgent = asyncHandler(async (req, res) => {
  const { message, context } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Message is required');
  }

  try {
    console.log('Agent chat request:', { userId: req.user._id, message: message.substring(0, 100) });

    const response = await agentHandler.handleChat(message.trim(), context || {});

    res.status(200).json({
      success: response.success,
      message: response.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    res.status(500).json({
      success: false,
      message: 'I apologize, but I\'m experiencing some technical difficulties. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update itinerary via agent
// @route   POST /api/agent/update
// @access  Private
const updateItinerary = asyncHandler(async (req, res) => {
  const { itinerary, userRequest } = req.body;

  if (!userRequest || !userRequest.trim()) {
    res.status(400);
    throw new Error('Update request is required');
  }

  try {
    console.log('Itinerary update request:', { userId: req.user._id, request: userRequest.substring(0, 100) });

    const response = await agentHandler.handleItineraryUpdate(itinerary, userRequest.trim());

    res.status(200).json({
      success: response.success,
      message: response.message,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Itinerary update error:', error);
    res.status(500).json({
      success: false,
      message: 'I apologize, but I\'m having trouble processing your itinerary update request. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  chatWithAgent,
  updateItinerary
};
