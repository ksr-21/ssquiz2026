import axios from 'axios';

const isProd = import.meta.env.PROD;
const api = axios.create({
  baseURL: isProd ? (import.meta.env.VITE_API_URL || 'https://exam-app-lilac-theta.vercel.app/api') : `http://${window.location.hostname}:5000/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
