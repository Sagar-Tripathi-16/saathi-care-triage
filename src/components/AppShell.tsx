import { Link, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/store/app";
import { LANG_LABELS, t, type Lang } from "@/i18n/dict";
import { useEffect, useState } from "react";
import { Stethoscope, Wifi, WifiOff, ShieldCheck, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 mix-blend-multiply dark:mix-blend-screen hidden lg:block motion-reduce:hidden z-0">
      <motion.div
        className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-[#EAF7F6] blur-[120px]"
        animate={{
          x: ["-10%", "5%", "-10%"],
          y: ["-10%", "5%", "-10%"],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-[10vw] w-[30vw] h-[30vw] rounded-full bg-[#DFF5F2] blur-[100px]"
        animate={{
          x: ["5%", "-5%", "5%"],
          y: ["5%", "-10%", "5%"],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[30vh] -left-[10vw] w-[25vw] h-[25vw] rounded-full bg-[#7DD3C7] opacity-20 blur-[100px]"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}


const STANDBY_STATES = [
  { label: "System Ready", sub: "Monitoring triage signals..." },
  { label: "Evaluating Inputs", sub: "Assessing escalation indicators..." },
  { label: "Continuity Check", sub: "Assessing continuity risks..." },
  { label: "Symptom Analysis", sub: "Analyzing symptom progression..." },
  { label: "Referral Engine", sub: "Generating referral confidence..." },
];

function StandbyRail() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % STANDBY_STATES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = STANDBY_STATES[idx];

  return (
    <div className="p-6">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8B8D] opacity-30"></span>
          <span className="relative inline-flex rounded-full size-2 bg-[#0F8B8D]/70"></span>
        </span>
        Intelligence Rail
      </h3>
      <div className="rounded-[22px] border border-slate-200/50 bg-slate-50/50 p-5 shadow-[0_4px_12px_rgba(15,23,42,0.02)] overflow-hidden">
        <div className="flex items-center gap-3">
          <Activity className="size-4 text-slate-300 shrink-0" />
          <div className="flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-xs font-bold text-[#1E293B] block">{current.label}</span>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">{current.sub}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const online = useApp((s) => s.online);
  const setOnline = useApp((s) => s.setOnline);
  const route = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const update = () => setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [setOnline]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative selection:bg-primary/20 text-foreground">
      <AmbientParticles />
      
      {/* ─── LAYER 1: LEFT PANEL (ENVIRONMENT) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[20%] xl:w-[18%] relative flex-col border-r border-border/40 bg-[#F6F8F7] overflow-hidden shrink-0 z-10">
        
        {/* Center light depth (subtle vertical brightness) */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Large primary mesh glow (bottom-left) */}
        <div className="absolute -bottom-[20%] -left-[50%] w-[800px] h-[800px] rounded-full mix-blend-multiply opacity-[0.03] pointer-events-none blur-[140px] bg-gradient-to-tr from-[#0F8B8D] to-[#7DD3C7]" />

        {/* Secondary subtle glow (top-left) */}
        <div className="absolute -top-[10%] -left-[20%] w-[300px] h-[300px] rounded-full mix-blend-multiply opacity-[0.02] pointer-events-none blur-[100px] bg-[#7DD3C7]" />

        {/* Very soft vertical gradient flow */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(15,139,141,0.02) 100%)" }} />
        
        <div className="relative z-10 p-8 flex flex-col h-full">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-4 text-primary w-fit">
            <span className="size-16 rounded-[20px] bg-gradient-to-br from-[#0F8B8D] to-[#0A6365] text-white shadow-[0_8px_16px_rgba(15,139,141,0.25)] grid place-items-center shrink-0">
              <Stethoscope className="size-7" />
            </span>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-3xl leading-none tracking-tight text-[#1E293B]">{t(lang, "app_name")}</span>
              <span className="text-[14px] font-semibold text-[#0F8B8D] mt-1.5 tracking-wide">{t(lang, "tagline")}</span>
            </div>
          </Link>

          <div className="mt-auto space-y-6">
             <div>
                <p className="text-[17px] font-semibold text-slate-400 leading-relaxed max-w-[200px]">
                  Continuous healthcare operations & field intelligence.
                </p>
             </div>
             {/* Global controls */}
             <div className="flex flex-col gap-2.5 pt-6 border-t border-slate-200/50">
                <span
                  className="text-[13px] font-semibold inline-flex items-center gap-2 px-4 h-[44px] rounded-2xl bg-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-slate-200/60 text-slate-600 w-full"
                  title={online ? t(lang, "online") : t(lang, "offline")}
                >
                  {online ? <Wifi className="size-3.5 text-[#065F46] shrink-0" /> : <WifiOff className="size-3.5 text-[#991B1B] shrink-0" />}
                  <span className="truncate">{online ? t(lang, "online") : t(lang, "offline")}</span>
                </span>
                <select
                  aria-label={t(lang, "language")}
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="text-[13px] font-semibold bg-white/80 border border-slate-200/60 shadow-[0_2px_8px_rgba(15,23,42,0.04)] rounded-2xl px-4 h-[44px] focus:ring-2 ring-[#0F8B8D]/15 outline-none transition-colors cursor-pointer text-slate-600 w-full"
                >
                  {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                    <option key={l} value={l}>{LANG_LABELS[l]}</option>
                  ))}
                </select>
             </div>
          </div>
        </div>
      </div>

      {/* ─── LAYER 2: CENTER PANEL (PRIMARY WORKSPACE) ─────────────────────── */}
      <div className="flex-1 relative h-full flex flex-col overflow-hidden bg-transparent z-10">
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <span className="size-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground grid place-items-center">
                <Stethoscope className="size-4" />
              </span>
              <span className="font-bold text-foreground tracking-tight">{t(lang, "app_name")}</span>
            </Link>
            <div className="flex items-center gap-2">
               <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="text-xs bg-muted/50 border border-transparent rounded-full px-2 py-1 outline-none"
                >
                  {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto relative z-10 w-full scroll-smooth">
           <div className="mx-auto max-w-[42rem] px-4 sm:px-6 py-6 md:py-10 flex flex-col min-h-full">
              
              {/* Floating Navigation Pill */}
              <nav className="mb-10 p-1.5 bg-white/90 backdrop-blur-xl rounded-full border border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex items-center gap-1 w-max mx-auto shrink-0 relative z-20">
                {[
                  { path: "/", label: "nav_new" },
                  { path: "/queue", label: "nav_queue" },
                  { path: "/dashboard", label: "nav_dashboard" },
                  { path: "/history", label: "nav_history" }
                ].map((item) => {
                  const isActive = route === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative px-5 py-2.5 rounded-full text-[13px] transition-all duration-200 ease-out z-10 ${
                        isActive ? "text-[#0F8B8D] font-bold" : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-[#E8F7F5] border-[1.5px] border-[#0F8B8D] rounded-full -z-10 shadow-sm"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      {t(lang, item.label as Parameters<typeof t>[1])}
                    </Link>
                  );
                })}
              </nav>

              {!online && (
                <div className="mb-6 bg-muted/60 border border-border/60 rounded-[1.25rem] text-foreground text-sm p-4 flex items-center gap-3 animate-fade-in backdrop-blur-md shadow-sm">
                  <div className="p-2 bg-background rounded-full shrink-0 shadow-sm border border-border/40">
                    <WifiOff className="size-4 opacity-70" />
                  </div>
                  <div className="font-medium leading-tight">
                    <span className="block font-bold text-foreground mb-0.5">Connection Interrupted</span>
                    <span className="text-muted-foreground/90 text-xs">Your progress is safe locally and features will continue once connectivity returns.</span>
                  </div>
                </div>
              )}

              {/* Central Glass Container for Route Content */}
              <div className="flex-1 bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-[22px] shadow-[0_8px_32px_rgba(15,23,42,0.06)] overflow-hidden relative flex flex-col">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={route}
                    initial={{ opacity: 0, y: 10, scale: 0.995, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -5, scale: 0.995, filter: "blur(2px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex flex-col relative z-10 p-4 sm:p-6 md:p-8"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>

              <footer className="mt-8 pb-4 text-center shrink-0">
                <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest select-none">
                  <ShieldCheck className="size-3.5 opacity-80" />
                  <span>{t(lang, "disclaimer")}</span>
                </div>
              </footer>
           </div>
        </main>
      </div>

      {/* ─── LAYER 3: RIGHT PANEL (INTELLIGENCE RAIL) ────────────────────── */}
      <div className="hidden xl:flex xl:w-[20%] border-l border-border/40 bg-card/30 backdrop-blur-xl flex-col overflow-hidden relative z-10">
         <div id="intelligence-rail-target" className="h-full w-full flex flex-col">
            {/* React Portal target for live intelligence */}
            <StandbyRail />
         </div>
      </div>

    </div>
  );
}
