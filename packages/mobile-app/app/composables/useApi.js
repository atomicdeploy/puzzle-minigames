// API Composable for Nuxt app
import { useRuntimeConfig } from '#app';

export function useApi() {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBaseUrl;

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

  // API Helper functions
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
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
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
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
