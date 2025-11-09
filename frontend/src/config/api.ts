import axios from 'axios';

// Get AI Agent URL from environment variable or use default
const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || 'http://localhost:3001';

// Create axios instance for AI Agent API
export const aiAgentApi = axios.create({
  baseURL: AI_AGENT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add response interceptor for error handling
aiAgentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI Agent API Error:', error);
    return Promise.reject(error);
  }
);

export default aiAgentApi;
