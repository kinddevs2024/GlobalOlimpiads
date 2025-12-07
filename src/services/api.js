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
  loginWithGoogle: (token) => api.post('/auth/google', { token }),
  getMe: () => api.get('/auth/me')
};

// Olympiad endpoints
export const olympiadAPI = {
  getAll: () => api.get('/olympiads'),
  getById: (id) => api.get(`/olympiads/${id}`),
  submit: (id, data) => api.post(`/olympiads/${id}/submit`, data),
  getResults: (olympiadId, userId = null) => {
    // Backend expects: GET /api/olympiads/results?olympiadId=xxx&userId=xxx
    // Backend returns full list of results for that olympiad
    // Frontend filters the list to find the specific person's result
    const params = new URLSearchParams();
    if (olympiadId) params.append('olympiadId', olympiadId);
    if (userId) params.append('userId', userId);
    const query = params.toString();
    return api.get(`/olympiads/results${query ? `?${query}` : ''}`);
  },
  uploadCameraCapture: (formData) => {
    // formData should include: olympiadId, captureType ('camera' | 'screen'), image (File)
    return api.post('/olympiads/camera-capture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadBatchCaptures: (formData) => {
    // formData should include: olympiadId, images (multiple File objects)
    // Backend expects batch upload of accumulated images
    return api.post('/olympiads/camera-capture/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadVideo: (formData, onUploadProgress) => {
    // formData should include: olympiadId, video (File object)
    // Upload the recorded video file to backend
    return api.post('/olympiads/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      }
    });
  },
  stopRecording: (olympiadId) => {
    // Notify backend to convert accumulated images to MP4 video
    return api.post(`/olympiads/${olympiadId}/stop-recording`);
  },
  uploadExitScreenshot: (formData) => {
    // formData should include: olympiadId, cameraImage, screenImage, exitType (tab_switch/close/navigate)
    // Used when user leaves the page - captures last frame before exit
    return api.post('/olympiads/exit-screenshot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Admin endpoints
export const adminAPI = {
  // Olympiad management
  getAllOlympiads: () => api.get('/admin/olympiads'),
  getOlympiadById: (id) => api.get(`/admin/olympiads/${id}`),
  createOlympiad: (data) => api.post('/admin/olympiads', data),
  updateOlympiad: (id, data) => api.put(`/admin/olympiads/${id}`, data),
  deleteOlympiad: (id) => api.delete(`/admin/olympiads/${id}`),
  
  // Question management
  getQuestions: (olympiadId) => {
    const url = olympiadId 
      ? `/admin/questions?olympiadId=${olympiadId}`
      : '/admin/questions';
    return api.get(url);
  },
  addQuestion: (data) => api.post('/admin/questions', data),
  
  // User management
  getUsers: () => api.get('/admin/users'),
  
  // Submissions
  getSubmissions: (olympiadId, userId) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append('olympiadId', olympiadId);
    if (userId) params.append('userId', userId);
    const query = params.toString();
    return api.get(`/admin/submissions${query ? `?${query}` : ''}`);
  },
  
  // Camera captures
  getCameraCaptures: (olympiadId) => api.get(`/admin/camera-captures/${olympiadId}`)
};

// Owner endpoints
export const ownerAPI = {
  getAnalytics: () => api.get('/owner/analytics'),
  changeUserRole: (userId, role) => api.put(`/owner/users/${userId}/role`, { role }),
  getReports: (olympiadId) => {
    const url = olympiadId 
      ? `/owner/reports?olympiadId=${olympiadId}`
      : '/owner/reports';
    return api.get(url);
  }
};

export default api;

