import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  // Wait until auth and profile finish loading
  if (loading) return <div>Loading...</div>;

  // If no authenticated user, go to login
  if (!user) return <Navigate to="/auth" replace />;

  // If profile has not loaded yet, don’t redirect early
  if (!profile) return <div>Loading profile...</div>;

  // Only block non-admins who are not approved
  if (profile.role !== "admin" && profile.is_approved !== true) {
    return <Navigate to="/pending" replace />;
  }

  return children;
}