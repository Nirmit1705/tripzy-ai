const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { chatWithAgent, updateItinerary } = require('../controllers/agentController');

router.post('/chat', protect, chatWithAgent);
router.post('/update', protect, updateItinerary);

module.exports = router;
router.post('/update', protect, (req, res) => {
  res.json({ message: 'Update itinerary via AI endpoint' });
});

module.exports = router;
