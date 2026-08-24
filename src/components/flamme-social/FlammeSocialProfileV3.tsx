import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Camera, ExternalLink, Image as ImageIcon, MapPin, Trash2, UserRound, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Avatar,
  Card,
  Empty,
  Modal,
  SecureMedia,
  cx,
  publicAvatarUrl,
  safeExt,
  socialDb,
  socialErrorMessage,
  type Media,
  type Post,
  type Profile,
} from "./social-v2-shared";

type ProfileTab = "posts" | "about" | "contacts" | "photos";

type ContactProfile = Profile & { relation: "Abonné" | "Abonnement" | "Contact" };

function validateProfileImage(file: File, label: string) {
  if (!/^(image\/(jpeg|png|webp))$/.test(file.type)) throw new Error(`${label} : format JPG, PNG ou WebP uniquement.`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`${label} : 5 Mo maximum.`);
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function ProfileTimeline({ profile }: { profile: Profile }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const { data: postRows } = await socialDb
        .from("flamme_posts")
        .select("*")
        .eq("author_id", profile.id)
        .is("group_id", null)
        .order("created_at", { ascending: false })
        .limit(60);
      const list = (postRows ?? []) as Post[];
      const ids = list.map((post) => post.id);
      const { data: mediaRows } = ids.length
        ? await socialDb.from("flamme_post_media").select("*").in("post_id", ids).order("position")
        : { data: [] };
      if (!active) return;
      setPosts(list);
      setMedia((mediaRows ?? []) as Media[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile.id]);

  if (loading) return <Card className="p-8 text-center text-sm text-slate-500">Chargement des publications…</Card>;
  if (!posts.length) return <Empty title="Aucune publication" text="Les publications de ce profil apparaîtront ici." />;

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const items = media.filter((item) => item.post_id === post.id);
        return (
          <Card key={post.id} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 pt-4">
              <Avatar profile={profile} />
              <div className="min-w-0">
                <strong className="block truncate text-sm text-slate-900 dark:text-white">{profile.display_name}</strong>
                <span className="text-[11px] text-slate-500">
                  {new Date(post.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {post.visibility === "public" ? " · 🌍" : post.visibility === "contacts" ? " · 👥" : " · 🔒"}
                </span>
              </div>
            </div>
            {post.content && <p className="whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">{post.content}</p>}
            {items.length > 0 && (
              <div className={cx("grid gap-[2px] overflow-hidden bg-black/5", items.length > 1 && "grid-cols-2")}>
                {items.slice(0, 6).map((item) => (
                  <div key={item.id} className={items.length === 1 ? "max-h-[70vh]" : "aspect-square"}>
                    <SecureMedia bucket={item.bucket ?? "flamme-media"} path={item.path} type={item.media_type} className="h-full max-h-[70vh] w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ProfileContacts({ profile }: { profile: Profile }) {
  const [people, setPeople] = useState<ContactProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [{ data: followers }, { data: following }] = await Promise.all([
        socialDb.from("flamme_follows").select("follower_id").eq("following_id", profile.id).eq("status", "accepted"),
        socialDb.from("flamme_follows").select("following_id").eq("follower_id", profile.id).eq("status", "accepted"),
      ]);
      const followerIds = new Set((followers ?? []).map((row: { follower_id: string }) => row.follower_id));
      const followingIds = new Set((following ?? []).map((row: { following_id: string }) => row.following_id));
      const ids = [...new Set([...followerIds, ...followingIds])];
      const { data } = ids.length ? await socialDb.from("flamme_profiles").select("*").in("id", ids).limit(120) : { data: [] };
      if (!active) return;
      setPeople(
        ((data ?? []) as Profile[]).map((person) => ({
          ...person,
          relation: followerIds.has(person.id) && followingIds.has(person.id) ? "Contact" : followerIds.has(person.id) ? "Abonné" : "Abonnement",
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile.id]);

  if (loading) return <Card className="p-8 text-center text-sm text-slate-500">Chargement des contacts…</Card>;
  if (!people.length) return <Empty icon={Users} title="Aucun contact affiché" text="Les abonnés et abonnements apparaîtront ici." />;
  return (
    <Card className="grid gap-2 p-3 sm:grid-cols-2">
      {people.map((person) => (
        <div key={person.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#F0F2F5] dark:hover:bg-white/5">
          <Avatar profile={person} />
          <div className="min-w-0">
            <strong className="block truncate text-sm dark:text-white">{person.display_name}</strong>
            <span className="text-[11px] text-slate-500">{person.relation}</span>
          </div>
        </div>
      ))}
    </Card>
  );
}

function ProfilePhotos({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: posts } = await socialDb.from("flamme_posts").select("id").eq("author_id", profile.id).is("group_id", null).limit(100);
      const ids = (posts ?? []).map((row: { id: string }) => row.id);
      const { data } = ids.length
        ? await socialDb.from("flamme_post_media").select("*").in("post_id", ids).eq("media_type", "image").order("created_at", { ascending: false }).limit(100)
        : { data: [] };
      if (!active) return;
      setItems((data ?? []) as Media[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile.id]);
  if (loading) return <Card className="p-8 text-center text-sm text-slate-500">Chargement des photos…</Card>;
  if (!items.length) return <Empty icon={ImageIcon} title="Aucune photo" text="Les photos publiées apparaîtront ici." />;
  return (
    <Card className="grid grid-cols-3 gap-1 overflow-hidden p-1 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="aspect-square overflow-hidden rounded-md bg-slate-100">
          <SecureMedia bucket={item.bucket ?? "flamme-media"} path={item.path} type="image" className="h-full w-full object-cover" />
        </div>
      ))}
    </Card>
  );
}

export function ProfileViewV3({
  me,
  profile,
  onBack,
  onMeChanged,
}: {
  me: Profile;
  profile: Profile;
  onBack?: () => void;
  onMeChanged?: (profile: Profile) => void;
}) {
  const own = profile.id === me.id;
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [display, setDisplay] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio || "");
  const [city, setCity] = useState(profile.city || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarPreview = useObjectUrl(avatar);
  const coverPreview = useObjectUrl(cover);
  const liveAvatar = avatarPreview || (!removeAvatar ? publicAvatarUrl(profile.avatar_path) : null);
  const liveCover = coverPreview || (!removeCover ? publicAvatarUrl(profile.cover_path) : null);

  const displayProfile = useMemo<Profile>(() => ({ ...profile, avatar_path: liveAvatar ? profile.avatar_path : null }), [liveAvatar, profile]);

  const loadStats = useCallback(async () => {
    const [{ count: posts }, { count: followers }, { count: following }] = await Promise.all([
      socialDb.from("flamme_posts").select("id", { count: "exact", head: true }).eq("author_id", profile.id),
      socialDb.from("flamme_follows").select("id", { count: "exact", head: true }).eq("following_id", profile.id).eq("status", "accepted"),
      socialDb.from("flamme_follows").select("id", { count: "exact", head: true }).eq("follower_id", profile.id).eq("status", "accepted"),
    ]);
    setStats({ posts: posts ?? 0, followers: followers ?? 0, following: following ?? 0 });
  }, [profile.id]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    setDisplay(profile.display_name);
    setBio(profile.bio || "");
    setCity(profile.city || "");
    setWebsite(profile.website || "");
    setAvatar(null);
    setCover(null);
    setRemoveAvatar(false);
    setRemoveCover(false);
  }, [profile]);

  const chooseAvatar = (file: File | null) => {
    if (!file) return;
    try {
      validateProfileImage(file, "Photo de profil");
      setError(null);
      setRemoveAvatar(false);
      setAvatar(file);
      setEditOpen(true);
    } catch (cause) {
      setError(socialErrorMessage(cause, "Photo de profil invalide."));
      setEditOpen(true);
    }
  };

  const chooseCover = (file: File | null) => {
    if (!file) return;
    try {
      validateProfileImage(file, "Photo de couverture");
      setError(null);
      setRemoveCover(false);
      setCover(file);
      setEditOpen(true);
    } catch (cause) {
      setError(socialErrorMessage(cause, "Photo de couverture invalide."));
      setEditOpen(true);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!own) return;
    setBusy(true);
    setError(null);
    let avatarPath = removeAvatar ? null : profile.avatar_path ?? null;
    let coverPath = removeCover ? null : profile.cover_path ?? null;
    const uploaded: string[] = [];
    try {
      if (avatar) {
        validateProfileImage(avatar, "Photo de profil");
        const path = `${me.id}/avatars/${crypto.randomUUID()}.${safeExt(avatar)}`;
        const { error: uploadError } = await supabase.storage.from("flamme-avatars").upload(path, avatar, { upsert: false, cacheControl: "3600" });
        if (uploadError) throw uploadError;
        uploaded.push(path);
        avatarPath = path;
      }
      if (cover) {
        validateProfileImage(cover, "Photo de couverture");
        const path = `${me.id}/covers/${crypto.randomUUID()}.${safeExt(cover)}`;
        const { error: uploadError } = await supabase.storage.from("flamme-avatars").upload(path, cover, { upsert: false, cacheControl: "3600" });
        if (uploadError) throw uploadError;
        uploaded.push(path);
        coverPath = path;
      }

      const { data, error: updateError } = await socialDb
        .from("flamme_profiles")
        .update({
          display_name: display.trim(),
          bio: bio.trim(),
          city: city.trim() || null,
          website: website.trim() || null,
          avatar_path: avatarPath,
          cover_path: coverPath,
        })
        .eq("id", me.id)
        .select("*")
        .single();
      if (updateError || !data) throw updateError ?? new Error("Profil impossible à enregistrer.");

      const oldPaths = [
        profile.avatar_path && profile.avatar_path !== avatarPath ? profile.avatar_path : null,
        profile.cover_path && profile.cover_path !== coverPath ? profile.cover_path : null,
      ].filter(Boolean) as string[];
      if (oldPaths.length) await supabase.storage.from("flamme-avatars").remove(oldPaths).then(() => undefined, () => undefined);

      setAvatar(null);
      setCover(null);
      setRemoveAvatar(false);
      setRemoveCover(false);
      setEditOpen(false);
      onMeChanged?.(data as Profile);
    } catch (cause) {
      if (uploaded.length) await supabase.storage.from("flamme-avatars").remove(uploaded).then(() => undefined, () => undefined);
      setError(socialErrorMessage(cause, "Profil impossible à enregistrer."));
    } finally {
      setBusy(false);
    }
  };

  const tabs: Array<[ProfileTab, string]> = [
    ["posts", "Publications"],
    ["about", "À propos"],
    ["contacts", "Contacts"],
    ["photos", "Photos"],
  ];

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-[#172638] via-[#5D536B] to-[#CE654B] sm:h-64">
          {liveCover && <img src={liveCover} alt="Photo de couverture" className="h-full w-full object-cover" />}
          {own && (
            <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-extrabold text-[#172638] shadow-md backdrop-blur hover:bg-white">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">{profile.cover_path ? "Modifier la couverture" : "Ajouter une couverture"}</span>
              <span className="sm:hidden">Couverture</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseCover(event.target.files?.[0] ?? null)} />
            </label>
          )}
        </div>

        <div className="px-4 pb-0 sm:px-6">
          <div className="flex flex-wrap items-end gap-4 border-b border-black/[.07] pb-4 dark:border-white/10">
            <div className="relative -mt-14 shrink-0 rounded-full border-4 border-white bg-white shadow-sm dark:border-[#181b20] dark:bg-[#181b20]">
              {liveAvatar ? (
                <img src={liveAvatar} alt="Photo de profil" className="h-28 w-28 rounded-full object-cover sm:h-36 sm:w-36" />
              ) : (
                <Avatar profile={displayProfile} size="xl" />
              )}
              {own && (
                <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#E4E6EB] text-[#172638] shadow hover:bg-[#D8DADF]">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-2xl font-extrabold text-slate-950 sm:text-3xl dark:text-white">{profile.display_name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">@{profile.handle}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{stats.followers} abonné{stats.followers > 1 ? "s" : ""} · {stats.following} abonnement{stats.following > 1 ? "s" : ""}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 pb-1">
              {own && <button onClick={() => setEditOpen(true)} className="rounded-lg bg-[#E4E6EB] px-4 py-2.5 text-xs font-extrabold text-[#172638] hover:bg-[#D8DADF] dark:bg-white/10 dark:text-white">Modifier le profil</button>}
              {onBack && <button onClick={onBack} className="rounded-lg px-3 py-2.5 text-xs font-bold text-slate-500 hover:bg-[#F0F2F5] dark:hover:bg-white/5">Retour</button>}
            </div>
          </div>

          <nav className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cx("relative shrink-0 px-4 py-4 text-sm font-bold text-slate-500 hover:bg-[#F0F2F5] dark:hover:bg-white/5", tab === id && "text-[#CE654B]")}>
                {label}
                {tab === id && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#CE654B]" />}
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {tab === "posts" && <ProfileTimeline profile={profile} />}
      {tab === "about" && (
        <Card className="p-5">
          <h2 className="text-lg font-extrabold dark:text-white">À propos</h2>
          {profile.bio ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{profile.bio}</p> : <p className="mt-3 text-sm text-slate-500">Aucune bio renseignée.</p>}
          <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {profile.city && <p><MapPin className="mr-2 inline h-4 w-4 text-slate-400" />Habite à <strong>{profile.city}</strong></p>}
            {profile.website && <p><ExternalLink className="mr-2 inline h-4 w-4 text-slate-400" /><a className="font-bold text-[#CE654B]" href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer">{profile.website}</a></p>}
            <p><UserRound className="mr-2 inline h-4 w-4 text-slate-400" />Membre depuis {new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
          </div>
        </Card>
      )}
      {tab === "contacts" && <ProfileContacts profile={profile} />}
      {tab === "photos" && <ProfilePhotos profile={profile} />}

      <Modal open={editOpen} onClose={() => !busy && setEditOpen(false)}>
        <form onSubmit={save} className="p-5">
          <div className="flex items-center justify-between border-b pb-4 dark:border-white/10">
            <h2 className="text-xl font-extrabold dark:text-white">Modifier le profil</h2>
            <button type="button" disabled={busy} onClick={() => setEditOpen(false)} className="rounded-full bg-[#E4E6EB] p-2 text-[#172638] disabled:opacity-40 dark:bg-white/10 dark:text-white"><X className="h-5 w-5" /></button>
          </div>

          <section className="mt-5">
            <div className="flex items-center justify-between"><strong className="text-sm dark:text-white">Photo de profil</strong><label className="cursor-pointer text-xs font-bold text-[#CE654B]">Modifier<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)} /></label></div>
            <div className="mt-3 flex items-center gap-4 rounded-xl bg-[#F0F2F5] p-3 dark:bg-white/5">
              {liveAvatar ? <img src={liveAvatar} alt="Aperçu" className="h-20 w-20 rounded-full object-cover" /> : <Avatar profile={profile} size="lg" />}
              <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">JPG, PNG ou WebP · 5 Mo maximum.</p>{(profile.avatar_path || avatar) && <button type="button" onClick={() => { setAvatar(null); setRemoveAvatar(true); }} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>}</div>
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between"><strong className="text-sm dark:text-white">Photo de couverture</strong><label className="cursor-pointer text-xs font-bold text-[#CE654B]">Modifier<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseCover(event.target.files?.[0] ?? null)} /></label></div>
            <div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-br from-[#172638] to-[#CE654B]">
              {liveCover ? <img src={liveCover} alt="Aperçu couverture" className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center text-xs font-bold text-white/70">Aucune photo de couverture</div>}
            </div>
            {(profile.cover_path || cover) && <button type="button" onClick={() => { setCover(null); setRemoveCover(true); }} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> Supprimer la couverture</button>}
          </section>

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-slate-500">Nom affiché<input required value={display} onChange={(event) => setDisplay(event.target.value)} maxLength={80} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#CE654B] dark:border-white/10 dark:bg-white/5 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#CE654B] dark:border-white/10 dark:bg-white/5 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500">Ville<input value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#CE654B] dark:border-white/10 dark:bg-white/5 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500">Site web<input value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#CE654B] dark:border-white/10 dark:bg-white/5 dark:text-white" /></label>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy || !display.trim()} className="mt-5 w-full rounded-lg bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </form>
      </Modal>
    </div>
  );
}
