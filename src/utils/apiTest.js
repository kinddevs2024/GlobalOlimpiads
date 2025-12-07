// Utility to test API connection
export const testAPIConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      message: 'Cannot connect to backend server. Make sure it is running on http://localhost:5000'
    };
  }
};

