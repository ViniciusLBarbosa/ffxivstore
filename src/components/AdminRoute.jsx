import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user } = useAuth();
  

  if (!user || !user.isAdmin) {

    return <Navigate to="/" />;
  }

  return children;
} 