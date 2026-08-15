import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Newspaper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NewsPanel } from "@/components/admin/NewsPanel";

export const Route = createFileRoute("/admin-actualites")({
  head: () => ({
    meta: [
      { title: "Actualités | Angel OS" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: AdminNewsPage,
});

function AdminNewsPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
    if (!loading && session && !isAdmin) void navigate({ to: "/admin" });
  }, [isAdmin, loading, navigate, session]);

  if (loading || !session || !isAdmin) {
    return <div className="grid min-h-[100dvh] place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#050607] px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(.75rem+env(safe-area-inset-top))] text-white sm:px-7 lg:px-10" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(225,55,55,.12),transparent_30%),linear-gradient(180deg,#0a0b0d_0%,#050607_70%)]" />
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="sticky top-0 z-20 -mx-3 mb-4 border-b border-white/10 bg-[#050607]/90 px-3 pb-3 pt-2 backdrop-blur-xl sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/65 transition hover:border-red-500/25 hover:text-white" aria-label="Retour à Angel OS"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><img src="/angel-os/logo.png" alt="" className="h-7 w-7 rounded-lg object-cover" /><p className="font-mono text-[9px] font-semibold uppercase tracking-[.18em] text-red-300 sm:text-[10px]">Angel OS</p></div>
              <div className="mt-1.5 flex min-w-0 items-center gap-2"><span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 sm:grid"><Newspaper className="h-4 w-4" /></span><h1 className="truncate text-[1.55rem] font-semibold tracking-[-.04em] sm:text-3xl">Actualités</h1></div>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-red-500/15 bg-red-500/[.045] px-4 py-3 text-sm leading-relaxed text-white/55">
          Veille personnalisée : politique et société, Sarlat/Périgord Noir, tourisme, radio et médias, journalisme/communication et opportunités professionnelles en priorité. IA/tech reste secondaire ; le scoutisme ne remonte que lorsqu’une actualité est réellement significative.
        </div>

        <NewsPanel showQueue={false} />
      </div>
    </main>
  );
}
