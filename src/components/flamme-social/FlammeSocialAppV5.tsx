import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bell, Bookmark, Clapperboard, Compass, Home, LogOut, Menu, MessageCircle, MessageSquareText, Moon, Search, Settings, Sun, Users } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, Card, FlameMark, VerifiedName, cx, socialDb, type Profile, type SocialView } from "./social-v2-shared";
import { FeedViewV4 } from "./FlammeSocialFeedV4";
import { FlammeHomeV5 } from "./FlammeHomeV5";
import { FlammeDiscoverV5 } from "./FlammeDiscoverV5";
import { FlammeSocialMessagesV2 } from "./FlammeSocialMessagesV2";
import { NotificationsViewV2, PeopleViewV2, SearchViewV2, SettingsViewV2 } from "./FlammeSocialCommunityV2";
import { ProfileViewV4 } from "./FlammeSocialProfileV4";
import { ForumViewV4 } from "./FlammeSocialForumV4";
import { VideoFeedV4 } from "./FlammeSocialVideoV4";
import { FlammeUnifiedSearchV4 } from "./FlammeUnifiedSearchV4";
import { FlammeOnboardingV4 } from "./FlammeOnboardingV4";

const MAIN_NAV: Array<[SocialView, string, typeof Home]> = [
  ["home", "Accueil", Home],
  ["videos", "Vidéos", Clapperboard],
  ["groups", "Forum", MessageSquareText],
  ["discover", "Découvrir", Compass],
];
const MENU_NAV: Array<[SocialView, string, typeof Home]> = [
  ["contacts", "Contacts", Users],
  ["saved", "Enregistrés", Bookmark],
  ["settings", "Paramètres", Settings],
];

type ConversationMember = { conversation_id: string; last_read_at?: string | null };
type ConversationMessage = { conversation_id: string; sender_id: string; created_at: string };

export function FlammeSocialAppV5() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadProfile = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next?.user?.id) { setProfile(null); setLoading(false); return; }
    const { data } = await socialDb.from("flamme_profiles").select("*").eq("id", next.user.id).maybeSingle();
    setProfile((data ?? null) as Profile | null);
    setLoading(false);
  }, []);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) void loadProfile(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { if (active) void loadProfile(next); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);
  if (loading) return <div className="fixed inset-0 z-[190] flex items-center justify-center bg-[#F0F2F5] text-sm text-slate-500 dark:bg-[#101216]"><FlameMark className="mr-3 h-11 w-11 animate-pulse" />Ouverture de Flamme…</div>;
  if (!session) return <AuthScreenV5 />;
  if (!profile) return <ProfileSetupV5 session={session} onCreated={setProfile} />;
  return <SocialShellV5 me={profile} onMeChanged={setProfile} />;
}

function AuthScreenV5() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      if (mode === "login") { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error; }
      else { const { data, error } = await supabase.auth.signUp({ email: email.trim(), password }); if (error) throw error; if (!data.session) setMessage("Compte créé. Vérifiez votre adresse e-mail avant de vous connecter."); }
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Connexion impossible."); }
    finally { setBusy(false); }
  };
  const anonymous = async () => {
    setBusy(true); setMessage(null);
    try { const { error } = await supabase.auth.signInAnonymously(); if (error) throw error; }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Le mode pseudonyme n’est pas activé pour le moment."); }
    finally { setBusy(false); }
  };
  return <main className="fixed inset-0 z-[190] overflow-y-auto bg-[#101216] text-white">
    <div className="relative mx-auto grid min-h-full max-w-6xl items-center gap-8 overflow-hidden px-4 py-10 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
      <div className="pointer-events-none absolute -left-40 top-[-15%] h-[420px] w-[420px] rounded-full bg-[#CE654B]/30 blur-[130px]" />
      <section className="relative"><div className="flex items-center gap-3"><FlameMark className="h-14 w-14" /><div><h1 className="text-4xl font-extrabold tracking-tight">Flamme</h1><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#F3A48F]">Recherche · Social · Bêta</span></div></div><h2 className="mt-8 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">Chercher, publier, regarder et discuter dans une seule interface.</h2><p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">Flamme est né comme réseau social scout. Il garde cet esprit de communauté, tout en étant aujourd’hui ouvert à tout le monde.</p><div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold text-white/70"><span className="rounded-full bg-white/8 px-3 py-2">🔒 Messages chiffrés</span><span className="rounded-full bg-white/8 px-3 py-2">🕶️ Pseudonyme possible</span><span className="rounded-full bg-white/8 px-3 py-2">🛡️ Signalements assistés par IA</span></div></section>
      <Card className="relative mx-auto w-full max-w-md border-white/10 bg-white p-5 text-[#172638] shadow-2xl sm:p-7"><div className="grid grid-cols-2 rounded-xl bg-[#F0F2F5] p-1"><button onClick={() => setMode("login")} className={cx("rounded-lg px-3 py-2.5 text-sm font-extrabold", mode === "login" && "bg-white shadow-sm")}>Connexion</button><button onClick={() => setMode("signup")} className={cx("rounded-lg px-3 py-2.5 text-sm font-extrabold", mode === "signup" && "bg-white shadow-sm")}>Créer un compte</button></div><form onSubmit={submit} className="mt-5 space-y-3"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Adresse e-mail" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base outline-none focus:border-[#CE654B]" /><input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base outline-none focus:border-[#CE654B]" />{message && <p className="break-words rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{message}</p>}<button disabled={busy} className="w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy ? "Chargement…" : mode === "login" ? "Se connecter" : "Rejoindre Flamme"}</button></form><div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200" />ou<span className="h-px flex-1 bg-slate-200" /></div><button onClick={() => void anonymous()} disabled={busy} className="w-full rounded-xl bg-[#172638] py-3 text-sm font-extrabold text-white disabled:opacity-50">Continuer sous pseudonyme</button></Card>
    </div>
  </main>;
}

