const asyncHandler = require('express-async-handler');
const agentHandler = require('../llm/agentHandler');
const itineraryModificationService = require('../services/itineraryModificationService');

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
    console.log('Agent chat request:', { 
      userId: req.user._id, 
      message: message.substring(0, 100),
      hasContext: !!context,
      hasItineraryId: !!context?.itineraryId
    });

    // Add user ID to context for itinerary modifications
    const enhancedContext = {
      ...context,
      userId: req.user._id
    };

    const response = await agentHandler.handleChat(message.trim(), enhancedContext);

    console.log('Agent response:', {
      success: response.success,
      modified: response.modified,
      actionableChangesCount: response.actionableChanges?.length || 0,
      messageLength: response.message?.length || 0
    });

    res.status(200).json({
      success: response.success,
      message: response.message,
      modified: response.modified || false,
      itinerary: response.itinerary || null,
      changes: response.changes || null,
      suggestions: response.suggestions || [],
      actionableChanges: response.actionableChanges || [],
      canApplyChanges: response.canApplyChanges || false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    res.status(500).json({
      success: false,
      message: 'I apologize, but I\'m experiencing some technical difficulties. Please try again.',
      modified: false,
      suggestions: [],
      actionableChanges: [],
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

// @desc    Apply actionable change to itinerary
// @route   POST /api/agent/apply-change
// @access  Private
const applyActionableChange = asyncHandler(async (req, res) => {
  const { itineraryId, changeAction } = req.body;

  if (!itineraryId || !changeAction) {
    res.status(400);
    throw new Error('Itinerary ID and change action are required');
  }

  try {
    console.log('Applying actionable change:', { 
      userId: req.user._id, 
      itineraryId, 
      changeType: changeAction.type 
    });

    const result = await itineraryModificationService.applyActionableChange(
      itineraryId,
      changeAction,
      req.user._id
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      itinerary: result.itinerary || null,
      applied: result.success,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Apply change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply the change. Please try again.',
      applied: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  chatWithAgent,
  updateItinerary,
  applyActionableChange
};
