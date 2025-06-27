const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    const token = localStorage.getItem('tripzy_token');
    console.log('Getting auth token:', token ? 'Token exists' : 'No token found');
    return token;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('API Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer [TOKEN]' : 'No token' });
    return headers;
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    console.log('Making API call:', { url, method: config.method || 'GET', hasToken: !!this.getAuthToken() });

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('API call failed:', { status: response.status, statusText: response.statusText, data });
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('API call success:', { endpoint, status: response.status });
      return data;
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Itinerary API methods
  async generateItinerary(formData) {
    return this.apiCall('/itinerary/generate', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  async saveDraftItinerary(formData) {
    return this.apiCall('/itinerary/save-draft', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  async getUserItineraries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/itinerary${queryString ? `?${queryString}` : ''}`;
    return this.apiCall(endpoint);
  }

  async getItinerary(id) {
    return this.apiCall(`/itinerary/${id}`);
  }

  async updateItinerary(id, data) {
    return this.apiCall(`/itinerary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteItinerary(id) {
    return this.apiCall(`/itinerary/${id}`, {
      method: 'DELETE'
    });
  }

  // User API methods
  async getUserProfile() {
    return this.apiCall('/user/profile');
  }

  async getTripHistory() {
    return this.apiCall('/user/trip-history');
  }

  async getCurrentTrips() {
    return this.apiCall('/user/current-trips');
  }

  // Agent API methods
  async chatWithAgent(message, context = {}) {
    return this.apiCall('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }

  async updateItineraryViaAgent(itinerary, userRequest) {
    return this.apiCall('/agent/update', {
      method: 'POST',
      body: JSON.stringify({ itinerary, userRequest })
    });
  }

  // Regenerate itinerary with AI
  async regenerateItinerary(itineraryId) {
    return this.apiCall(`/itinerary/${itineraryId}/regenerate`, {
      method: 'PUT'
    });
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
