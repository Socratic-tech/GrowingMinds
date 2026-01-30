import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  // Wait for Supabase to check session
  if (loading) {
    return <div className="text-center p-10">Loading…</div>;
  }

  // If no user → redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user exists but no profile yet, or not approved → redirect to pending
  if (!profile || !profile.is_approved) {
    return <Navigate to="/pending" replace />;
  }

  return children;
}
