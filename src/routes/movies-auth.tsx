import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Film, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { mode?: "login" | "signup" };

export const Route = createFileRoute("/movies-auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search["mode"] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Compte Angel Movies | Angel Leclerc" },
      { name: "description", content: "Créer ou ouvrir un profil Angel Movies pour synchroniser goûts, likes, dislikes, vus et recommandations." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MoviesAuthPage,
});

function MoviesAuthPage() {
  const navigate = useNavigate();
  const initial = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(initial.mode ?? "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/films-series`,
            data: { display_name: name.trim() || email.split("@")[0], movies_profile: true },
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Compte créé. Confirme ton e-mail puis reviens sur Angel Movies.");
          return;
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) throw loginError;
      }
      await navigate({ to: "/films-series", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connexion impossible.";
      setError(message.includes("Invalid login credentials") ? "E-mail ou mot de passe incorrect." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#070708] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.035] p-6 shadow-2xl sm:p-8">
        <Link to="/films-series" className="inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-400/10 text-red-300"><Film className="h-5 w-5" /></span>
          <span><span className="block text-xs font-semibold uppercase tracking-[.18em] text-violet-200/70">Angel Movies</span><span className="text-lg font-semibold">Ton profil cinéma</span></span>
        </Link>

        <div className="mt-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
          <button type="button" onClick={() => { setMode("login"); setError(null); setNotice(null); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${mode === "login" ? "bg-white text-black" : "text-white/45"}`}>Connexion</button>
          <button type="button" onClick={() => { setMode("signup"); setError(null); setNotice(null); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${mode === "signup" ? "bg-white text-black" : "text-white/45"}`}>Créer un compte</button>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-[-.05em]">{mode === "signup" ? "Créer mon compte" : "Me connecter"}</h1>
        <p className="mt-2 text-sm leading-6 text-white/45">Likes, dislikes, vus, style et recommandations sont rattachés à ton profil Angel Movies.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" ? <div className="space-y-2"><Label htmlFor="movies-name">Nom affiché</Label><Input id="movies-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Angel" className="border-white/10 bg-black/25 text-white" /></div> : null}
          <div className="space-y-2"><Label htmlFor="movies-email">E-mail</Label><Input id="movies-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="border-white/10 bg-black/25 text-white" /></div>
          <div className="space-y-2"><Label htmlFor="movies-password">Mot de passe</Label><Input id="movies-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="border-white/10 bg-black/25 text-white" /></div>
          {error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs text-red-100">{error}</p> : null}
          {notice ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-xs text-emerald-100">{notice}</p> : null}
          <Button type="submit" disabled={busy} className="min-h-12 w-full bg-white font-semibold text-black hover:bg-white/90">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{mode === "signup" ? "Créer mon compte Angel Movies" : "Ouvrir Angel Movies"}</Button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-5 text-white/25">Cet écran est dédié à Angel Movies et n’affiche aucun outil d’administration Angel OS.</p>
      </section>
    </main>
  );
}
