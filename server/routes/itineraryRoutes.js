const express = require('express');
const router = express.Router();
const {
  generateItinerary,
  getUserItineraries,
  getItinerary,
  saveDraftItinerary,
  updateItinerary,
  deleteItinerary
} = require('../controllers/itineraryController');
const { protect } = require('../middlewares/authMiddleware');

// Itinerary routes
router.post('/generate', protect, generateItinerary);
router.post('/save-draft', protect, saveDraftItinerary);
router.get('/', protect, getUserItineraries);
router.get('/:id', protect, getItinerary);
router.put('/:id', protect, updateItinerary);
router.delete('/:id', protect, deleteItinerary);

module.exports = router;
