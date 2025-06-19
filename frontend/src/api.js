// src/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies/sessions
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handles token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not a login/refresh request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          // Store new tokens
          localStorage.setItem("token", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed", refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;