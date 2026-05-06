import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthProvider";

// Layout
import ShellLayout from "./components/layout/ShellLayout";

// Pages
import AuthPage from "./pages/Auth";
import Feed from "./pages/Feed";
import QA from "./pages/QA";
import Library from "./pages/Library";
import PlantLibrary from "./pages/PlantLibrary";
import Maintenance from "./pages/Maintenance";
import Tracker from "./pages/Tracker";
import HarvestLog from "./pages/HarvestLog";
import LessonLab from "./pages/LessonLab";
import GardynDashboard from "./pages/GardynDashboard";
import Admin from "./pages/Admin";
import Pending from "./pages/Pending";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";

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

      {/* PASSWORD RESET */}
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
        <Route path="plants" element={<PlantLibrary />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="tracker" element={<Tracker />} />
        <Route path="harvest" element={<HarvestLog />} />
        <Route path="lessons" element={<LessonLab />} />
        <Route path="gardyn" element={<GardynDashboard />} />
        <Route path="qa" element={<QA />} />
        <Route path="profile/:userId" element={<Profile />} />

        {isAdmin && <Route path="admin" element={<Admin />} />}
      </Route>

      {/* FALLBACK → HOME */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
