import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://parent-ai-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add device token
api.interceptors.request.use(
  async (config) => {
    const deviceToken = await AsyncStorage.getItem('deviceToken');
    const parentToken = await AsyncStorage.getItem('parentToken');
    
    if (parentToken) {
      config.headers.Authorization = `Bearer ${parentToken}`;
    }
    if (deviceToken) {
      config.headers['X-Device-Token'] = deviceToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Child Device API
export const childAPI = {
  // Link device to parent account using pairing code
  linkDevice: (pairingCode, deviceInfo) => 
    api.post('/child/link', { pairingCode, deviceInfo }),
  
  // Check if device is linked
  checkLinkStatus: () => 
    api.get('/child/status'),
  
  // Submit activity for monitoring
  submitActivity: (activityData) => 
    api.post('/monitoring/activity', activityData),
  
  // Send heartbeat to show device is active
  sendHeartbeat: (deviceInfo) => 
    api.post('/child/heartbeat', deviceInfo),
  
  // Submit summary report (every minute)
  submitSummary: (summaryData) => 
    api.post('/child/summary', summaryData),
  
  // Get monitoring settings from parent
  getSettings: () => 
    api.get('/child/settings'),
};

export default api;

