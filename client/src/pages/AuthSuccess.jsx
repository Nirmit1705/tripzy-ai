import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return; // Prevent multiple executions

    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    console.log('AuthSuccess - Processing:', { token: !!token, userParam: !!userParam });

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('AuthSuccess - User data parsed successfully');

        login(userData, token);
        setProcessed(true);

        // Small delay to ensure state updates
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setProcessed(true);
        navigate('/login?error=auth_failed', { replace: true });
      }
    } else {
      console.log('AuthSuccess - Missing token or user data, redirecting to login');
      setProcessed(true);
      navigate('/login', { replace: true });
    }
  }, [location.search, login, navigate, processed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2e7f43] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-[#2e7f43]">Completing authentication...</h2>
        <p className="text-sm text-gray-600 mt-2">Please wait while we log you in</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
