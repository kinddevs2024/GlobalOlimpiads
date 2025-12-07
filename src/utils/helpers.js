export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeRemaining = (endTime) => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const difference = Math.floor((end - now) / 1000);
  return Math.max(0, difference);
};

export const isOlympiadActive = (startTime, endTime) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return now >= start && now <= end;
};

export const isOlympiadUpcoming = (startTime) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  return now < start;
};

export const isOlympiadEnded = (endTime) => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  return now > end;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUserId = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user)._id : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

