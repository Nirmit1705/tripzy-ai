import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Trip Planning API calls
export const tripAPI = {
  // Generate itinerary
  generateItinerary: async (tripData) => {
    try {
      const response = await api.post('/generate-itinerary', tripData)
      return response.data
    } catch (error) {
      console.error('Error generating itinerary:', error)
      throw error
    }
  },

  // Get destination suggestions
  getDestinationSuggestions: async (query) => {
    try {
      const response = await api.get(`/destinations/search?q=${query}`)
      return response.data
    } catch (error) {
      console.error('Error fetching destinations:', error)
      throw error
    }
  },

  // Get weather data
  getWeatherData: async (destination) => {
    try {
      const response = await api.get(`/weather/${destination}`)
      return response.data
    } catch (error) {
      console.error('Error fetching weather:', error)
      throw error
    }
  },

  // Get local events
  getLocalEvents: async (destination, dates) => {
    try {
      const response = await api.get(`/events/${destination}`, {
        params: { startDate: dates.start, endDate: dates.end }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }
}

// Utility functions
export const formatError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  return error.message || 'An unexpected error occurred'
}

export default api
