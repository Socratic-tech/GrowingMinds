import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-10">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // FIX: Allow admins access even if not approved
  if (!profile || (!profile.is_approved && profile.role !== "admin")) {
    return <Navigate to="/pending" replace />;
  }

  return children;
}