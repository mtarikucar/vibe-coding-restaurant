import React, {
 createContext,
 useContext,
 useState,
 type ReactNode,
} from"react";
import Toast, { type ToastType } from"./Toast";
import { Toaster } from"react-hot-toast";

// We'll keep the react-hot-toast for backward compatibility
// but also add our own toast system for more advanced features

interface ToastItem {
 id: string;
 type: ToastType;
 message: string;
 duration?: number;
 position?:
  |"top-right"
  |"top-left"
  |"bottom-right"
  |"bottom-left"
  |"top-center"
  |"bottom-center";
}

interface ToastContextType {
 showToast: (
  type: ToastType,
  message: string,
  duration?: number,
  position?:
   |"top-right"
   |"top-left"
   |"bottom-right"
   |"bottom-left"
   |"top-center"
   |"bottom-center"
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
  |"top-right"
  |"top-left"
  |"bottom-right"
  |"bottom-left"
  |"top-center"
  |"bottom-center";
 defaultDuration?: number;
}

const ToastProvider: React.FC<ToastProviderProps> = ({
 children,
 defaultPosition ="top-right",
 defaultDuration = 3000,
}) => {
 const [toasts, setToasts] = useState<ToastItem[]>([]);

 const showToast = (
  type: ToastType,
  message: string,
  duration: number = defaultDuration,
  position:
   |"top-right"
   |"top-left"
   |"bottom-right"
   |"bottom-left"
   |"top-center"
   |"bottom-center" = defaultPosition
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
      background:"#F1F0E8",
      color:"#89A8B2",
      border:"1px solid #B3C8CF",
     },
     success: {
      style: {
       background:"#F0F7F4",
       border:"1px solid #69AF91",
       color:"#2D5B41",
      },
      iconTheme: {
       primary:"#69AF91",
       secondary:"#F0F7F4",
      },
     },
     error: {
      style: {
       background:"#FDF2F2",
       border:"1px solid #EB7D7D",
       color:"#8F4949",
      },
      iconTheme: {
       primary:"#EB7D7D",
       secondary:"#FDF2F2",
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
