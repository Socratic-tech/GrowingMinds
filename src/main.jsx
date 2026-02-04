import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";

// Pages
import AuthPage from "./pages/Auth.jsx";
import Pending from "./pages/Pending.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter basename="/">
      <ToastProvider>
        <AuthProvider>

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

            {/* PENDING APPROVAL */}
            <Route path="/pending" element={<Pending />} />

            {/* PASSWORD RESET */}
            <Route path="/reset-password" element={<ResetPassword />} />

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
              <Route path="admin" element={<Admin />} />
            </Route>

            {/* DEFAULT → HOME */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
