import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0e8a8c" },
      { title: "Arogya Saathi — Offline Triage Support for ASHA Workers" },
      {
        name: "description",
        content:
          "Offline, explainable household triage and escalation support for ASHA workers. Deterministic rule engine, never a diagnosis.",
      },
      { property: "og:title", content: "Arogya Saathi — Offline Triage Support for ASHA Workers" },
      {
        property: "og:description",
        content: "Frontline triage support for rural healthcare workers. Works fully offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Arogya Saathi — Offline Triage Support for ASHA Workers" },
      { name: "description", content: "Arogya Saathi is an offline, explainable household triage and escalation system for ASHA workers." },
      { property: "og:description", content: "Arogya Saathi is an offline, explainable household triage and escalation system for ASHA workers." },
      { name: "twitter:description", content: "Arogya Saathi is an offline, explainable household triage and escalation system for ASHA workers." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/21e47dbf-b5ac-4ea0-8d2d-38e9f48b05ed/id-preview-34f8cc86--afa4b6a9-8206-4c15-a4a7-18af3408b231.lovable.app-1777653572904.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/21e47dbf-b5ac-4ea0-8d2d-38e9f48b05ed/id-preview-34f8cc86--afa4b6a9-8206-4c15-a4a7-18af3408b231.lovable.app-1777653572904.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
