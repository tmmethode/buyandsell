import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // In case other state keys are used
      localStorage.removeItem('selectedItem');
      localStorage.removeItem('selectedItemType');
      localStorage.removeItem('navigateToSection');
    } catch (e) {}

    // Use navigation to force route change to login
    navigate('/login', { replace: true });
  }, [navigate]);

  // Render nothing; immediate redirect handled via Navigate as a fallback
  return <Navigate to="/login" replace />;
};

export default Logout;
