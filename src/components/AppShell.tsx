import { Link, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/store/app";
import { LANG_LABELS, t, type Lang } from "@/i18n/dict";
import { useEffect, useState } from "react";
import { Stethoscope, Wifi, WifiOff } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const route = useRouterState({ select: (s) => s.location.pathname });
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <span className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Stethoscope className="size-5" />
            </span>
            <span className="font-semibold leading-tight text-foreground">
              <span className="block">{t(lang, "app_name")}</span>
              <span className="block text-xs text-muted-foreground font-normal">{t(lang, "tagline")}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
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
              className="text-sm bg-card border border-border rounded-md px-2 py-1"
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
            className={`px-3 py-1.5 rounded-md ${route === "/" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
          >
            {t(lang, "nav_new")}
          </Link>
          <Link
            to="/history"
            className={`px-3 py-1.5 rounded-md ${route === "/history" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
          >
            {t(lang, "nav_history")}
          </Link>
        </nav>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-5">{children}</main>

      <footer className="border-t border-border bg-card mt-6">
        <div className="mx-auto max-w-3xl px-4 py-3 text-xs text-muted-foreground text-center">
          {t(lang, "disclaimer")}
        </div>
      </footer>
    </div>
  );
}
