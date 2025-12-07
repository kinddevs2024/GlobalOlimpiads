import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getToken, removeToken, removeUser } from '../utils/helpers';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      removeUser();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Olympiad endpoints
export const olympiadAPI = {
  getAll: () => api.get('/olympiads'),
  getById: (id) => api.get(`/olympiads/${id}`),
  submit: (id, data) => api.post(`/olympiads/${id}/submit`, data),
  getResults: (id) => api.get(`/olympiads/${id}/results`),
  uploadCameraCapture: (formData) => api.post('/olympiads/camera-capture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Admin endpoints
export const adminAPI = {
  createOlympiad: (data) => api.post('/admin/olympiads', data),
  updateOlympiad: (id, data) => api.put(`/admin/olympiads/${id}`, data),
  deleteOlympiad: (id) => api.delete(`/admin/olympiads/${id}`),
  addQuestion: (data) => api.post('/admin/questions', data),
  getSubmissions: (olympiadId) => api.get(`/admin/submissions?olympiadId=${olympiadId}`),
  getUsers: () => api.get('/admin/users'),
  getCameraCaptures: (olympiadId) => api.get(`/admin/camera-captures/${olympiadId}`)
};

// Owner endpoints
export const ownerAPI = {
  getAnalytics: () => api.get('/owner/analytics'),
  changeUserRole: (userId, role) => api.post(`/owner/users/${userId}/role`, { role }),
  getReports: () => api.get('/owner/reports')
};

export default api;

