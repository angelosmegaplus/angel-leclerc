import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin-movix")({
  head: () => ({
    meta: [
      { title: "Films et séries | Angel OS IA" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMovixRedirect,
});

function AdminMovixRedirect() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    void navigate({ to: "/films-series", replace: true });
  }, [isAdmin, loading, navigate, session]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#070708] text-white">
      <div className="flex items-center gap-3 text-sm text-white/55">
        <Loader2 className="h-5 w-5 animate-spin" />
        Ouverture du nouveau moteur Films & séries…
      </div>
    </main>
  );
}
