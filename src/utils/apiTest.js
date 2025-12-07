// Utility to test API connection
export const testAPIConnection = async () => {
  try {
    // Use the proxy in development (same origin), or full URL in production
    const apiUrl = import.meta.env.DEV 
      ? '/api/health' 
      : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/health';
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      message: 'Cannot connect to backend server. Make sure it is running on http://localhost:3000'
    };
  }
};

