import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (user: any) => void;
  onRequires2FA: (data: { userId: string; email: string; rememberMe: boolean }) => void;
  setToast: (toast: { message: string; type: "success" | "error" }) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function LoginPage({
  onNavigateToRegister,
  onLoginSuccess,
  onRequires2FA,
  setToast,
  apiFetch,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setValidationError("Please fill in all security parameters.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      setValidationError("Please enter a valid cryptographic email form.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          password,
          rememberMe,
        }),
      });

      if (data.success) {
        if (data.requires2FA) {
          onRequires2FA({
            userId: data.userId,
            email: data.email,
            rememberMe,
          });
        } else {
          setToast({ message: data.message || "Session created successfully.", type: "success" });
          onLoginSuccess(data.user);
        }
      } else {
        setToast({ message: data.message || "Invalid credentials provided.", type: "error" });
        setValidationError(data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login endpoint failed:", error);
      setToast({ message: "Unable to establish secure backend links.", type: "error" });
      setValidationError("Backend system communication link failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-form-wrapper" className="font-sans">
      <div className="mb-8">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h3>
        <p className="text-slate-400 font-medium text-sm mt-1.5">
          Enter your credentials to access the security console.
        </p>
      </div>

      {validationError && (
        <div id="login-error-alert" className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Address */}
        <div className="space-y-2">
          <label htmlFor="login-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Corporate Email
          </label>
          <div className="relative">
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@security-shield.io"
              className="w-full px-5 py-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail size={18} />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="login-password" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Security Code
            </label>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={18} />
            </div>
            <button
              id="login-reveal-pwd"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me toggle from design template */}
        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="relative">
              <input
                id="login-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
                disabled={isLoading}
              />
              <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                rememberMe
                  ? "border-blue-600 bg-blue-600"
                  : "border-slate-200 bg-white group-hover:border-blue-500"
              }`}>
                {rememberMe && <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />}
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-600">Keep me signed in</span>
          </label>
        </div>

        {/* Primary submit action matching Geometric theme */}
        <button
          id="login-submit-btn"
          type="submit"
          className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Verifying Connection...</span>
            </>
          ) : (
            <>
              <span>Sign In to Secure Panel</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Switch tab panel link footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-400">New to SecureAuth?</span>
        <button
          id="login-goto-register"
          onClick={onNavigateToRegister}
          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
          disabled={isLoading}
        >
          Create an account
        </button>
      </div>
    </div>
  );
}