function ProfileSetupV5({ session, onCreated }: { session: Session; onCreated: (profile: Profile) => void }) {
  const [display, setDisplay] = useState(""); const [handle, setHandle] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); const normalized = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""); if (normalized.length < 3) return setError("L’identifiant doit contenir au moins 3 caractères."); setBusy(true); setError(null); const { data, error: insertError } = await socialDb.from("flamme_profiles").insert({ id: session.user.id, display_name: display.trim(), handle: normalized }).select("*").single(); setBusy(false); if (insertError) return setError(insertError.message); onCreated(data as Profile); };
  return <main className="fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto bg-[#F0F2F5] p-4"><Card className="w-full max-w-md p-6"><div className="flex items-center gap-3"><FlameMark className="h-12 w-12" /><div className="min-w-0"><h1 className="text-xl font-extrabold">Votre identité Flamme</h1><p className="text-xs text-slate-500">Un pseudo suffit. Flamme est ouvert aux scouts comme à tous les autres utilisateurs.</p></div></div><form onSubmit={submit} className="mt-6 space-y-3"><input required maxLength={80} value={display} onChange={(event) => setDisplay(event.target.value)} placeholder="Nom affiché ou pseudonyme" className="w-full rounded-xl border p-3 text-base" /><input required minLength={3} maxLength={24} value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="identifiant_unique" className="w-full rounded-xl border p-3 text-base" />{error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "Création…" : "Créer mon profil"}</button></form></Card></main>;
}

