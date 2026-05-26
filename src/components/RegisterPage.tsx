import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  setToast: (toast: { message: string; type: "success" | "error" }) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function RegisterPage({
  onNavigateToLogin,
  setToast,
  apiFetch,
}: RegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [rules, setRules] = useState({
    minChar: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    setRules({
      minChar: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isPasswordStrong = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setErrorText("All parameters are strictly required.");
      return;
    }

    if (cleanName.length < 2) {
      setErrorText("Name is too short (minimum 2 characters required).");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      setErrorText("Please specify a genuine email address format.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorText("Password confirmation doesn't match.");
      return;
    }

    if (!isPasswordStrong) {
      setErrorText("Standard password length and validation checks must match.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          confirmPassword,
        }),
      });

      if (data.success) {
        setToast({ message: data.message || "Credential keys recorded successfully.", type: "success" });
        onNavigateToLogin();
      } else {
        setToast({ message: data.message || "Registration refused.", type: "error" });
        setErrorText(data.message || "An account with this email already exists.");
      }
    } catch (error) {
      console.error("Registration request failed:", error);
      setToast({ message: "Network synchronization error.", type: "error" });
      setErrorText("Communication mismatch or database timeout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="register-form-wrapper" className="font-sans">
      <div className="mb-6">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">Register Profile</h3>
        <p className="text-slate-400 font-medium text-sm mt-1.5">
          Formulate your security identifiers for access privilege.
        </p>
      </div>

      {errorText && (
        <div id="register-error-alert" className="mb-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          {errorText}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="reg-name" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Corporate Name
          </label>
          <div className="relative">
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Administrator John"
              className="w-full px-5 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <User size={18} />
            </div>
          </div>
        </div>

        {/* Corporate Email */}
        <div className="space-y-1">
          <label htmlFor="reg-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Email Address
          </label>
          <div className="relative">
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@security-shield.io"
              className="w-full px-5 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail size={18} />
            </div>
          </div>
        </div>

        {/* Security Code Password */}
        <div className="space-y-1">
          <label htmlFor="reg-pwd" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Define Security Code
          </label>
          <div className="relative">
            <input
              id="reg-pwd"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3.5 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={18} />
            </div>
            <button
              id="reg-reveal-pwd"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Validate Confirmation Password */}
        <div className="space-y-1">
          <label htmlFor="reg-confirm" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Confirm Code
          </label>
          <div className="relative">
            <input
              id="reg-confirm"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3.5 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={18} />
            </div>
            <button
              id="reg-reveal-confirm"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && confirmPassword && (
            <div id="pwd-match-text-badge" className="text-right py-0.5">
              {password === confirmPassword ? (
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Passwords Match ✓</span>
              ) : (
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Passwords Mismatch ✗</span>
              )}
            </div>
          )}
        </div>

        {/* Cryptographic password meter checklist */}
        <div id="pwd-complexity-panel" className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2.5">
          <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
            Required Password Guidelines
          </span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div className={`flex items-center gap-1.5 font-bold ${rules.minChar ? "text-emerald-700" : "text-slate-400"}`}>
              {rules.minChar ? <Check size={11} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />}
              <span>8+ Characters</span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold ${rules.hasUpper ? "text-emerald-700" : "text-slate-400"}`}>
              {rules.hasUpper ? <Check size={11} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />}
              <span>Uppercase</span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold ${rules.hasLower ? "text-emerald-700" : "text-slate-400"}`}>
              {rules.hasLower ? <Check size={11} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />}
              <span>Lowercase</span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold ${rules.hasNumber ? "text-emerald-700" : "text-slate-400"}`}>
              {rules.hasNumber ? <Check size={11} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />}
              <span>Number (0-9)</span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold col-span-2 ${rules.hasSpecial ? "text-emerald-700" : "text-slate-400"}`}>
              {rules.hasSpecial ? <Check size={11} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />}
              <span>Special code character</span>
            </div>
          </div>
        </div>

        <button
          id="register-submit-btn"
          type="submit"
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !isPasswordStrong || password !== confirmPassword}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying and creating...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-400 font-sans">Have a secure profile?</span>
        <button
          id="register-goto-login"
          onClick={onNavigateToLogin}
          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition"
          disabled={isLoading}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
