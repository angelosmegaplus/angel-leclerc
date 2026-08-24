import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Clapperboard,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareText,
  Moon,
  Newspaper,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, Card, FlameMark, cx, socialDb, type Profile, type SocialView } from "./social-v2-shared";
import { FeedViewV2, VideoFeedV2 } from "./FlammeSocialFeedV2";
import { FlammeSocialMessagesV2 } from "./FlammeSocialMessagesV2";
import { EventsViewV2, NotificationsViewV2, PeopleViewV2, SearchViewV2, SettingsViewV2 } from "./FlammeSocialCommunityV2";
import { ProfileViewV3 } from "./FlammeSocialProfileV3";
import { ForumViewV2 } from "./FlammeSocialForumV2";

const PRIMARY: [SocialView, string, typeof Home][] = [
  ["home", "Accueil", Home],
  ["feed", "Publications", Newspaper],
  ["videos", "Vidéos", Clapperboard],
  ["groups", "Discussions", MessageSquareText],
  ["messages", "Messages", MessageCircle],
];

const SECONDARY: [SocialView, string, typeof Home][] = [
  ["discover", "Découvrir", Compass],
  ["notifications", "Alertes", Bell],
  ["contacts", "Contacts", Users],
  ["saved", "Enregistrés", Bookmark],
  ["events", "Événements", CalendarDays],
  ["settings", "Paramètres", Settings],
];

