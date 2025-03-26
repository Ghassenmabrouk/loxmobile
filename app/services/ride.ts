// app/services/ride.ts
import axios from 'axios';

const API_BASE_URL = 'https://loxuryabackend-1.onrender.com/ride';

export const RideService = {
  createRide: async (rideData: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/create`, rideData, {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error;
    }
  },

  getUserRides: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/myrides`, {
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user rides:', error);
      throw error;
    }
  },

  // Add other methods as needed
  getRoute: async (start: string, end: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/route`, {
        params: { start, end }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  },

  getSuggestions: async (query: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/suggestions`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  }
};