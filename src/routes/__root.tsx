import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { bootAngelOS } from "../lib/angel-os-runtime";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Toaster } from "../components/ui/sonner";
import { NotFound404 } from "../components/NotFound404";
import { PageViewTracker } from "../components/PageViewTracker";
import { CartDrawer } from "../components/CartDrawer";
import { PwaRegistrar } from "../components/PwaRegistrar";
import { ThemeSync } from "../components/ThemeController";
import { AngelOSCardStyle } from "../components/AngelOSCardStyle";
import { MaintenanceGate } from "../components/MaintenanceGate";
import { HumanCheckGate } from "../components/HumanCheckGate";

import { THEME_INIT_SCRIPT } from "../lib/theme";

function NotFoundComponent() {
  return <NotFound404 />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 text-5xl" aria-hidden="true">👀</div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Oups… Internet n’a pas suivi.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Cette page n’a pas pu être chargée. Une petite panne de connexion — ou un grain de sable de notre côté — s’est glissée dans la machine.
          Vous pouvez actualiser la page et réessayer.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Actualiser la page
          </button>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Réessayer sans recharger
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#181716" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Angel OS" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "Angel Leclerc Communication — Conseil & Rédaction" },
      { name: "description", content: "Gestion de projets de communication, conseil stratégique et rédaction éditoriale pour professionnels, associations et porteurs de projets." },
      { name: "author", content: "Angel Leclerc Communication" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "bingbot", content: "index, follow" },
      { name: "yandex", content: "index, follow" },
      { name: "language", content: "fr" },
      { httpEquiv: "content-language", content: "fr" },
      { property: "og:site_name", content: "Angel Leclerc Communication" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Angel Leclerc Communication — Conseil & Rédaction" },
      { name: "twitter:title", content: "Angel Leclerc Communication — Conseil & Rédaction" },
      { property: "og:description", content: "Gestion de projets de communication, conseil stratégique et rédaction éditoriale pour professionnels, associations et porteurs de projets." },
      { name: "twitter:description", content: "Gestion de projets de communication, conseil stratégique et rédaction éditoriale pour professionnels, associations et porteurs de projets." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d458ad7c-4ac2-4fac-82a0-d9564bf48140/id-preview-95572016--5bca9ec4-6763-4641-aa6d-439dc0e8bfc8.lovable.app-1784314332053.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d458ad7c-4ac2-4fac-82a0-d9564bf48140/id-preview-95572016--5bca9ec4-6763-4641-aa6d-439dc0e8bfc8.lovable.app-1784314332053.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "/admin-lovable.css" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAngelOSPage = pathname === "/angel-os-ia";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/admin-");
  const isStandaloneMoviesPage = pathname === "/films-series" || pathname === "/movies-auth";
  const showFloatingContact = pathname === "/" || pathname === "/entreprise";

  useEffect(() => {
    void bootAngelOS().catch((error) => {
      console.warn("Angel OS passive runtime unavailable", error);
    });
  }, []);

  useEffect(() => {
    if (isAngelOSPage || isAdminPage || isStandaloneMoviesPage) return;

    const replacements = new Map([
      ["Me contacter pour une alternance", "Me contacter"],
      ["Me contacter pour l’alternance", "Me contacter"],
      ["Me contacter pour l'alternance", "Me contacter"],
    ]);

    const cleanLegacyContactLabels = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const current = node.nodeValue ?? "";
        const normalized = current.replace(/\s+/g, " ").trim().toLowerCase();
        const isLegacyAlternance = normalized.includes("me contacter pour une alternance") || normalized.includes("me contacter pour l’alternance") || normalized.includes("me contacter pour l'alternance");

        if (pathname === "/contact" && isLegacyAlternance) {
          const element = node.parentElement;
          const option = element?.closest("button, a, [role='button']") as HTMLElement | null;
          if (option) {
            option.remove();
            node = walker.nextNode();
            continue;
          }
        }

        let next = current;
        for (const [before, after] of replacements) {
          if (next.includes(before)) next = next.replaceAll(before, after);
        }
        if (next !== current) node.nodeValue = next;
        node = walker.nextNode();
      }
    };

    cleanLegacyContactLabels(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) cleanLegacyContactLabels(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, isAngelOSPage, isAdminPage, isStandaloneMoviesPage]);

  return (
    <QueryClientProvider client={queryClient}>
      <HumanCheckGate>
      <MaintenanceGate bypass={isAdminPage || isStandaloneMoviesPage}>

        <ThemeSync />
        <AngelOSCardStyle />
        <PageViewTracker />
        <PwaRegistrar />
        {isAngelOSPage || isAdminPage || isStandaloneMoviesPage ? (
          <main className="min-h-screen [&_footer]:hidden">
            <Outlet />
          </main>
        ) : (
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        )}
        {showFloatingContact && (
          <a
            href="/contact"
            className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:hidden"
          >
            Me contacter
          </a>
        )}
        {!isAngelOSPage && !isAdminPage && !isStandaloneMoviesPage && <CartDrawer />}
        <Toaster position="top-center" />
        <Analytics />
      </MaintenanceGate>
      </HumanCheckGate>
    </QueryClientProvider>
  );

}
