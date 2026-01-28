import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = ({ title, description, type = "default" }) => {
    setToast({ title, description, type });
  };

  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {toast && (
          <ToastPrimitive.Root
            duration={3500}
            className={`bg-white border shadow-xl rounded-xl p-4 mb-4 fixed bottom-4 right-4 max-w-xs ${
              toast.type === "error" ? "border-red-500" :
              toast.type === "success" ? "border-green-500" :
              "border-gray-300"
            }`}
            onOpenChange={hideToast}
          >
            <ToastPrimitive.Title className="font-bold text-sm">
              {toast.title}
            </ToastPrimitive.Title>

            {toast.description && (
              <ToastPrimitive.Description className="text-xs mt-1 opacity-75">
                {toast.description}
              </ToastPrimitive.Description>
            )}
          </ToastPrimitive.Root>
        )}

        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
