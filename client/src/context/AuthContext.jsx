import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL, API_CONFIG } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const authCheckInProgress = useRef(false);
  
  // Configure axios instance with centralized config
  const api = axios.create({
    ...API_CONFIG,
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
  });

  // Add request interceptor for token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // When sending FormData, let the browser handle the Content-Type with boundary
      if (config.data instanceof FormData) {
        // Delete any manually set content-type to let the browser set it
        delete config.headers['Content-Type'];
        console.log('Form data detected - setting up proper request', config.url);
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        try {
          const refreshResponse = await api.post('/api/auth/refresh');
          const newToken = refreshResponse.data.token;
          localStorage.setItem('authToken', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch (refreshError) {
          localStorage.removeItem('authToken');
          window.location.href = '/signin';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  // Memoize the auth check function to prevent unnecessary recreations
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      return;
    }
    
    authCheckInProgress.current = true;
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          
          // Sanitize user data to ensure consistent structure
          const userData = response.data;
          
          // Always ensure user has proper agent status - if isAgent is undefined OR null, set it to false
          if (userData.isAgent === undefined || userData.isAgent === null) {
            userData.isAgent = false;
          }
          
          // Force convert to boolean to avoid any string values
          userData.isAgent = !!userData.isAgent;
          
          // Handle agentRequest conversion - simplify to just isAgent true/false
          if (userData.agentRequest) {
            if (userData.agentRequest.status === 'approved') {
              // If approved, set as agent and keep agentRequest data for profile
              userData.isAgent = true;
              userData.userType = 'agent';
            } else if (userData.agentRequest.status === 'rejected') {
              // Keep rejected status to show feedback to user
              userData.isAgent = false;
              userData.userType = 'regular';
            } else if (userData.agentRequest.status === 'pending') {
              // If pending, keep status but ensure user is not an agent yet
              userData.isAgent = false;
              userData.userType = 'regular';
            } else if (!userData.agentRequest.status) {
              // If no status, remove the request
              delete userData.agentRequest;
            }
          }
          
          console.log('Sanitized user data:', {
            id: userData._id,
            username: userData.username,
            isAgent: userData.isAgent,
            hasAgentRequest: !!userData.agentRequest,
            agentRequestStatus: userData.agentRequest?.status
          });
          
          setUser(userData);
        } catch (apiError) {
          if (apiError.response?.status === 401) {
            localStorage.removeItem('authToken');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch {
      // Ignore general errors and just set user to null
      setUser(null);
    } finally {
      setLoading(false);
      setAuthInitialized(true);
      authCheckInProgress.current = false;
    }
  }, [api]);

  // Check for saved token on mount - only once
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      if (isMounted && !authInitialized) {
        await checkAuth();
      }
    };
    
    initAuth();
    
    // Set up event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' && isMounted) {
        setLoading(true);
        setAuthInitialized(false);
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth, authInitialized]);

  // Sign in user
  const signin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/signin', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        
        // Sanitize user data
        const userData = response.data.user;
        
        // Always ensure user has proper agent status - if isAgent is undefined OR null, set it to false
        if (userData.isAgent === undefined || userData.isAgent === null) {
          userData.isAgent = false;
        }
        
        // Force convert to boolean to avoid any string values
        userData.isAgent = !!userData.isAgent;
        
        // Handle agentRequest conversion - simplify to just isAgent true/false
        if (userData.agentRequest) {
          if (userData.agentRequest.status === 'approved') {
            // If approved, set as agent and keep agentRequest data for profile
            userData.isAgent = true;
            userData.userType = 'agent';
          } else if (userData.agentRequest.status === 'rejected') {
            // Keep rejected status to show feedback to user
            userData.isAgent = false;
            userData.userType = 'regular';
          } else if (userData.agentRequest.status === 'pending') {
            // If pending, keep status but ensure user is not an agent yet
            userData.isAgent = false;
            userData.userType = 'regular';
          } else if (!userData.agentRequest.status) {
            // If no status, remove the request
            delete userData.agentRequest;
          }
        }
        
        console.log('Sanitized user data:', {
          id: userData._id,
          username: userData.username,
          isAgent: userData.isAgent,
          hasAgentRequest: !!userData.agentRequest,
          agentRequestStatus: userData.agentRequest?.status
        });
        
        setUser(userData);
        setLoading(false);
        setAuthInitialized(true);
        return response.data;
      }
      throw new Error('Invalid credentials');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [api]);

  // Sign out user
  const signout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    return true;
  }, []);

  // Memoize the context value to prevent unnecessary rerenders
  const value = {
    user,
    setUser,
    api,
    signin,
    signout,
    loading,
    authInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}