import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function EstablishmentRoute({ children }) {
  const token = localStorage.getItem('establishment_token');
  
  React.useEffect(() => {
    if (!token) {
      return <Navigate to="/login/establishment" replace />;
    }
  }, [token]);

  try {
    if (!token) throw new Error('No token');
    
    const decoded = jwtDecode(token);
    if (decoded.role !== 'etablissement') {
      throw new Error('Invalid role');
    }
    
    return children;
  } catch (err) {
    console.error('Route protection error:', err);
    return <Navigate to="/login/establishment" replace />;
  }
}