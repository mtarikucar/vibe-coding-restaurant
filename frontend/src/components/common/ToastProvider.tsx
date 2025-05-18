import React, { createContext, useContext, useState, type ReactNode } from "react";
import Toast, { type ToastType } from "./Toast";
import { Toaster } from "react-hot-toast";

// We'll keep the react-hot-toast for backward compatibility
// but also add our own toast system for more advanced features

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

interface ToastContextType {
  showToast: (
    type: ToastType,
    message: string,
    duration?: number,
    position?:
      | "top-right"
      | "top-left"
      | "bottom-right"
      | "bottom-left"
      | "top-center"
      | "bottom-center"
  ) => void;
  hideToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children?: ReactNode;
  defaultPosition?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  defaultDuration?: number;
}

const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  defaultPosition = "top-right",
  defaultDuration = 3000,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (
    type: ToastType,
    message: string,
    duration: number = defaultDuration,
    position:
      | "top-right"
      | "top-left"
      | "bottom-right"
      | "bottom-left"
      | "top-center"
      | "bottom-center" = defaultPosition
  ) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, type, message, duration, position },
    ]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const success = (message: string, duration?: number) => {
    return showToast("success", message, duration);
  };

  const error = (message: string, duration?: number) => {
    return showToast("error", message, duration);
  };

  const warning = (message: string, duration?: number) => {
    return showToast("warning", message, duration);
  };

  const info = (message: string, duration?: number) => {
    return showToast("info", message, duration);
  };

  return (
    <ToastContext.Provider
      value={{ showToast, hideToast, success, error, warning, info }}
    >
      {children}
      {/* Keep the react-hot-toast for backward compatibility */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
          },
          success: {
            style: {
              background: "#ECFDF5",
              border: "1px solid #10B981",
              color: "#065F46",
            },
            iconTheme: {
              primary: "#10B981",
              secondary: "#ECFDF5",
            },
          },
          error: {
            style: {
              background: "#FEF2F2",
              border: "1px solid #EF4444",
              color: "#991B1B",
            },
            iconTheme: {
              primary: "#EF4444",
              secondary: "#FEF2F2",
            },
          },
        }}
      />
      {/* Our custom toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          position={toast.position}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
