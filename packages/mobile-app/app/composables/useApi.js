// API Composable for Nuxt app
import { useRuntimeConfig } from '#app';

export function useApi() {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public?.apiBaseUrl;

  if (typeof API_BASE_URL !== 'string' || API_BASE_URL.trim() === '') {
    throw new Error(
      'Runtime configuration error: public.apiBaseUrl is not set or is invalid. ' +
      'Please configure `public.apiBaseUrl` in your Nuxt runtime config/environment.'
    );
  }
  // API Endpoints
  const API_ENDPOINTS = {
    // Auth endpoints
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    
    // User endpoints
    GET_USER: '/user/profile',
    UPDATE_USER: '/user/profile',
    
    // Game endpoints
    GET_GAME_STATE: '/game/state',
    SAVE_GAME_STATE: '/game/state',
  };

  // API Helper functions with retry logic
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    
    // Add authorization token if available
    if (process.client) {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        // Try to parse JSON response
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          // If response is not JSON, create error object
          data = { message: 'Invalid response format' };
        }
        
        if (!response.ok) {
          // Categorize errors
          const error = new Error(data.message || 'API request failed');
          error.status = response.status;
          error.data = data;
          
          // Don't retry on client errors (4xx), only on server errors (5xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          // For server errors, retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
            continue;
          }
          
          throw error;
        }
        
        return data;
      } catch (error) {
        lastError = error;
        
        // Network errors - retry with exponential backoff
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          if (attempt < maxRetries) {
            console.warn(`Network error, retrying... (${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
            continue;
          }
        }
        
        // For other errors or if we've exhausted retries, throw
        console.error('API request error:', error);
        throw error;
      }
    }
    
    throw lastError;
  }

  // Specific API functions
  return {
    // Register a new user
    async register(userData) {
      return apiRequest(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    
    // Login user
    async login(phone) {
      return apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },
    
    // Send OTP
    async sendOTP(phone) {
      return apiRequest(API_ENDPOINTS.SEND_OTP, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },
    
    // Verify OTP
    async verifyOTP(phone, otp) {
      return apiRequest(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
    },
    
    // Get user profile
    async getUserProfile() {
      return apiRequest(API_ENDPOINTS.GET_USER, {
        method: 'GET',
      });
    },
    
    // Update user profile
    async updateUserProfile(userData) {
      return apiRequest(API_ENDPOINTS.UPDATE_USER, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },
    
    // Get game state
    async getGameState() {
      return apiRequest(API_ENDPOINTS.GET_GAME_STATE, {
        method: 'GET',
      });
    },
    
    // Save game state
    async saveGameState(gameState) {
      return apiRequest(API_ENDPOINTS.SAVE_GAME_STATE, {
        method: 'POST',
        body: JSON.stringify(gameState),
      });
    },
  };
}
