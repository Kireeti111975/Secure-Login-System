import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Stays visible for 5 seconds
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const config = {
    success: {
      bg: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-800",
      iconText: "text-emerald-500",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-rose-50 border-rose-100",
      text: "text-rose-800",
      iconText: "text-rose-500",
      icon: AlertCircle,
    },
    info: {
      bg: "bg-blue-50 border-blue-100",
      text: "text-blue-800",
      iconText: "text-blue-500",
      icon: Info,
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <div id="toast-container" className="fixed top-4 right-4 z-50 pointer-events-none max-w-sm w-full font-sans">
      <AnimatePresence>
        {message && (
          <motion.div
            id="toast-block"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg}`}
          >
            <div className={`mt-0.5 ${config.iconText}`}>
              <IconComponent size={18} />
            </div>
            
            <div className="flex-1">
              <p className={`text-sm font-medium leading-relaxed ${config.text}`}>
                {message}
              </p>
            </div>

            <button
              id="toast-close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