export function FlammeSocialAppV2() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await socialDb.from("flamme_profiles").select("*").eq("id", next.user.id).maybeSingle();
    setProfile((data ?? null) as Profile | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void loadProfile(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) void loadProfile(next);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[190] flex items-center justify-center bg-[#F0F2F5] text-sm text-slate-500">
        <FlameMark className="mr-3 h-10 w-10 animate-pulse" /> Ouverture de Flamme…
      </div>
    );
  }
  if (!session) return <AuthScreen />;
  if (!profile) return <ProfileSetup session={session} onCreated={setProfile} />;
  return <SocialShell me={profile} onMeChanged={setProfile} />;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) setMessage("Compte créé. Vérifiez votre adresse e-mail avant de vous connecter.");
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) return setMessage("Indiquez d’abord votre adresse e-mail.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth` });
    setMessage(error ? error.message : "Lien de réinitialisation envoyé par e-mail.");
  };

  return (
    <main className="fixed inset-0 z-[190] overflow-y-auto bg-[#F0F2F5] p-4 text-[#172638]">
      <div className="mx-auto grid min-h-full max-w-6xl items-center gap-8 py-8 lg:grid-cols-[1.1fr_.9fr]">
        <section className="px-1 sm:px-6">
          <div className="flex items-center gap-3">
            <FlameMark className="h-12 w-12 sm:h-14 sm:w-14" />
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Flamme</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#CE654B] sm:text-xs">Social · bêta</span>
            </div>
          </div>
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-extrabold leading-[1.05] sm:mt-8 sm:text-6xl">Le meilleur des réseaux sociaux, réuni dans un seul espace.</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">Fil, stories, vidéos courtes, discussions façon forum, événements et messages chiffrés — dans une interface pensée d’abord pour le téléphone.</p>
          <a href="/flamme" className="mt-6 inline-block text-sm font-bold text-[#CE654B]">← Ouvrir le moteur Flamme</a>
        </section>
        <Card className="mx-auto w-full max-w-md p-5 sm:p-7">
          <div className="grid grid-cols-2 rounded-xl bg-[#F0F2F5] p-1">
            <button onClick={() => setMode("login")} className={cx("rounded-lg px-3 py-2.5 text-sm font-extrabold", mode === "login" && "bg-white shadow-sm")}>Connexion</button>
            <button onClick={() => setMode("signup")} className={cx("rounded-lg px-3 py-2.5 text-sm font-extrabold", mode === "signup" && "bg-white shadow-sm")}>Créer un compte</button>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-slate-600">Adresse e-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base font-normal outline-none focus:border-[#CE654B]" /></label>
            <label className="block text-xs font-bold text-slate-600">Mot de passe<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base font-normal outline-none focus:border-[#CE654B]" /></label>
            {message && <p className="break-words rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{message}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-50">{busy ? "Chargement…" : mode === "login" ? "Se connecter" : "Rejoindre Flamme"}</button>
            {mode === "login" && <button type="button" onClick={() => void forgot()} className="w-full text-center text-xs font-bold text-slate-500">Mot de passe oublié ?</button>}
          </form>
        </Card>
      </div>
    </main>
  );
}

function ProfileSetup({ session, onCreated }: { session: Session; onCreated: (profile: Profile) => void }) {
  const [display, setDisplay] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (normalized.length < 3) return setError("L’identifiant doit contenir au moins 3 caractères.");
    setBusy(true);
    setError(null);
    const { data, error: insertError } = await socialDb.from("flamme_profiles").insert({ id: session.user.id, display_name: display.trim(), handle: normalized }).select("*").single();
    setBusy(false);
    if (insertError) return setError(insertError.message);
    onCreated(data as Profile);
  };

  return (
    <main className="fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto bg-[#F0F2F5] p-4">
      <Card className="w-full max-w-lg p-5 sm:p-8">
        <div className="flex items-center gap-3"><FlameMark className="h-11 w-11" /><div className="min-w-0"><h1 className="break-words text-lg font-extrabold sm:text-xl">Créez votre profil Flamme</h1><p className="text-xs text-slate-500">L’@identifiant est unique.</p></div></div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-bold">Nom affiché<input required maxLength={80} value={display} onChange={(event) => setDisplay(event.target.value)} placeholder="Votre nom ou pseudo" className="mt-1.5 w-full rounded-xl border p-3 text-base font-normal" /></label>
          <label className="block text-xs font-bold">Identifiant<input required minLength={3} maxLength={24} value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="exemple_24" className="mt-1.5 w-full rounded-xl border p-3 text-base font-normal" /></label>
          {error && <p className="break-words rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy ? "Création…" : "Entrer dans Flamme"}</button>
        </form>
      </Card>
    </main>
  );
}

function RightRail({ me, onProfile, onEvents }: { me: Profile; onProfile: (profile: Profile) => void; onEvents: () => void }) {
  const [people, setPeople] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string; starts_at: string; place?: string | null }>>([]);

  useEffect(() => {
    void (async () => {
      const [peopleResult, eventResult] = await Promise.all([
        socialDb.from("flamme_profiles").select("*").neq("id", me.id).order("created_at", { ascending: false }).limit(5),
        socialDb.from("flamme_events").select("id,title,starts_at,place").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
      ]);
      setPeople((peopleResult.data ?? []) as Profile[]);
      setEvents((eventResult.data ?? []) as Array<{ id: string; title: string; starts_at: string; place?: string | null }>);
    })();
  }, [me.id]);

  return (
    <aside className="hidden w-[300px] shrink-0 space-y-3 xl:block">
      <Card className="p-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold dark:text-white">À découvrir</h2><Compass className="h-4 w-4 text-[#CE654B]" /></div>
        <div className="mt-3 space-y-3">{people.map((person) => <button key={person.id} onClick={() => onProfile(person)} className="flex w-full min-w-0 items-center gap-2 text-left"><Avatar profile={person} size="sm" /><span className="min-w-0"><strong className="block truncate text-xs dark:text-white">{person.display_name}</strong><span className="block truncate text-[10px] text-slate-500">@{person.handle}</span></span></button>)}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold dark:text-white">À venir</h2><button onClick={onEvents} className="text-[10px] font-bold text-[#CE654B]">Tout voir</button></div>
        <div className="mt-3 space-y-3">{events.map((event) => <button key={event.id} onClick={onEvents} className="block w-full min-w-0 text-left"><strong className="block truncate text-xs dark:text-white">{event.title}</strong><span className="block truncate text-[10px] text-slate-500">{new Date(event.starts_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}{event.place ? ` · ${event.place}` : ""}</span></button>)}</div>
      </Card>
    </aside>
  );
}

function SocialShell({ me, onMeChanged }: { me: Profile; onMeChanged: (profile: Profile) => void }) {
  const [view, setView] = useState<SocialView>(() => {
    if (typeof window === "undefined") return "home";
    const stored = localStorage.getItem("flamme-social-view") as SocialView | null;
    return [...PRIMARY, ...SECONDARY].some(([id]) => id === stored) || stored === "search" || stored === "profile" ? stored! : "home";
  });
  const [dark, setDark] = useState(() => typeof window !== "undefined" && localStorage.getItem("flamme-social-theme") === "dark");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileTarget, setProfileTarget] = useState<Profile>(me);
  const [unread, setUnread] = useState(0);
  const [feedTab, setFeedTab] = useState<"all" | "contacts">("all");

  useEffect(() => { localStorage.setItem("flamme-social-view", view); }, [view]);
  useEffect(() => { localStorage.setItem("flamme-social-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => {
    const touch = () => socialDb.from("flamme_profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", me.id).then(() => undefined, () => undefined);
    void touch();
    const timer = setInterval(touch, 120000);
    return () => clearInterval(timer);
  }, [me.id]);

  const loadUnread = useCallback(async () => {
    const { count } = await socialDb.from("flamme_notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("read_at", null);
    setUnread(count ?? 0);
  }, [me.id]);

  useEffect(() => {
    void loadUnread();
    const channel = socialDb.channel(`flamme-shell-notifications-${me.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "flamme_notifications", filter: `user_id=eq.${me.id}` }, () => void loadUnread()).subscribe();
    return () => { void socialDb.removeChannel(channel); };
  }, [loadUnread, me.id]);

  const go = (next: SocialView) => {
    setView(next);
    setMobileMenu(false);
    if (next === "profile") setProfileTarget(me);
  };
  const openProfile = (profile: Profile) => { setProfileTarget(profile); setView("profile"); };

  const render = () => {
    switch (view) {
      case "home":
        return <><div className="mb-2 flex gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-[#181b20]"><button onClick={() => setFeedTab("all")} className={cx("flex-1 rounded-lg px-3 py-2 text-xs font-extrabold", feedTab === "all" && "bg-[#CE654B]/10 text-[#CE654B]")}>Pour vous</button><button onClick={() => setFeedTab("contacts")} className={cx("flex-1 rounded-lg px-3 py-2 text-xs font-extrabold", feedTab === "contacts" && "bg-[#CE654B]/10 text-[#CE654B]")}>Contacts</button></div><FeedViewV2 me={me} contactsOnly={feedTab === "contacts"} onProfile={openProfile} /></>;
      case "feed": return <FeedViewV2 me={me} onProfile={openProfile} />;
      case "videos": return <VideoFeedV2 me={me} onProfile={openProfile} />;
      case "groups": return <ForumViewV2 me={me} onProfile={openProfile} onMessages={() => go("messages")} />;
      case "messages": return <FlammeSocialMessagesV2 me={me} />;
      case "discover": return <PeopleViewV2 me={me} mode="discover" onProfile={openProfile} />;
      case "contacts": return <PeopleViewV2 me={me} mode="contacts" onProfile={openProfile} />;
      case "notifications": return <NotificationsViewV2 me={me} />;
      case "saved": return <FeedViewV2 me={me} savedOnly showComposer={false} onProfile={openProfile} />;
      case "events": return <EventsViewV2 me={me} />;
      case "search": return <SearchViewV2 me={me} onProfile={openProfile} onGroup={() => go("groups")} />;
      case "profile": return <ProfileViewV3 me={me} profile={profileTarget} onBack={profileTarget.id === me.id ? undefined : () => setView("home")} onMeChanged={(profile) => { onMeChanged(profile); setProfileTarget(profile); }} />;
      case "settings": return <SettingsViewV2 me={me} onChanged={(profile) => { onMeChanged(profile); setProfileTarget(profile); }} />;
      default: return <FeedViewV2 me={me} onProfile={openProfile} />;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    location.href = "/flamme/social";
  };

  return (
    <div className={cx("fixed inset-0 z-[190] overflow-hidden bg-[#F0F2F5] font-sans text-[#172638] dark:bg-[#101216] dark:text-white", dark && "dark")}>
      <header className="absolute inset-x-0 top-0 z-50 h-[56px] border-b border-black/[.06] bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,.06)] backdrop-blur dark:border-white/10 dark:bg-[#181b20]/95 sm:h-[60px]">
        <div className="mx-auto flex h-full max-w-[1480px] min-w-0 items-center gap-1.5 px-2 sm:gap-2 sm:px-3">
          <a href="/flamme" title="Moteur Flamme" className="flex shrink-0 items-center gap-2"><FlameMark className="h-9 w-9 sm:h-10 sm:w-10" /><span className="hidden font-display text-xl font-extrabold md:block">Flamme</span></a>
          <button onClick={() => go("search")} aria-label="Rechercher sur le réseau social" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] text-slate-500 dark:bg-white/[.07] sm:hidden"><Search className="h-4 w-4" /></button>
          <button onClick={() => go("search")} className="hidden min-w-0 max-w-[250px] flex-1 items-center gap-2 rounded-full bg-[#F0F2F5] px-3 py-2 text-left text-xs text-slate-500 dark:bg-white/[.07] sm:flex"><Search className="h-4 w-4 shrink-0" /><span className="truncate">Rechercher sur Flamme Social</span></button>

          <nav className="mx-auto hidden h-full min-w-0 flex-1 items-center justify-center lg:flex">
            {PRIMARY.slice(0, 4).map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} title={label} className={cx("relative flex h-full min-w-16 max-w-24 flex-1 items-center justify-center border-b-[3px] border-transparent text-slate-500 transition hover:bg-black/[.025] dark:text-slate-400 dark:hover:bg-white/[.04]", view === id && "border-[#CE654B] text-[#CE654B]")}><Icon className="h-5 w-5" /></button>)}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button onClick={() => go("messages")} title="Messages" className={cx("relative flex h-10 w-10 items-center justify-center rounded-full bg-[#E4E6EB] dark:bg-white/[.07]", view === "messages" && "text-[#CE654B]")}><MessageCircle className="h-4 w-4" /></button>
            <button onClick={() => go("notifications")} title="Alertes" className={cx("relative flex h-10 w-10 items-center justify-center rounded-full bg-[#E4E6EB] dark:bg-white/[.07]", view === "notifications" && "text-[#CE654B]")}><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#CE654B] px-1 text-center text-[9px] font-extrabold leading-5 text-white">{unread > 99 ? "99+" : unread}</span>}</button>
            <button onClick={() => setDark((value) => !value)} className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#E4E6EB] sm:flex dark:bg-white/[.07]">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <button onClick={() => go("profile")} className="hidden rounded-full xs:block sm:block"><Avatar profile={me} size="sm" /></button>
            <button onClick={() => setMobileMenu((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4E6EB] lg:hidden dark:bg-white/[.07]"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <div className="absolute inset-x-2 top-[62px] z-[70] max-h-[calc(100dvh-140px)] overflow-y-auto rounded-xl border bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#181b20] sm:left-auto sm:right-3 sm:w-72">
          <button onClick={() => go("profile")} className="flex w-full min-w-0 items-center gap-3 rounded-xl p-3 hover:bg-[#F0F2F5] dark:hover:bg-white/5"><Avatar profile={me} size="sm" /><div className="min-w-0 text-left"><strong className="block truncate text-sm dark:text-white">{me.display_name}</strong><span className="text-xs text-slate-500">Voir mon profil</span></div></button>
          <a href="/flamme" className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold hover:bg-[#F0F2F5] dark:hover:bg-white/5"><img src="/flamme-social-logo.svg" alt="" className="h-5 w-5 object-contain" />Moteur Flamme</a>
          {SECONDARY.map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold hover:bg-[#F0F2F5] dark:hover:bg-white/5"><Icon className="h-4 w-4 shrink-0 text-[#CE654B]" /><span className="min-w-0 flex-1 truncate text-left">{label}</span>{id === "notifications" && unread > 0 && <span className="ml-auto rounded-full bg-[#CE654B] px-2 py-0.5 text-[9px] text-white">{unread}</span>}</button>)}
          <button onClick={() => setDark((value) => !value)} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold hover:bg-[#F0F2F5] dark:hover:bg-white/5">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{dark ? "Mode clair" : "Mode sombre"}</button>
          <button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Se déconnecter</button>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 top-[56px] overflow-y-auto sm:top-[60px]">
        <div className="mx-auto flex max-w-[1480px] gap-4 px-0 pb-[76px] sm:px-3 lg:pb-4">
          <aside className="sticky top-0 hidden h-[calc(100dvh-64px)] w-[240px] shrink-0 py-4 lg:block">
            <button onClick={() => go("profile")} className="mb-2 flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left hover:bg-black/[.035] dark:hover:bg-white/[.05]"><Avatar profile={me} size="sm" /><div className="min-w-0"><strong className="block truncate text-sm dark:text-white">{me.display_name}</strong><span className="block truncate text-[10px] text-slate-500">@{me.handle}</span></div></button>
            <nav className="space-y-1">
              <a href="/flamme" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold hover:bg-black/[.035] dark:hover:bg-white/[.05]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/[.07]"><img src="/flamme-social-logo.svg" alt="" className="h-5 w-5 object-contain" /></span>Moteur Flamme</a>
              {[...PRIMARY, ...SECONDARY].map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className={cx("flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-black/[.035] dark:hover:bg-white/[.05]", view === id && "bg-white shadow-sm dark:bg-white/[.07]")}><span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", view === id ? "bg-[#CE654B] text-white" : "bg-white text-[#CE654B] shadow-sm dark:bg-white/[.07]")}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 truncate">{label}</span>{id === "notifications" && unread > 0 && <span className="ml-auto rounded-full bg-[#CE654B] px-2 py-0.5 text-[9px] text-white">{unread}</span>}</button>)}
            </nav>
          </aside>

          <main className={cx("min-w-0 flex-1 py-2 sm:py-4", view === "messages" || view === "videos" ? "max-w-none" : "mx-auto max-w-[700px]")}>
            <div className="mb-1 px-3 text-[9px] font-semibold text-slate-400 sm:mb-2 sm:px-0 sm:text-[10px]">VERSION BÊTA · certaines fonctions peuvent évoluer</div>
            <div className="min-w-0 px-0">{render()}</div>
          </main>

          {view !== "messages" && view !== "videos" && view !== "groups" && <div className="sticky top-0 hidden h-[calc(100dvh-64px)] py-4 xl:block"><RightRail me={me} onProfile={openProfile} onEvents={() => go("events")} /></div>}
        </div>
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-50 grid h-[70px] grid-cols-6 border-t border-black/[.08] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,.05)] backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#181b20]/95">
        {PRIMARY.map(([id, label, Icon]) => (
          <button key={id} onClick={() => go(id)} className={cx("flex min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden px-0.5 text-[8px] font-bold text-slate-500", view === id && "text-[#CE654B]")}>
            <span className={cx("relative flex h-8 min-w-9 items-center justify-center rounded-xl px-2", view === id && "bg-[#CE654B]/10")}><Icon className="h-[19px] w-[19px]" /></span>
            <span className="block w-full truncate text-center">{label}</span>
          </button>
        ))}
        <a href="/flamme" title="Ouvrir le moteur Flamme" className="flex min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden px-0.5 text-[8px] font-bold text-slate-500">
          <span className="flex h-8 min-w-9 items-center justify-center rounded-xl px-2"><img src="/flamme-social-logo.svg" alt="" className="h-[20px] w-[20px] object-contain" /></span>
          <span className="block w-full truncate text-center">Flamme</span>
        </a>
      </nav>
    </div>
  );
}
