import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// Providers
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ToastProvider } from "./components/ui/toast.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { installGlobalErrorReporting } from "./utils/reportError";

installGlobalErrorReporting();

// A recovery link that falls back to the Site URL arrives as
// "#access_token=...&type=recovery" with no route, which the router would
// throw away. Point it at the reset page before the router starts.
{
  const h = window.location.hash;
  if (/^#access_token=/.test(h) && /(^|&)type=recovery(&|$)/.test(h.slice(1))) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#/reset-password#" + h.slice(1));
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter basename="/">
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
