import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import "./index.css";

// Pages
import AuthPage from "./pages/Auth.jsx";
import Pending from "./pages/Pending.jsx";
import Feed from "./pages/Feed.jsx";
import QA from "./pages/QA.jsx";
import Library from "./pages/Library.jsx";
import Admin from "./pages/Admin.jsx";
import ShellLayout from "./components/layout/ShellLayout.jsx";

// Providers
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ToastProvider } from "./components/ui/toast.jsx";

// Route Guards
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute.jsx";

// Lowercase Enforcer
function LowercaseRedirect() {
  const location = useLocation();
  const lower = location.pathname.toLowerCase();

  if (location.pathname !== lower) {
    return <Navigate to={lower + location.search + location.hash} replace />;
  }

  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/growingminds-beta">
      <ToastProvider>
        <AuthProvider>
          <LowercaseRedirect />

          <Routes>

            {/* PUBLIC (Login) */}
            <Route
              path="/auth"
              element={
                <PublicOnlyRoute>
                  <AuthPage />
                </PublicOnlyRoute>
              }
            />

            {/* PENDING ACCOUNT */}
            <Route path="/pending" element={<Pending />} />

            {/* PROTECTED (Logged-in) */}
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
              <Route path="admin" element={<Admin />} />
            </Route>

            {/* ANYTHING ELSE → HOME */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

