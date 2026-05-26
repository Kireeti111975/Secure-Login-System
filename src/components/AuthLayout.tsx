import React from "react";
import { Shield, Server, ShieldCheck, Check } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: "login" | "register" | "verify-2fa";
  onTabChange: (tab: "login" | "register") => void;
  title: string;
  subtitle: string;
  stats?: Array<{ label: string; value: string }>;
}

export default function AuthLayout({
  children,
  activeTab,
  onTabChange,
  title,
  subtitle,
  stats = [
    { label: "Encryption", value: "AES-256" },
    { label: "Protocol", value: "JWT + SSL" },
  ],
}: AuthLayoutProps) {
  return (
    <div id="auth-layout-container" className="min-h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 flex flex-col relative overflow-x-hidden">
      {/* Blurry circular design components */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-100 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />

      {/* Main Global Header */}
      <header className="relative z-10 px-6 md:px-12 pt-8 md:pt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">SECURE_AUTH</span>
        </div>
        
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="flex gap-6 text-sm font-semibold text-slate-500">
            <button
              onClick={() => onTabChange("login")}
              className={`pb-1 cursor-pointer transition-all ${
                activeTab === "login"
                  ? "text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => onTabChange("register")}
              className={`pb-1 cursor-pointer transition-all ${
                activeTab === "register"
                  ? "text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Register
            </button>
          </nav>
          <button className="hidden sm:inline-block px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
            Support
          </button>
        </div>
      </header>

      {/* Hero and Form Main Grid Container */}
      <main className="relative z-10 flex-grow grid grid-cols-1 lg:grid-cols-12 px-6 md:px-12 gap-8 lg:gap-12 items-center py-8">
        {/* Left column info panel: Hidden on mobile screens for pristine balance aspect */}
        <div className="lg:col-span-5 flex flex-col space-y-6 md:space-y-8 text-left max-w-xl mx-auto lg:mx-0">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-700 tracking-wider uppercase">
              Verified Secure System
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-4 md:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {stat.label}
                </div>
                <div className="text-base md:text-xl font-bold text-slate-900">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column form target wrapper panel */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-[480px] bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)] border border-slate-200/60 p-6 md:p-12 relative overflow-hidden">
            {/* Design status indicator dots in upper corner */}
            <div className="absolute top-0 right-0 p-6 md:p-8">
              <div className="flex gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "verify-2fa" ? "bg-amber-400" : "bg-emerald-400"}`} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* Global Bottom Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-8 border-t border-slate-200/60 bg-white flex flex-col md:flex-row gap-4 justify-between items-center text-center">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">Server: US-East-1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">SSL: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">V 1.0.42</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">© 2026 Shield Technology</span>
          <span className="text-[10px] font-bold text-slate-900 tracking-widest uppercase cursor-pointer">Compliance</span>
          <span className="text-[10px] font-bold text-slate-900 tracking-widest uppercase cursor-pointer">Terms</span>
        </div>
      </footer>
    </div>
  );
}