function SocialShellV5({ me, onMeChanged }: { me: Profile; onMeChanged: (profile: Profile) => void }) {
  const [view, setView] = useState<SocialView>(() => {
    if (typeof window === "undefined") return "home";
    const stored = localStorage.getItem("flamme-social-view") as SocialView | null;
    if (!stored || stored === "feed") return "home";
    if (stored === "events") return "discover";
    return stored;
  });
  const [dark, setDark] = useState(() => { if (typeof window === "undefined") return false; const saved = localStorage.getItem("flamme-theme") || localStorage.getItem("flamme-social-theme"); if (saved) return saved === "dark"; return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false; });
  const [menu, setMenu] = useState(false);
  const [profileTarget, setProfileTarget] = useState<Profile>(me);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [onboarding, setOnboarding] = useState(() => typeof window !== "undefined" && localStorage.getItem("flamme-onboarding-v4") !== "done");

  useEffect(() => { localStorage.setItem("flamme-social-view", view); }, [view]);
  useEffect(() => { localStorage.setItem("flamme-theme", dark ? "dark" : "light"); localStorage.setItem("flamme-social-theme", dark ? "dark" : "light"); document.documentElement.classList.toggle("dark", dark); document.documentElement.style.colorScheme = dark ? "dark" : "light"; }, [dark]);
  useEffect(() => { const touch = () => socialDb.from("flamme_profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", me.id).then(() => undefined, () => undefined); void touch(); const timer = setInterval(touch, 120000); return () => clearInterval(timer); }, [me.id]);

  const loadUnreadNotifications = useCallback(async () => { const { count } = await socialDb.from("flamme_notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("read_at", null); setUnreadNotifications(count ?? 0); }, [me.id]);
  const loadUnreadMessages = useCallback(async () => {
    const { data: memberRows } = await socialDb.from("flamme_conversation_members").select("conversation_id,last_read_at").eq("user_id", me.id);
    const members = (memberRows ?? []) as ConversationMember[];
    if (!members.length) { setUnreadMessages(0); return; }
    const ids = members.map((member) => member.conversation_id);
    const { data: messageRows } = await socialDb.from("flamme_messages").select("conversation_id,sender_id,created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(1000);
    const latest = new Map<string, ConversationMessage>();
    for (const message of (messageRows ?? []) as ConversationMessage[]) if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
    const count = members.filter((member) => { const message = latest.get(member.conversation_id); if (!message || message.sender_id === me.id) return false; return !member.last_read_at || new Date(message.created_at) > new Date(member.last_read_at); }).length;
    setUnreadMessages(count);
  }, [me.id]);

  useEffect(() => { void loadUnreadNotifications(); const channel = socialDb.channel(`flamme-v5-notifications-${me.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "flamme_notifications", filter: `user_id=eq.${me.id}` }, () => void loadUnreadNotifications()).subscribe(); return () => { void socialDb.removeChannel(channel); }; }, [loadUnreadNotifications, me.id]);
  useEffect(() => { void loadUnreadMessages(); const channel = socialDb.channel(`flamme-v5-messages-${me.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "flamme_messages" }, () => void loadUnreadMessages()).subscribe(); return () => { void socialDb.removeChannel(channel); }; }, [loadUnreadMessages, me.id]);
  useEffect(() => { if (view !== "messages") void loadUnreadMessages(); }, [loadUnreadMessages, view]);

  const go = (next: SocialView) => { if (next === "feed") next = "home"; if (next === "events") next = "discover"; setView(next); setMenu(false); if (next === "profile") setProfileTarget(me); if (next === "messages") { setUnreadMessages(0); window.setTimeout(() => void loadUnreadMessages(), 1200); } };
  const openProfile = (profile: Profile) => { setProfileTarget(profile); setView("profile"); setMenu(false); };
  const signOut = async () => { await supabase.auth.signOut(); location.href = "/flamme/social"; };

  const render = () => {
    switch (view) {
      case "home": case "feed": return <FlammeHomeV5 me={me} onProfile={openProfile} />;
      case "videos": return <VideoFeedV4 me={me} onProfile={openProfile} />;
      case "groups": return <ForumViewV4 me={me} onProfile={openProfile} />;
      case "discover": case "events": return <FlammeDiscoverV5 me={me} onProfile={openProfile} />;
      case "messages": return <FlammeSocialMessagesV2 me={me} />;
      case "contacts": return <PeopleViewV2 me={me} mode="contacts" onProfile={openProfile} />;
      case "saved": return <FeedViewV4 me={me} savedOnly showComposer={false} onProfile={openProfile} />;
      case "notifications": return <NotificationsViewV2 me={me} />;
      case "settings": return <SettingsViewV2 me={me} onChanged={(profile) => { onMeChanged(profile); setProfileTarget(profile); }} />;
      case "search": return <SearchViewV2 me={me} onProfile={openProfile} onGroup={() => go("groups")} />;
      case "profile": return <ProfileViewV4 me={me} profile={profileTarget} onBack={profileTarget.id === me.id ? undefined : () => setView("home")} onMeChanged={(profile) => { onMeChanged(profile); setProfileTarget(profile); }} />;
      case "flamme": return <FlammeUnifiedSearchV4 dark={dark} />;
      default: return <FlammeHomeV5 me={me} onProfile={openProfile} />;
    }
  };

  const immersive = view === "videos" || view === "messages";
  return <div className={cx("fixed inset-0 z-[190] overflow-hidden font-sans", dark && "dark", dark ? "bg-[#101216] text-white" : "bg-[#F0F2F5] text-[#172638]")}>
    <header className={cx("absolute inset-x-0 top-0 z-50 h-[56px] border-b backdrop-blur-xl", dark ? "border-white/10 bg-[#181b20]/94" : "border-black/[.06] bg-white/94")}>
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 px-2.5 sm:px-4">
        <button onClick={() => go("home")} className="flex shrink-0 items-center gap-2"><FlameMark className="h-9 w-9" /><strong className="hidden text-lg tracking-tight sm:block">Flamme</strong></button>
        <button onClick={() => go("flamme")} className={cx("hidden min-w-0 max-w-xl flex-1 items-center gap-2 rounded-full px-3 py-2 text-left text-xs sm:flex", dark ? "bg-white/[.07] text-slate-400" : "bg-[#F0F2F5] text-slate-500")}><Search className="h-4 w-4" /><span className="truncate">Rechercher sur Flamme</span></button>
        <button onClick={() => go("flamme")} aria-label="Rechercher" className={cx("ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:hidden", dark ? "bg-white/[.07]" : "bg-[#E4E6EB]")}><Search className="h-5 w-5" /></button>
        <button onClick={() => go("messages")} aria-label="Messages" className={cx("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full", dark ? "bg-white/[.07]" : "bg-[#E4E6EB]")}><MessageCircle className="h-5 w-5" />{unreadMessages > 0 && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#E66A3F] dark:border-[#181b20]" />}</button>
        <button onClick={() => go("notifications")} aria-label="Alertes" className={cx("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full", dark ? "bg-white/[.07]" : "bg-[#E4E6EB]")}><Bell className="h-4 w-4" />{unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#CE654B] px-1 text-center text-[9px] font-extrabold leading-5 text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</button>
        <button onClick={() => setMenu((value) => !value)} aria-label="Menu" className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", dark ? "bg-white/[.07]" : "bg-[#E4E6EB]")}><Menu className="h-5 w-5" /></button>
      </div>
    </header>

    {menu && <div className={cx("absolute left-2 right-2 top-[62px] z-[80] max-h-[calc(100dvh-140px)] overflow-y-auto rounded-2xl border p-2 shadow-2xl sm:left-auto sm:right-3 sm:w-80", dark ? "border-white/10 bg-[#20242b]" : "border-black/5 bg-white")}><button onClick={() => go("profile")} className="flex w-full min-w-0 items-center gap-3 rounded-xl p-3 text-left hover:bg-black/5 dark:hover:bg-white/5"><Avatar profile={me} size="sm" /><div className="min-w-0 flex-1"><VerifiedName profile={me} className="max-w-full text-sm font-extrabold dark:text-white" /><span className="block truncate text-[10px] text-slate-500">@{me.handle}</span></div></button><div className="my-1 h-px bg-black/[.06] dark:bg-white/10" />{MENU_NAV.map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"><Icon className="h-4 w-4 shrink-0 text-[#CE654B]" />{label}</button>)}<button onClick={() => setDark((value) => !value)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{dark ? "Mode clair" : "Mode sombre"}</button><button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Se déconnecter</button></div>}

    <div className="absolute inset-x-0 bottom-0 top-[56px] overflow-y-auto"><div className={cx("mx-auto flex max-w-[1440px] pb-[72px] lg:pb-0", immersive ? "px-0" : "px-0 sm:px-3")}><aside className="sticky top-0 hidden h-[calc(100dvh-56px)] w-[218px] shrink-0 py-4 lg:block"><button onClick={() => go("profile")} className="mb-2 flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left hover:bg-black/5 dark:hover:bg-white/5"><Avatar profile={me} size="sm" /><VerifiedName profile={me} className="max-w-full text-sm font-bold dark:text-white" /></button><nav className="space-y-1">{MAIN_NAV.map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold", view === id ? "bg-white shadow-sm dark:bg-white/[.07]" : "hover:bg-black/5 dark:hover:bg-white/5")}><Icon className={cx("h-5 w-5", view === id && "text-[#CE654B]")} />{label}</button>)}<button onClick={() => go("flamme")} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold", view === "flamme" ? "bg-white shadow-sm dark:bg-white/[.07]" : "hover:bg-black/5 dark:hover:bg-white/5")}><FlameMark className="h-5 w-5" />Flamme</button></nav></aside><main className={cx("min-w-0 flex-1", view === "videos" ? "py-0" : view === "messages" ? "py-0 sm:py-3" : "mx-auto max-w-[760px] py-2 sm:py-4", view === "flamme" && "max-w-[920px]")}>{render()}</main></div></div>

    <nav aria-label="Navigation principale" className={cx("absolute inset-x-0 bottom-0 z-50 grid h-[70px] grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden", dark ? "border-white/10 bg-[#181b20]/96" : "border-black/[.08] bg-white/96")}>
      {MAIN_NAV.map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className={cx("flex min-w-0 flex-col items-center justify-center gap-0.5 text-[9px] font-bold", view === id ? "text-[#CE654B]" : "text-slate-500")}><span className={cx("flex h-8 min-w-10 items-center justify-center rounded-xl px-2", view === id && "bg-[#CE654B]/10")}><Icon className="h-5 w-5" /></span><span className="w-full truncate px-0.5 text-center">{label}</span></button>)}
      <button onClick={() => go("flamme")} className={cx("flex min-w-0 flex-col items-center justify-center gap-0.5 text-[9px] font-bold", view === "flamme" ? "text-[#CE654B]" : "text-slate-500")}><span className={cx("flex h-8 min-w-10 items-center justify-center rounded-xl px-2", view === "flamme" && "bg-[#CE654B]/10")}><FlameMark className="h-5 w-5" /></span><span>Flamme</span></button>
    </nav>
    {onboarding && <FlammeOnboardingV4 onDone={() => setOnboarding(false)} />}
  </div>;
}
