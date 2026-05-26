import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage.tsx";
import RegisterPage from "./components/RegisterPage.tsx";
import DashboardPage from "./components/DashboardPage.tsx";
import TwoFactorPage from "./components/TwoFactorPage.tsx";
import AuthLayout from "./components/AuthLayout.tsx";
import Toast, { ToastType } from "./components/Toast.tsx";
import { Loader2, ShieldAlert } from "lucide-react";

export default function App() {
  const [page, setPage] = useState<"login" | "register" | "dashboard" | "verify-2fa">("login");
  const [user, setUser] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Buffer context when 2FA matches credentials but needs OTP challenge
  const [totpContext, setTotpContext] = useState<{
    userId: string;
    email: string;
    rememberMe: boolean;
  } | null>(null);

  /**
   * Global HTTP request handler with automatic JSON mappings.
   */
  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
    };
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Handle session expirations cleanly at network layer
    if (response.status === 401 && page === "dashboard") {
      setUser(null);
      setPage("login");
      setToast({ message: "Your session expired. Please sign in again.", type: "error" });
    }

    return response.json();
  };

  /**
   * Synchronistic session checks on launch.
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await apiFetch("/api/auth/me", { method: "GET" });
        if (data.success && data.user) {
          setUser(data.user);
          setPage("dashboard");
        } else {
          setUser(null);
          setPage("login");
        }
      } catch (error) {
        console.error("Session bootstrap failed:", error);
        setUser(null);
        setPage("login");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      const data = await apiFetch("/api/auth/logout", { method: "POST" });
      if (data.success) {
        setToast({ message: "Logged out. Session terminated successfully.", type: "success" });
      }
    } catch (error) {
      console.error("Sign out transaction error:", error);
    } finally {
      setUser(null);
      setPage("login");
      setTotpContext(null);
    }
  };

  const showToast = (toastObj: { message: string; type: ToastType }) => {
    setToast(toastObj);
  };

  const handleUpdateUserSession = (fields: Partial<any>) => {
    if (user) {
      setUser({ ...user, ...fields });
    }
  };

  /**
   * Reset scroll viewport to top immediately on page change transitions
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [page]);

  // Render full-page security loading screen on initial check to avoid UI jump.
  if (isCheckingSession) {
    return (
      <div id="loader-overlay" className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-3.5 font-sans">
        <Loader2 size={36} className="text-blue-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest leading-none select-none">
          Securing Workspace
        </span>
      </div>
    );
  }

  return (
    <div id="global-container" className="min-h-screen w-full bg-[#F8FAFC]">
      {/* Toast popup */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Pages Router View switcher */}
      {(page === "login" || page === "register" || page === "verify-2fa") && (
        <AuthLayout
          activeTab={page === "verify-2fa" ? "verify-2fa" : page}
          onTabChange={(tab) => {
            setPage(tab);
            setTotpContext(null);
          }}
          title={
            page === "login"
              ? "Secure login made simple."
              : page === "register"
              ? "Create your secure shield."
              : "Dual-Factor protection layer."
          }
          subtitle={
            page === "login"
              ? "Enterprise-grade authentication with JWT session management, Bcrypt hashing, and optional TOTP 2FA."
              : page === "register"
              ? "Join the system and obtain high-performance cryptographic credentials protected by advanced server salting."
              : "Please input the secondary key pin from your authenticator application to verify your login session."
          }
        >
          {page === "login" && (
            <LoginPage
              onNavigateToRegister={() => setPage("register")}
              onLoginSuccess={(loggedInUser) => {
                setUser(loggedInUser);
                setPage("dashboard");
              }}
              onRequires2FA={(context) => {
                setTotpContext(context);
                setPage("verify-2fa");
              }}
              setToast={showToast}
              apiFetch={apiFetch}
            />
          )}

          {page === "register" && (
            <RegisterPage
              onNavigateToLogin={() => setPage("login")}
              setToast={showToast}
              apiFetch={apiFetch}
            />
          )}

          {page === "verify-2fa" && totpContext && (
            <TwoFactorPage
              userId={totpContext.userId}
              email={totpContext.email}
              rememberMe={totpContext.rememberMe}
              onSuccess={(loggedInUser) => {
                setUser(loggedInUser);
                setPage("dashboard");
                setTotpContext(null);
              }}
              onBackToLogin={() => {
                setTotpContext(null);
                setPage("login");
              }}
              setToast={showToast}
              apiFetch={apiFetch}
            />
          )}
        </AuthLayout>
      )}

      {page === "dashboard" && user && (
        <DashboardPage
          user={user}
          onLogout={handleLogout}
          setToast={showToast}
          apiFetch={apiFetch}
          updateUserSessionState={handleUpdateUserSession}
        />
      )}
    </div>
  );
}
