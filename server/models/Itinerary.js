const mongoose = require('mongoose');

const destinationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  description: String,
  activities: [String],
  estimatedCost: Number
});

const dailyItinerarySchema = mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  date: Date,
  location: String,
  activities: [String],
  meals: {
    breakfast: String,
    lunch: String,
    dinner: String
  },
  accommodation: {
    name: String,
    address: String,
    rating: Number,
    price: Number,
    currency: String
  },
  transportation: {
    mode: String,
    details: String,
    cost: Number,
    currency: String
  },
  weather: {
    temperature: String,
    condition: String,
    humidity: String
  },
  estimatedCost: {
    type: Number,
    default: 0
  }
});

const itinerarySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  destinations: [destinationSchema],
  startLocation: {
    type: String,
    required: true
  },
  startingPoint: {
    type: String,
    required: true
  },
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
    required: true,
    min: 1,
    max: 30
  },
  budget: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    required: true
  },
  travelers: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  interests: [String],
  preferences: {
    startTime: {
      type: String,
      default: '09:00'
    },
    endTime: {
      type: String,
      default: '18:00'
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    dietaryRestrictions: [String],
    accessibility: [String]
  },
  dailyItinerary: [dailyItinerarySchema],
  totalCost: {
    type: Number,
    default: 0
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'confirmed', 'saved', 'completed', 'cancelled'],
    default: 'draft'
  },
  createdFrom: {
    type: String,
    enum: ['form', 'ai', 'import'],
    default: 'form'
  },
  generatedBy: {
    type: String,
    default: 'user'
  },
  aiModel: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  userReview: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
itinerarySchema.index({ user: 1, status: 1 });
itinerarySchema.index({ user: 1, createdAt: -1 });
itinerarySchema.index({ startDate: 1 });

// Virtual for duration in days
itinerarySchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
});

// Pre-save middleware to calculate end date if not provided
itinerarySchema.pre('save', function(next) {
  if (this.startDate && this.numberOfDays && !this.endDate) {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + this.numberOfDays - 1);
    this.endDate = endDate;
  }
  next();
});

module.exports = mongoose.model('Itinerary', itinerarySchema);