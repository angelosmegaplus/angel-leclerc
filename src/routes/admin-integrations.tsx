import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, CheckCircle2, KeyRound, Loader2, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  clearTmdbCredentials,
  getTmdbCredentialStatus,
  saveTmdbCredentials,
  testActiveTmdbCredential,
} from "@/lib/tmdb-credentials.functions";
import {
  clearOpenAiCredential,
  getOpenAiCredentialStatus,
  saveOpenAiCredential,
  testActiveOpenAiCredential,
} from "@/lib/openai-credentials.functions";

export const Route = createFileRoute("/admin-integrations")({
  head: () => ({
    meta: [
      { title: "Connexions API | Angel OS" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: AdminIntegrationsPage,
});

type TmdbStatus = Awaited<ReturnType<typeof getTmdbCredentialStatus>>;
type OpenAiStatus = Awaited<ReturnType<typeof getOpenAiCredentialStatus>>;

function AdminIntegrationsPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();

  const getTmdbStatus = useServerFn(getTmdbCredentialStatus);
  const saveTmdb = useServerFn(saveTmdbCredentials);
  const clearTmdb = useServerFn(clearTmdbCredentials);
  const testTmdb = useServerFn(testActiveTmdbCredential);

  const getOpenAiStatus = useServerFn(getOpenAiCredentialStatus);
  const saveOpenAi = useServerFn(saveOpenAiCredential);
  const clearOpenAi = useServerFn(clearOpenAiCredential);
  const testOpenAi = useServerFn(testActiveOpenAiCredential);

  const [tmdbApiKey, setTmdbApiKey] = useState("");
  const [tmdbReadToken, setTmdbReadToken] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [tmdbStatus, setTmdbStatus] = useState<TmdbStatus | null>(null);
  const [openAiStatus, setOpenAiStatus] = useState<OpenAiStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  const refresh = async () => {
    const [tmdb, openai] = await Promise.allSettled([getTmdbStatus(), getOpenAiStatus()]);
    setTmdbStatus(tmdb.status === "fulfilled" ? tmdb.value : null);
    setOpenAiStatus(openai.status === "fulfilled" ? openai.value : null);
  };

  useEffect(() => { if (session && isAdmin) void refresh(); }, [session, isAdmin]);

  const run = async (name: string, action: () => Promise<void>) => {
    setBusy(name); setError(null); setMessage(null);
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Opération impossible."); }
    finally { setBusy(null); }
  };

  if (loading || !session || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  const tmdbConfigured = Boolean(tmdbStatus?.activeSource);
  const openAiConfigured = Boolean(openAiStatus?.activeSource);

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-8 text-white sm:px-7">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.18em] text-red-300">Angel OS · Connexions</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Connexions API</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">TMDB et OpenAI peuvent être configurés ou dépannés directement depuis l’espace administrateur. Les secrets ne sont jamais réaffichés ni enregistrés dans GitHub.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[.08]">Angel OS</Link>
            <Link to="/admin-movix" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[.08]">Films & séries</Link>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${openAiConfigured ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}><Bot className="h-5 w-5" /></div>
              <div><h2 className="font-semibold">OpenAI · Angel OS IA</h2><p className="text-xs text-white/45">{openAiConfigured ? `Configuré · ${openAiStatus?.activeSource}` : "Aucun identifiant actif détecté"}</p></div>
            </div>
            {openAiConfigured ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : null}
          </div>
          <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
            <span>Serveur · OPENAI_API_KEY : {openAiStatus?.envApiKey ? "présente" : "absente"}</span>
            <span>Site · clé de secours : {openAiStatus?.cookieApiKey ? "présente" : "absente"}</span>
            <span className="sm:col-span-2">Vercel Connect · canary-xylophone : {openAiStatus?.activeSource === "vercel-connect" ? "actif" : "disponible si connecté"}</span>
          </div>

          <label className="mt-5 block text-xs font-medium text-white/65">Clé API OpenAI de secours</label>
          <input type="password" value={openAiApiKey} onChange={(e) => setOpenAiApiKey(e.target.value)} autoComplete="off" spellCheck={false} placeholder="sk-…" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-red-300/50" />
          <p className="mt-2 text-xs leading-5 text-white/35">Ordre de priorité : secret serveur → Vercel Connect → clé saisie ici. La clé saisie sur le site sert uniquement de secours.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(busy) || !openAiApiKey.trim()} onClick={() => void run("openai-save", async () => {
              const result = await saveOpenAi({ data: { apiKey: openAiApiKey } });
              setMessage(result.message); setOpenAiApiKey(""); await refresh();
            })} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy === "openai-save" ? "Vérification…" : "Tester et enregistrer OpenAI"}</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => void run("openai-test", async () => {
              const result = await testOpenAi();
              if (!result.ok) throw new Error(result.error || "Connexion OpenAI indisponible.");
              setMessage(`Connexion OpenAI opérationnelle · source : ${result.source}`); await refresh();
            })} className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/75 disabled:opacity-40">Tester OpenAI</button>
            <button type="button" disabled={Boolean(busy) || !openAiStatus?.cookieApiKey} onClick={() => void run("openai-clear", async () => {
              await clearOpenAi(); setMessage("Clé OpenAI de secours supprimée du site."); await refresh();
            })} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-200 disabled:opacity-40"><Trash2 className="h-4 w-4" />Supprimer le secours OpenAI</button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${tmdbConfigured ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}><Wifi className="h-5 w-5" /></div>
              <div><h2 className="font-semibold">TMDB · Films & séries</h2><p className="text-xs text-white/45">{tmdbConfigured ? `Configuré · ${tmdbStatus?.activeSource}` : "Aucun identifiant actif détecté"}</p></div>
            </div>
            {tmdbConfigured ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : null}
          </div>
          <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
            <span>Serveur · Read token : {tmdbStatus?.envReadToken ? "présent" : "absent"}</span>
            <span>Serveur · API key : {tmdbStatus?.envApiKey ? "présente" : "absente"}</span>
            <span>Site · Read token : {tmdbStatus?.cookieReadToken ? "présent" : "absent"}</span>
            <span>Site · API key : {tmdbStatus?.cookieApiKey ? "présente" : "absente"}</span>
          </div>

          <div className="mt-5 flex items-center gap-2"><KeyRound className="h-5 w-5 text-red-300" /><h3 className="font-semibold">Identifiants TMDB</h3></div>
          <label className="mt-4 block text-xs font-medium text-white/65">Jeton d’accès en lecture de l’API</label>
          <textarea value={tmdbReadToken} onChange={(e) => setTmdbReadToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="eyJhbGciOiJIUzI1NiJ9…" className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/35 px-3 py-3 font-mono text-xs text-white outline-none placeholder:text-white/20 focus:border-red-300/50" />
          <label className="mt-4 block text-xs font-medium text-white/65">Clé API v3</label>
          <input type="password" value={tmdbApiKey} onChange={(e) => setTmdbApiKey(e.target.value)} autoComplete="off" placeholder="••••••••••••••••••••••••••••••••" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-red-300/50" />

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(busy) || (!tmdbApiKey.trim() && !tmdbReadToken.trim())} onClick={() => void run("tmdb-save", async () => {
              const result = await saveTmdb({ data: { apiKey: tmdbApiKey, readToken: tmdbReadToken } });
              setMessage(result.message); setTmdbApiKey(""); setTmdbReadToken(""); await refresh();
            })} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy === "tmdb-save" ? "Vérification…" : "Tester et enregistrer TMDB"}</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => void run("tmdb-test", async () => {
              const result = await testTmdb();
              if (!result.ok) throw new Error(result.error || "Connexion TMDB indisponible.");
              setMessage(`Connexion TMDB opérationnelle · source : ${result.source}`); await refresh();
            })} className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/75 disabled:opacity-40">Tester TMDB</button>
            <button type="button" disabled={Boolean(busy) || (!tmdbStatus?.cookieApiKey && !tmdbStatus?.cookieReadToken)} onClick={() => void run("tmdb-clear", async () => {
              await clearTmdb(); setMessage("Identifiants TMDB de secours supprimés du site."); await refresh();
            })} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-200 disabled:opacity-40"><Trash2 className="h-4 w-4" />Supprimer le secours TMDB</button>
          </div>
        </section>

        {message ? <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">{message}</div> : null}
        {error ? <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-sm text-red-200">{error}</div> : null}

        <aside className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm leading-6 text-white/45">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white/55" />
          <p>Les identifiants de secours configurés ici sont stockés dans des cookies HttpOnly, Secure et SameSite Strict pour ce navigateur. Les secrets serveur et Vercel Connect restent prioritaires. Les valeurs ne sont jamais renvoyées à l’interface après enregistrement.</p>
        </aside>
      </div>
    </main>
  );
}
