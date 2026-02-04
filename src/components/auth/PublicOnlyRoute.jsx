import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking session
  if (loading) return null;

  // Logged in → dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
