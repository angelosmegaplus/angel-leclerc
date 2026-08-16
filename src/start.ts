import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";
  const isStructuredRequest =
    url.pathname.startsWith("/_serverFn/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/~oauth/") ||
    accept.includes("application/json");

  try {
    return await next();
  } catch (error) {
    // Server functions and APIs must keep their native structured error path.
    // Turning them into an HTML error page makes the client lose the real cause
    // and produces the misleading "non exploitable" failures seen in Angel OS IA.
    if (isStructuredRequest) throw error;

    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
