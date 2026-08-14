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
import { ApprenticeshipBanner } from "../components/ApprenticeshipBanner";
import { Toaster } from "../components/ui/sonner";
import { NotFound404 } from "../components/NotFound404";
import { PageViewTracker } from "../components/PageViewTracker";
import { CartDrawer } from "../components/CartDrawer";
import { PwaRegistrar } from "../components/PwaRegistrar";
import { ThemeSync } from "../components/ThemeController";
import { AngelOSCardStyle } from "../components/AngelOSCardStyle";
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Cette page n'a pas pu charger</h1>
        <p className="mt-2 text-sm text-muted-foreground">Une erreur s'est produite de notre côté. Vous pouvez réessayer ou revenir à l'accueil.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
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
      { title: "Angel Leclerc Communication | Gestion de projet, conseil et rédaction" },
      { name: "description", content: "Gestion de projets de communication, conseil stratégique, rédaction éditoriale et journalistique pour professionnels, associations et porteurs de projets." },
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
      { property: "og:title", content: "Angel Leclerc Communication | Gestion de projet, conseil et rédaction" },
      { name: "twitter:title", content: "Angel Leclerc Communication | Gestion de projet, conseil et rédaction" },
      { property: "og:description", content: "Gestion de projets de communication, conseil stratégique, rédaction éditoriale et journalistique pour professionnels, associations et porteurs de projets." },
      { name: "twitter:description", content: "Gestion de projets de communication, conseil stratégique, rédaction éditoriale et journalistique pour professionnels, associations et porteurs de projets." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d458ad7c-4ac2-4fac-82a0-d9564bf48140/id-preview-95572016--5bca9ec4-6763-4641-aa6d-439dc0e8bfc8.lovable.app-1784314332053.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d458ad7c-4ac2-4fac-82a0-d9564bf48140/id-preview-95572016--5bca9ec4-6763-4641-aa6d-439dc0e8bfc8.lovable.app-1784314332053.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    void bootAngelOS().catch((error) => {
      console.warn("Angel OS passive runtime unavailable", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <AngelOSCardStyle />
      <PageViewTracker />
      <PwaRegistrar />
      {isAngelOSPage || isAdminPage ? (
        <main className="min-h-screen">
          <Outlet />
        </main>
      ) : (
        <div className="flex min-h-screen flex-col">
          <ApprenticeshipBanner />
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      )}
      {!isAngelOSPage && !isAdminPage && <CartDrawer />}
      <Toaster position="top-center" />
      <Analytics />
    </QueryClientProvider>
  );
}
