import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle OAuth success and errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const errorParam = urlParams.get('error');

    // Only process if we have URL params and user is not already authenticated
    if (!isAuthenticated && (token || errorParam)) {
      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          login(userData, token);
          
          // Check if there's a pending trip form to redirect to
          const pendingTripForm = sessionStorage.getItem('pendingTripForm');
          if (pendingTripForm) {
            console.log('Found pending trip form, redirecting to plan page');
            navigate('/plan', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setError('Authentication failed. Please try again.');
          navigate('/login', { replace: true });
        }
      } else if (errorParam) {
        const errorMessages = {
          'oauth_failed': 'Google authentication failed. Please try again.',
          'oauth_denied': 'Access was denied. Please allow permissions to continue.',
          'no_code': 'Authentication was incomplete. Please try again.',
          'email_not_verified': 'Please use a verified Gmail account.',
          'auth_failed': 'Authentication failed. Please try again.'
        };
        setError(errorMessages[errorParam] || 'An error occurred during authentication.');
        navigate('/login', { replace: true });
      }
    }
  }, [location.search, login, navigate, isAuthenticated]);

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    window.location.href = `${apiBaseUrl}/user/auth/google`;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Hero Section */}
      <div className="lg:w-1/2 lg:h-full h-1/3 flex flex-col justify-center items-center p-4 text-white relative overflow-hidden" 
           style={{ background: 'linear-gradient(135deg, #2e7f43 0%, #6da57b 100%)' }}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 border border-white rounded-full"></div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="mb-4">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <h1 className="text-2xl font-bold mb-2">Plan Your Perfect Trip</h1>
            <p className="text-sm opacity-90">
              Create personalized itineraries and discover amazing destinations tailored just for you
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center">
              <Users className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">50K+ Travelers</p>
            </div>
            <div className="text-center">
              <Calendar className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">100K+ Trips Planned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="lg:w-1/2 lg:h-full h-2/3 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Tripzy</h2>
            <p className="text-gray-600">Sign in with your Google account to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ focusRingColor: '#6da57b' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                By continuing, you agree to our{' '}
                <a href="#" className="font-medium hover:underline" style={{ color: '#2e7f43' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium hover:underline" style={{ color: '#2e7f43' }}>
                  Privacy Policy
                </a>
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm font-medium hover:underline"
                style={{ color: '#2e7f43' }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}