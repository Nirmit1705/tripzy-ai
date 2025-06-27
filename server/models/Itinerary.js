const mongoose = require('mongoose');

const itinerarySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  startingPoint: {
    type: String,
    required: true
  },
  destinations: [{
    name: String,
    coordinates: {
      lat: Number,
      lon: Number
    },
    cityCode: String
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  numberOfDays: {
    type: Number,
    required: true
  },
  travelers: {
    type: Number,
    required: true,
    default: 1
  },
  budget: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  interests: [String],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  totalCost: {
    type: Number,
    default: 0
  },
  dailyItinerary: [{
    day: Number,
    date: Date,
    activities: [String],
    hotels: [{
      name: String,
      address: String,
      price: Number,
      rating: Number
    }],
    transport: {
      mode: String,
      details: String,
      cost: Number
    },
    weather: {
      temp: String,
      condition: String,
      humidity: String
    }
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  userReview: String,
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Itinerary', itinerarySchema);