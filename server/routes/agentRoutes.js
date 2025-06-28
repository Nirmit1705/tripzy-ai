const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { chatWithAgent, updateItinerary, applyActionableChange } = require('../controllers/agentController');

// Agent routes
router.post('/chat', protect, chatWithAgent);
router.post('/update', protect, updateItinerary);
router.post('/apply-change', protect, applyActionableChange);

module.exports = router;



