const axios = require('axios');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
  }

  async generateCompletion(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/completions`, {
        model: options.model || 'llama3-8b-8192',
        prompt: prompt,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message);
      throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async chatCompletion(messages, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: options.model || 'llama3-8b-8192',
        messages: messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Groq chat completion error:', error.response?.data || error.message);
      throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new GroqService();
