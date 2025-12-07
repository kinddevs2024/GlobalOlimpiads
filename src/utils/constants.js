// Use proxy in development, full URL in production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  OWNER: 'owner'
};

export const OLYMPIAD_TYPES = {
  TEST: 'test',
  ESSAY: 'essay'
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  ESSAY: 'essay'
};

export const SUBJECTS = {
  MATH: 'math',
  ENGLISH: 'english',
  SCIENCE: 'science',
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry'
};

export const OLYMPIAD_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

export const CAMERA_CAPTURE_INTERVAL = 30000; // 30 seconds

export const TIMER_WARNING_THRESHOLD = 300; // 5 minutes in seconds
export const TIMER_DANGER_THRESHOLD = 60; // 1 minute in seconds

