import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  // Still loading session/profile
  if (loading) {
    return <div className="text-center p-10 text-white">Loading...</div>;
  }

  // Not logged in → Auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in BUT profile not fetched yet
  if (!profile) {
    return <div className="text-center p-10 text-white">Loading profile…</div>;
  }

  // User logged in but not approved (and not admin)
  if (profile.role !== "admin" && profile.is_approved !== true) {
    return <Navigate to="/pending" replace />;
  }

  // All good → show the protected page
  return children;
}
