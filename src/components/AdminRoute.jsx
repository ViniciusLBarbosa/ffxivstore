import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user } = useAuth();
  
  console.log('AdminRoute - User:', user);
  console.log('AdminRoute - Is Admin:', user?.isAdmin);
  console.log('AdminRoute - Role:', user?.role);

  if (!user || !user.isAdmin) {
    console.log('AdminRoute - Redirecting to home, no access');
    return <Navigate to="/" />;
  }

  console.log('AdminRoute - Access granted');
  return children;
} 