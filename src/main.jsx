import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// Providers
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ToastProvider } from "./components/ui/toast.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

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
