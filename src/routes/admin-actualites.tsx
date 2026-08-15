import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Newspaper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NewsPanel } from "@/components/admin/NewsPanel";

export const Route = createFileRoute("/admin-actualites")({
  head: () => ({
    meta: [
      { title: "Actualités | Angel OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminNewsPage,
});

function AdminNewsPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
    if (!loading && session && !isAdmin) navigate({ to: "/admin" });
  }, [isAdmin, loading, navigate, session]);

  if (loading || !session || !isAdmin) {
    return <div className="grid min-h-[100dvh] place-items-center bg-black text-white"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-black px-3 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-white sm:px-7 lg:px-10" style={{ fontFamily: '"Segoe UI", "Segoe WP", system-ui, sans-serif' }}>
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="sticky top-0 z-20 -mx-3 mb-4 border-b border-white/10 bg-black/95 px-3 pb-4 pt-2 backdrop-blur sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" className="grid h-11 w-11 shrink-0 place-items-center border border-white/20 text-white transition-colors hover:border-white/40" aria-label="Retour à Angel OS"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Angel OS</p>
              <div className="mt-1 flex min-w-0 items-center gap-2"><Newspaper className="h-6 w-6 shrink-0 text-white/65" /><h1 className="truncate text-2xl font-light tracking-[-0.025em] sm:text-4xl">actualités</h1></div>
            </div>
          </div>
          <div className="mt-3 h-1 w-14 bg-[#0078d7]" />
        </header>

        <div className="border-l-4 border-[#0078d7] bg-[#111] p-4 text-sm font-light leading-relaxed text-white/65">
          Veille personnalisée : politique et société, Sarlat/Périgord Noir, tourisme, radio et médias, journalisme/communication et opportunités professionnelles en priorité. IA/tech reste secondaire ; le scoutisme est conservé pour les actualités vraiment significatives.
        </div>

        <NewsPanel />
      </div>
    </main>
  );
}
