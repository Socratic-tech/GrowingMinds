import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((data) => {
    setToast({ id: Date.now(), ...data });
    setTimeout(() => setToast(null), 3000);
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
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-teal-800 text-white px-6 py-3 
                 rounded-xl shadow-xl animate-fadeIn text-sm lg:text-base"
    >
      <p className="font-semibold">{toast.title}</p>
      {toast.description && (
        <p className="text-xs lg:text-sm opacity-90">{toast.description}</p>
      )}
    </div>
  );
}
