import { createContext, useContext, useState, useCallback } from "react";
import { reportError } from "../../utils/reportError";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((data) => {
    const id = Date.now();
    setToast({ id, ...data });
    // Errors stay up longer so people can read (or screenshot) them.
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), data?.type === "error" ? 7000 : 3000);
    // Every error toast is also logged for admins (Admin → Problems).
    if (data?.type === "error") reportError(data.title || "Error", data.description || data.title);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {toast && <Toast toast={toast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function Toast({ toast }) {
  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={`fixed bottom-28 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-[90vw] text-white px-6 py-3
                 rounded-xl shadow-xl animate-fadeIn text-sm lg:text-base
                 ${toast.type === "error" ? "bg-red-700" : "bg-teal-800"}`}
    >
      <p className="font-semibold">{toast.title}</p>
      {toast.description && (
        <p className="text-xs lg:text-sm opacity-90">{toast.description}</p>
      )}
    </div>
  );
}
