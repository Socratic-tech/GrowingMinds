import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  // Still loading session/profile
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-900 flex items-center justify-center">
      <div className="text-white text-xl font-semibold">Loading...</div>
    </div>;
  }

  // Not logged in → Auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in BUT profile not fetched yet or failed to load
  if (!profile) {
    return <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-900 flex items-center justify-center">
      <div className="text-white text-xl font-semibold">Setting up your profile...</div>
    </div>;
  }

  // User logged in but not approved (and not admin)
  if (profile.role !== "admin" && profile.is_approved !== true) {
    return <Navigate to="/pending" replace />;
  }

  // All good → show the protected page
  return children;
}
