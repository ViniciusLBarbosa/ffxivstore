import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Salva a URL atual antes de redirecionar
    sessionStorage.setItem('redirectUrl', location.pathname);
    return <Navigate to="/login" />;
  }

  return children;
} 