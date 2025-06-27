import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    const token = localStorage.getItem('tripzy_token');
    const userData = localStorage.getItem('tripzy_user');
    
    console.log('AuthContext - Initial check:', { hasToken: !!token, hasUser: !!userData });
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('AuthContext - Restored auth for user:', parsedUser.email);
      } catch (error) {
        console.error('AuthContext - Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('tripzy_token');
        localStorage.removeItem('tripzy_user');
        setIsAuthenticated(false);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    console.log('AuthContext - Logging in user:', userData.email);
    
    // Store in localStorage
    localStorage.setItem('tripzy_token', token);
    localStorage.setItem('tripzy_user', JSON.stringify(userData));
    
    // Update state
    setUser(userData);
    setIsAuthenticated(true);
    
    console.log('AuthContext - Login successful, token stored');
  };

  const logout = () => {
    console.log('AuthContext - Logging out user');
    
    // Clear localStorage
    localStorage.removeItem('tripzy_token');
    localStorage.removeItem('tripzy_user');
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    
    console.log('AuthContext - Logout successful');
  };

  // Add method to check if user is truly authenticated
  const checkAuthStatus = () => {
    const token = localStorage.getItem('tripzy_token');
    const userData = localStorage.getItem('tripzy_user');
    const isValid = !!(token && userData);
    
    console.log('AuthContext - Auth status check:', { isValid, isAuthenticated });
    
    // If tokens exist but state doesn't match, update state
    if (isValid && !isAuthenticated && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('AuthContext - Error restoring auth state:', error);
        logout();
        return false;
      }
    }
    
    return isValid;
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
