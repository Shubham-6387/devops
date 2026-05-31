import axios from "axios";

// In production (Docker/K8s): VITE_API_URL is injected at build time
// In development (vite dev server): proxy in vite.config.js routes /api to backend
// Fallback: /api works via Nginx proxy_pass in production
const BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
