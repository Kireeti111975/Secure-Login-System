import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  LogOut, 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  KeyRound,
  Shield,
  Activity,
  ChevronRight,
  Fingerprint
} from "lucide-react";

interface DashboardPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    twoFactorEnabled: boolean;
  };
  onLogout: () => void;
  setToast: (toast: { message: string; type: "success" | "error" }) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  updateUserSessionState: (fields: Partial<any>) => void;
}

export default function DashboardPage({
  user,
  onLogout,
  setToast,
  apiFetch,
  updateUserSessionState,
}: DashboardPageProps) {
  const [setupStep, setSetupStep] = useState<"idle" | "generating" | "verify" | "saving">("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [code, setCode] = useState("");
  const [error2Fa, setError2Fa] = useState("");

  const handleStart2FASetup = async () => {
    setSetupStep("generating");
    setError2Fa("");
    try {
      const data = await apiFetch("/api/auth/setup-2fa", { method: "POST" });
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecretKey(data.secret);
        setSetupStep("verify");
      } else {
        setToast({ message: data.message || "Failed to start 2FA setup.", type: "error" });
        setSetupStep("idle");
      }
    } catch (error) {
      console.error("Failed to start 2FA setup:", error);
      setToast({ message: "Network connection error.", type: "error" });
      setSetupStep("idle");
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError2Fa("Please check code format (needs 6 hex characters).");
      return;
    }

    setSetupStep("saving");
    setError2Fa("");
    try {
      const data = await apiFetch("/api/auth/activate-2fa", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });

      if (data.success) {
        setToast({ message: data.message || "2FA Activated successfully!", type: "success" });
        updateUserSessionState({ twoFactorEnabled: true });
        setSetupStep("idle");
        setCode("");
        setQrCodeUrl("");
        setSecretKey("");
      } else {
        setError2Fa(data.message || "Invalid authenticator code. Enter code again.");
        setSetupStep("verify");
      }
    } catch (error) {
      console.error("Confirm 2FA failed:", error);
      setError2Fa("Network failure validating code.");
      setSetupStep("verify");
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable Two-Factor Authentication? This diminishes account security.")) {
      return;
    }

    try {
      const data = await apiFetch("/api/auth/disable-2fa", { method: "POST" });
      if (data.success) {
        setToast({ message: "Two-Factor Authentication has been successfully disabled.", type: "success" });
        updateUserSessionState({ twoFactorEnabled: false });
      } else {
        setToast({ message: data.message || "Failed to disable 2FA.", type: "error" });
      }
    } catch (error) {
      console.error("Disable 2FA failed:", error);
      setToast({ message: "Network error occurred.", type: "error" });
    }
  };

  const formattedCreationDate = (() => {
    try {
      const parsed = new Date(user.createdAt);
      return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unavailable";
    }
  })();

  return (
    <div id="dashboard-layout" className="min-h-screen relative bg-[#F8FAFC] font-sans pb-16 flex flex-col overflow-x-hidden">
      {/* Blurry circular element layout */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-100 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />

      {/* Main Professional Header consistent with Auth pages */}
      <header className="relative z-10 px-6 md:px-12 pt-8 md:pt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">SECURE_AUTH</span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">Active Live Node</span>
          </div>

          <button
            id="dashboard-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid Dashboard */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 mt-10 md:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-grow items-start">
        
        {/* Profile Card Left panel */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <div className="w-1 h-1 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-5 text-3xl font-black uppercase shadow-xl shadow-slate-200 tracking-tight">
                {user.name.slice(0, 2)}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {user.name}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1 max-w-full truncate px-4">
                {user.email}
              </p>

              <div className="w-full border-t border-slate-100 my-6" />

              <div className="w-full space-y-5 text-left">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">
                    Security Policy
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                    Authorized Agent
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">
                    Principal Email
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                    <Mail size={15} className="text-slate-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">
                    Creation timestamp
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                    <Calendar size={15} className="text-slate-400 shrink-0" />
                    <span className="font-mono text-xs text-slate-500 leading-tight">{formattedCreationDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick System Diagnostics Widget */}
          <div className="bg-white rounded-[24px] border border-slate-250/60 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Health status</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Excellent</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Database Synced</span>
                <span className="text-slate-800">100% Secure</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[100%]" />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Cookie Auth Model</span>
                <span className="text-slate-800">HTTP-Only / Strict</span>
              </div>
            </div>
          </div>
        </div>

        {/* Console Action Right panel */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Main Welcome Station banner */}
          <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)]">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Console Station // Welcome
            </h3>
            <p className="text-slate-500 font-medium text-base mt-2 leading-relaxed">
              Welcome back, {user.name}. Your active sessions are secure and salted via Node.js backend cryptography. Update your multi-factor verification matrix below.
            </p>
          </div>

          {/* Dynamic 2FA settings view */}
          <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)] space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-sm text-slate-500 font-medium max-w-lg leading-relaxed">
                  Lock down access checks by linking with credential generator apps like Google Authenticator or Microsoft Authenticator.
                </p>
              </div>

              {user.twoFactorEnabled ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-700 tracking-wider uppercase shrink-0">
                  <ShieldCheck size={14} />
                  <span>Secure mode Active</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-700 tracking-wider uppercase shrink-0">
                  <ShieldAlert size={14} />
                  <span>Standard Defense</span>
                </div>
              )}
            </div>

            {/* Condition content boxes */}
            {user.twoFactorEnabled ? (
              // 2FA Active view block
              <div id="2fa-active-settings" className="p-6 md:p-8 bg-emerald-50/20 border border-emerald-100/50 rounded-3xl max-w-2xl">
                <div className="flex gap-4">
                  <div className="text-emerald-500 shrink-0 mt-1">
                    <Fingerprint size={28} />
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-lg font-bold text-emerald-900 tracking-tight">
                      Full Dual-Factor Coverage Enabled
                    </h5>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      Every session creation authorization requires entering the fresh 6-digit cryptographic pin. This prevents unauthorized takeovers even if server identity passwords are lost.
                    </p>
                    <button
                      id="disable-2fa-btn"
                      onClick={handleDisable2FA}
                      className="text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-350 px-5 py-3 rounded-xl transition-all cursor-pointer shadow-sm mt-2"
                    >
                      Remove Protection Layer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 2FA Offline / Setup View
              <div id="2fa-inactive-settings">
                {setupStep === "idle" && (
                  <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-5">
                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
                      Set up Two-Factor Authentication securely in minutes: Generate key pairings, scan with your chosen secure mobile camera app, verify accuracy, and establish active coverage instantly.
                    </p>
                    <button
                      id="start-2fa-setup-btn"
                      onClick={handleStart2FASetup}
                      className="bg-slate-900 border border-transparent text-white font-bold text-xs px-5 py-3.5 rounded-xl cursor-pointer hover:bg-slate-850 transition-all shadow-md shadow-slate-200 flex items-center gap-2"
                    >
                      <span>Initiate TOTP Linkage</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {setupStep === "generating" && (
                  <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-3">
                    <Loader2 size={28} className="text-blue-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Provisioning Secure Keypair...</span>
                  </div>
                )}

                {setupStep === "verify" && (
                  <motion.div
                    id="2fa-setup-form-card"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 border border-slate-150 rounded-3xl bg-slate-50/50 space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Column Left: Visual QR layout */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
                        {qrCodeUrl ? (
                          <img
                            id="qrcode-img"
                            src={qrCodeUrl}
                            alt="Authenticator setup QR Code"
                            className="w-44 h-44 object-contain select-none pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-44 h-44 bg-slate-50 rounded-xl flex items-center justify-center">
                            <QrCode size={40} className="text-slate-300 animate-pulse" />
                          </div>
                        )}
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-3">
                          Aim Device Camera
                        </span>
                      </div>

                      {/* Column Right: Steps and Verification Pin Input */}
                      <div className="md:col-span-7 space-y-5">
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Instructions
                          </h5>
                          <ol className="text-xs text-slate-600 font-medium space-y-2 list-decimal pl-4 leading-relaxed">
                            <li>Scan the visual barcode, or use the plain setup code below.</li>
                            <li>Input the output pin from your app code panel below.</li>
                          </ol>
                        </div>

                        <div className="p-3 bg-white border border-slate-150/70 rounded-xl">
                          <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Backup Setup Key Block
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-705 block break-all">
                            {secretKey}
                          </span>
                        </div>

                        <form onSubmit={handleConfirm2FA} className="space-y-4 pt-1">
                          <div className="space-y-1">
                            <label htmlFor="totp-setup-code" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Confirmation Pin
                            </label>
                            <input
                              id="totp-setup-code"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              placeholder="000 000"
                              value={code}
                              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                              className="w-full text-center tracking-[0.3em] font-extrabold font-mono py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-800"
                              required
                            />
                          </div>

                          {error2Fa && (
                            <p className="text-xs text-rose-500 font-bold leading-tight">
                              {error2Fa}
                            </p>
                          )}

                          <div className="flex gap-3">
                            <button
                              id="cancel-2fa-setup-btn"
                              type="button"
                              onClick={() => {
                                setSetupStep("idle");
                                setCode("");
                              }}
                              className="w-1/3 text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <button
                              id="validate-2fa-setup-btn"
                              type="submit"
                              className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition shadow-md shadow-slate-200"
                            >
                              Verify link
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </motion.div>
                )}

                {setupStep === "saving" && (
                  <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 border border-slate-150 rounded-3xl space-y-3">
                    <Loader2 size={28} className="text-blue-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Activating Secure Policy...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
