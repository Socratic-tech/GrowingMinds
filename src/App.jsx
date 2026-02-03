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

  // DEBUG PANEL (always visible)
  const debugPanel = (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        left: 10,
        padding: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        zIndex: 99999,
        borderRadius: 6,
        fontSize: "12px",
      }}
    >
      <div>APP VERSION: <b>A2</b></div>
      <div>User: {user ? "YES" : "NO"}</div>
      <div>Role: {profile?.role || "null"}</div>
      <div>Approved: {String(profile?.is_approved)}</div>
      <div>Loading: {String(loading)}</div>
      <div>Location: {location.pathname}</div>
    </div>
  );

  // Still initializing Supabase session
  if (loading) return <div>Loading...{debugPanel}</div>;

  // Handle password reset mode
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  if (location.pathname === "/reset-password" && type === "recovery") {
    return (
      <>
        {debugPanel}
        <ResetPassword />
      </>
    );
  }

  // Not logged in → show auth page
  if (!user) {
    return (
      <>
        {debugPanel}
        <AuthPage />
      </>
    );
  }

  // 🟩 FIX: Do NOT redirect until profile FINISHES loading
  if (!profile) {
    return (
      <>
        {debugPanel}
        <div className="text-center p-10 text-white">Loading profile…</div>
      </>
    );
  }

  // 🟦 FIX: Only send *real* unapproved non-admin users to Pending
  if (profile.role !== "admin" && profile.is_approved !== true) {
    return (
      <>
        {debugPanel}
        <Pending />
      </>
    );
  }

  const isAdmin = profile.role === "admin";

  // App routes
  return (
    <>
      {debugPanel}
      <Routes>
        {/* App Shell */}
        <Route element={<ShellLayout />}>
          <Route path="/" element={<Navigate to="/feed" />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/qa" element={<QA />} />
          <Route path="/library" element={<Library />} />
          {isAdmin && <Route path="/admin" element={<Admin />} />}
        </Route>

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
