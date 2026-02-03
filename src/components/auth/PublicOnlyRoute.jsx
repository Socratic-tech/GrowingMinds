import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-10">Loading…</div>;
  }

  // Logged-in users should NOT see login/signup
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
