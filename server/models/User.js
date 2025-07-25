const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleUser;
    }
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: null
  },
  preferences: {
    budget: String,
    travelStyle: String,
    interests: [String],
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    }
  },
  tripHistory: [{
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary'
    },
    title: String,
    destinations: [String],
    startDate: Date,
    endDate: Date,
    totalCost: Number,
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'ongoing'],
      default: 'completed'
    },
  }],
  travelStats: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalDestinations: {
      type: Number,
      default: 0
    },
    totalDrafts: {
      type: Number,
      default: 0
    },
    lastTripDate: Date
  }
}, {
  timestamps: true
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (this.isGoogleUser) {
    return false; // Google users don't have passwords
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isGoogleUser) {
    next();
  } else {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

module.exports = mongoose.model('User', userSchema);