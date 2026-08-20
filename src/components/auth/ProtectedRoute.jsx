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

  // User logged in but not approved (and not admin).
  // Fail closed: if the profile hasn't loaded yet for some reason, treat the
  // user as unapproved rather than letting them through. AuthProvider always
  // finishes `loading` with a profile object (real or a safe unapproved
  // fallback), so `profile` should never be null here - but if it somehow is,
  // routing to /pending is the safe outcome, not routing past the gate.
  if (!profile || (profile.role !== "admin" && profile.is_approved !== true)) {
    return <Navigate to="/pending" replace />;
  }

  // All good → show the protected page
  return children;
}
