import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, MapPin, Users, Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function LoginPage() {
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLogin, setIsLogin] = useState(true);

  // Check URL parameters to determine if it's signup mode
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [location]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Handle login/signup logic here
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


          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#6da57b' }}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#6da57b' }}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all duration-200"
                  style={{ focusRingColor: '#6da57b' }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm hover:underline" style={{ color: '#2e7f43' }}>
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                backgroundColor: '#2e7f43',
                focusRingColor: '#6da57b'
              }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Continue with Google</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 font-medium hover:underline"
                style={{ color: '#2e7f43' }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}