import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthProvider";

import ShellLayout from "./components/layout/ShellLayout";
import AuthPage from "./pages/Auth";
import Feed from "./pages/Feed";
import QA from "./pages/QA";
import Library from "./pages/Library";
import Admin from "./pages/Admin";
import Pending from "./pages/Pending";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  // Detect password recovery mode
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  if (location.pathname === "/reset-password" && type === "recovery") {
    return <ResetPassword />;
  }

  // Not logged in → show auth page
  if (!user) return <AuthPage />;

  // FIX: Allow admins to bypass approval requirement
  if (profile && profile.role !== "admin" && profile.is_approved !== true) {
    return <Pending />;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <Routes>

      {/* App shell */}
      <Route element={<ShellLayout />}>
        <Route path="/" element={<Navigate to="/feed" />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/qa" element={<QA />} />
        <Route path="/library" element={<Library />} />

        {/* Admin-only route */}
        {isAdmin && <Route path="/admin" element={<Admin />} />}
      </Route>

      <Route path="/reset-password" element={<ResetPassword />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/feed" />} />
    </Routes>
  );
}
  