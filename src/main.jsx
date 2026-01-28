import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ToastProvider } from "./components/ui/toast.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/growingminds-beta">
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);
