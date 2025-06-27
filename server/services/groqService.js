const axios = require('axios');
const logger = require('../utils/logger');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
  }

  async generateCompletion(prompt, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

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
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data;
    } catch (error) {
      logger.error('Groq API error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Groq API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async chatCompletion(messages, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

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
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data;
    } catch (error) {
      logger.error('Groq chat completion error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Groq API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Test method to check if API is working
  async testConnection() {
    try {
      const response = await this.chatCompletion([
        { role: 'user', content: 'Hello, can you respond with just "API working"?' }
      ], { maxTokens: 10 });
      
      return {
        success: true,
        message: 'Groq API connection successful',
        response: response.choices[0]?.message?.content
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new GroqService();
