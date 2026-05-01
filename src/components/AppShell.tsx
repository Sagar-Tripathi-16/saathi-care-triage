import { Link, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/store/app";
import { LANG_LABELS, t, type Lang } from "@/i18n/dict";
import { useEffect } from "react";
import { Stethoscope, Wifi, WifiOff, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary min-w-0">
            <span className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
              <Stethoscope className="size-5" />
            </span>
            <span className="font-semibold leading-tight text-foreground min-w-0">
              <span className="block truncate">{t(lang, "app_name")}</span>
              <span className="hidden sm:block text-xs text-muted-foreground font-normal truncate">
                {t(lang, "tagline")}
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground"
              title={online ? t(lang, "online") : t(lang, "offline")}
            >
              {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              <span className="hidden sm:inline">{online ? t(lang, "online") : t(lang, "offline")}</span>
            </span>
            <select
              aria-label={t(lang, "language")}
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="text-sm bg-card border border-border rounded-md px-2 py-1.5 min-h-[36px]"
            >
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <nav className="mx-auto max-w-3xl px-4 pb-2 flex gap-1 text-sm">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md min-h-[36px] inline-flex items-center ${
              route === "/" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
            }`}
          >
            {t(lang, "nav_new")}
          </Link>
          <Link
            to="/history"
            className={`px-3 py-1.5 rounded-md min-h-[36px] inline-flex items-center ${
              route === "/history" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
            }`}
          >
            {t(lang, "nav_history")}
          </Link>
        </nav>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-5">{children}</main>

      <footer className="border-t border-border bg-card mt-6">
        <div className="mx-auto max-w-3xl px-4 py-3 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-primary/70" />
          <span>{t(lang, "disclaimer")}</span>
        </div>
      </footer>
    </div>
  );
}
