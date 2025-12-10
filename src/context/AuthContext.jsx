import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/helpers';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const savedUser = getUser();
      
      if (token && savedUser) {
        try {
          const response = await authAPI.getMe();
          setUserState(response.data);
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          removeToken();
          removeUser();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      setUserState(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          (error.code === 'ERR_NETWORK' ? 'Cannot connect to server. Make sure backend is running.' : 'Login failed');
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      setUserState(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          (error.code === 'ERR_NETWORK' ? 'Cannot connect to server. Make sure backend is running.' : 'Registration failed');
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await authAPI.loginWithGoogle(googleToken);
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      setUserState(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          (error.code === 'ERR_NETWORK' ? 'Cannot connect to server. Make sure backend is running.' : 'Google login failed');
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUserState(userData);
    setUser(userData);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    setUser: updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

