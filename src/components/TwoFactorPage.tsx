import React, { useState } from "react";
import { Lock, ArrowLeft, Loader2, Key } from "lucide-react";

interface TwoFactorPageProps {
  userId: string;
  email: string;
  rememberMe: boolean;
  onSuccess: (user: any) => void;
  onBackToLogin: () => void;
  setToast: (toast: { message: string; type: "success" | "error" }) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function TwoFactorPage({
  userId,
  email,
  rememberMe,
  onSuccess,
  onBackToLogin,
  setToast,
  apiFetch,
}: TwoFactorPageProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().replace(/\s/g, "");
    if (!cleanCode || cleanCode.length !== 6 || isNaN(Number(cleanCode))) {
      setToast({ message: "Please enter a valid 6-digit verification code.", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiFetch("/api/auth/verify-2fa", {
        method: "POST",
        body: JSON.stringify({
          userId,
          code: cleanCode,
          rememberMe,
        }),
      });

      if (data.success) {
        setToast({ message: "Identity authorized successfully! Welcome back.", type: "success" });
        onSuccess(data.user);
      } else {
        setToast({ message: data.message || "Invalid authenticator pin code.", type: "error" });
      }
    } catch (error) {
      console.error("2FA pin authentication error:", error);
      setToast({ message: "Session connection reset. Check parameters.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(val);
  };

  return (
    <div id="otp-form-wrapper" className="font-sans">
      <div className="mb-8">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">Security Check</h3>
        <p className="text-slate-400 font-medium text-sm mt-1.5 leading-relaxed">
          Open your authenticator generator app aligned with <span className="font-semibold text-slate-800 break-all">{email}</span> and input the live 6-digit pin code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="otp-code" className="block text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            6-Digit Verification Pin
          </label>
          <div className="relative">
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={handleInputChange}
              required
              placeholder="000 000"
              className="w-full tracking-[0.4em] text-center text-3xl font-extrabold font-mono py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800 placeholder:text-slate-300"
              disabled={isLoading}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          <p className="text-[10px] text-center font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Codes refresh automatically every 30s
          </p>
        </div>

        {/* Action Button */}
        <button
          id="otp-submit-btn"
          type="submit"
          className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Authorizing Credentials...</span>
            </>
          ) : (
            <>
              <Key size={18} />
              <span>Verify and Login</span>
            </>
          )}
        </button>
      </form>

      {/* Back button link */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
        <button
          id="otp-back-btn"
          type="button"
          onClick={onBackToLogin}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          disabled={isLoading}
        >
          <ArrowLeft size={14} />
          Change credentials identity
        </button>
      </div>
    </div>
  );
}
