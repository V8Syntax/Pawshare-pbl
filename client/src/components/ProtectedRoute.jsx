import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, provider = false }) {
  const { user, loading, isProvider } = useAuth();
  const location = useLocation();
  if (loading) return <p className="empty">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (provider && !isProvider) return <p className="empty">Only shelters and caregivers can list animals.</p>;
  return children;
}
