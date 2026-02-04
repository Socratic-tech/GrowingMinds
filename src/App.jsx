import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthProvider";

// Pages
import ShellLayout from "./components/layout/ShellLayout";
import AuthPage from "./pages/Auth";
import Feed from "./pages/Feed";
import QA from "./pages/QA";
import Library from "./pages/Library";
import Admin from "./pages/Admin";
import Pending from "./pages/Pending";
import ResetPassword from "./pages/ResetPassword";

// Route Guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";

export default function App() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <Routes>
      {/* PUBLIC LOGIN PAGE */}
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />

      {/* PASSWORD RESET (magic link + email recovery) */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* UNAPPROVED EDUCATORS */}
      <Route path="/pending" element={<Pending />} />

      {/* PROTECTED APP SHELL */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ShellLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Feed />} />
        <Route path="feed" element={<Feed />} />
        <Route path="library" element={<Library />} />
        <Route path="qa" element={<QA />} />
        {isAdmin && <Route path="admin" element={<Admin />} />}
      </Route>

      {/* FALLBACK → HOME */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
