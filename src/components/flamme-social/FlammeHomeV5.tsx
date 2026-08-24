import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Plus, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Avatar,
  Card,
  Modal,
  SecureMedia,
  cx,
  isAllowedMedia,
  moderatePublicText,
  relativeLabel,
  safeExt,
  socialDb,
  socialErrorMessage,
  type Profile,
  type StoryMedia,
  type StoryRow,
} from "./social-v2-shared";
import { FeedViewV4 } from "./FlammeSocialFeedV4";

function AnonymousStoryAvatar() {
  return <span className="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-white/10"><UserRound className="h-5 w-5" /></span>;
}

function LocalStoryPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (!url) return <div className="h-full w-full animate-pulse bg-black/10" />;
  return file.type.startsWith("video/") ? <video src={url} controls muted playsInline className="h-full w-full object-cover" /> : <img src={url} alt="Aperçu" className="h-full w-full object-cover" />;
}

function CompactStories({ me, onProfile }: { me: Profile; onProfile?: (profile: Profile) => void }) {
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [profiles, setProfiles] = useState(new Map<string, Profile>());
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const [creator, setCreator] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<StoryRow["visibility"]>("public");
  const [anonymous, setAnonymous] = useState(false);
  const [background, setBackground] = useState("#CE654B");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const { data: rows } = await socialDb
      .from("flamme_stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .neq("moderation_status", "hidden")
      .order("created_at", { ascending: false })
      .limit(80);
    const list = (rows ?? []) as StoryRow[];
    const storyIds = list.map((story) => story.id);
    const authorIds = [...new Set(list.filter((story) => !story.is_anonymous).map((story) => story.author_id))];
    const [{ data: people }, { data: mediaRows }] = await Promise.all([
      authorIds.length ? socialDb.from("flamme_profiles").select("*").in("id", authorIds) : Promise.resolve({ data: [] }),
      storyIds.length ? socialDb.from("flamme_story_media").select("*").in("story_id", storyIds) : Promise.resolve({ data: [] }),
    ]);
    setStories(list);
    setProfiles(new Map<string, Profile>(((people ?? []) as Profile[]).map((profile) => [profile.id, profile])));
    setMedia((mediaRows ?? []) as StoryMedia[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, StoryRow[]>();
    for (const story of stories) {
      const key = story.is_anonymous ? `anonymous:${story.id}` : story.author_id;
      const current = map.get(key) ?? [];
      current.push(story);
      map.set(key, current);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items }));
  }, [stories]);

  const reset = () => {
    setText(""); setFile(null); setAnonymous(false); setError(null); setBackground("#CE654B"); setVisibility("public");
    if (fileInput.current) fileInput.current.value = "";
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if ((!text.trim() && !file) || busy) return;
    setBusy(true); setError(null);
    let storyId: string | null = null;
    let uploadedPath: string | null = null;
    try {
      if (file && !isAllowedMedia(file)) throw new Error("JPG, PNG, WebP, MP4 ou WebM, 50 Mo maximum.");
      if (visibility === "public" && text.trim() && !(await moderatePublicText(text.trim(), "story"))) return;
      const { data, error: storyError } = await socialDb
        .from("flamme_stories")
        .insert({ author_id: me.id, text: text.trim(), background, visibility, is_anonymous: anonymous })
        .select("id")
        .single();
      if (storyError || !data?.id) throw storyError ?? new Error("Story impossible.");
      storyId = data.id as string;
      if (file) {
        uploadedPath = `${me.id}/stories/${storyId}/${crypto.randomUUID()}.${safeExt(file)}`;
        const { error: uploadError } = await supabase.storage.from("flamme-private-media").upload(uploadedPath, file, { upsert: false, cacheControl: "3600" });
        if (uploadError) throw uploadError;
        const { error: mediaError } = await socialDb.from("flamme_story_media").insert({ story_id: storyId, path: uploadedPath, bucket: "flamme-private-media", media_type: file.type.startsWith("video/") ? "video" : "image" });
        if (mediaError) throw mediaError;
      }
      reset(); setCreator(false); await load();
    } catch (cause) {
      if (uploadedPath) await supabase.storage.from("flamme-private-media").remove([uploadedPath]).then(() => undefined, () => undefined);
      if (storyId) await socialDb.from("flamme_stories").delete().eq("id", storyId).then(() => undefined, () => undefined);
      setError(socialErrorMessage(cause, "Story impossible à publier."));
    } finally { setBusy(false); }
  };

  const current = viewer === null ? null : stories[viewer];
  const currentAuthor = current && !current.is_anonymous ? profiles.get(current.author_id) : undefined;
  const currentMedia = current ? media.find((item) => item.story_id === current.id) : undefined;

  return <>
    <div className="border-b border-black/[.06] bg-white px-2 py-2.5 dark:border-white/10 dark:bg-[#181b20] sm:rounded-2xl sm:border sm:shadow-sm">
      <div className="flex gap-3 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setCreator(true)} className="w-[68px] shrink-0 text-center">
          <span className="relative mx-auto block h-[58px] w-[58px] rounded-full p-[2px] ring-1 ring-black/10 dark:ring-white/10">
            <Avatar profile={me} size="lg" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#CE654B] text-white dark:border-[#181b20]"><Plus className="h-3 w-3" /></span>
          </span>
          <span className="mt-1 block truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">Votre story</span>
        </button>
        {grouped.map((group) => {
          const story = group.items[0];
          if (!story) return null;
          const person = story.is_anonymous ? undefined : profiles.get(story.author_id);
          return <button key={group.key} onClick={() => { const index = stories.findIndex((row) => row.id === story.id); setViewer(index < 0 ? 0 : index); void socialDb.from("flamme_story_views").upsert({ story_id: story.id, user_id: me.id }, { onConflict: "story_id,user_id" }); }} className="w-[68px] shrink-0 text-center">
            <span className="mx-auto block h-[58px] w-[58px] rounded-full bg-gradient-to-br from-[#F7A267] via-[#D74A68] to-[#6D55C7] p-[2px]">
              <span className="block h-full w-full rounded-full bg-white p-[2px] dark:bg-[#181b20]">
                {story.is_anonymous ? <AnonymousStoryAvatar /> : <Avatar profile={person} size="lg" />}
              </span>
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">{story.is_anonymous ? "Anonyme" : person?.display_name ?? "Flamme"}</span>
          </button>;
        })}
      </div>
    </div>

    <Modal open={creator} onClose={() => !busy && setCreator(false)}>
      <form onSubmit={create} className="p-5">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold dark:text-white">Nouvelle story</h2><p className="text-xs text-slate-500">Visible pendant 24 heures.</p></div><button type="button" onClick={() => setCreator(false)} className="rounded-full bg-[#E4E6EB] p-2 dark:bg-white/10"><X className="h-4 w-4" /></button></div>
        <div className="mt-4 h-[54dvh] max-h-[520px] min-h-[320px] overflow-hidden rounded-2xl p-4 text-white" style={{ background }}>
          {file ? <LocalStoryPreview file={file} /> : <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Votre story…" className="h-full w-full resize-none bg-transparent text-center text-2xl font-extrabold outline-none placeholder:text-white/60" />}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold dark:border-white/15 dark:text-white"><ImageIcon className="h-4 w-4" />Photo/vidéo<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>{["#CE654B", "#172638", "#6554C0", "#D94F70", "#168A72"].map((color) => <button key={color} type="button" onClick={() => setBackground(color)} className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: color }} />)}<select value={visibility} onChange={(event) => setVisibility(event.target.value as StoryRow["visibility"])} className="ml-auto rounded-full border bg-transparent px-3 py-2 text-xs font-bold dark:border-white/15 dark:text-white"><option className="text-black" value="public">Public</option><option className="text-black" value="contacts">Contacts</option><option className="text-black" value="only_me">Moi</option></select></div>
        {file && <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Ajouter une légende…" className="mt-3 w-full rounded-xl border p-3 text-base dark:border-white/10 dark:bg-white/5 dark:text-white" />}
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />Afficher comme Anonyme</label>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button disabled={busy || (!text.trim() && !file)} className="mt-4 w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "Publication…" : "Partager"}</button>
      </form>
    </Modal>

    <Modal open={viewer !== null} onClose={() => setViewer(null)} className="max-w-md bg-black p-0 dark:bg-black">
      {current && <div className="relative min-h-[75dvh] overflow-hidden bg-black text-white"><div className="absolute left-3 right-3 top-3 z-20 flex items-center gap-2">{current.is_anonymous ? <span className="h-9 w-9"><AnonymousStoryAvatar /></span> : <Avatar profile={currentAuthor} size="sm" />}<button disabled={current.is_anonymous} onClick={() => currentAuthor && onProfile?.(currentAuthor)} className="min-w-0 flex-1 truncate text-left text-sm font-bold">{current.is_anonymous ? "Anonyme" : currentAuthor?.display_name ?? "Flamme"}</button><span className="text-[10px] text-white/65">{relativeLabel(current.created_at)}</span><button onClick={() => setViewer(null)} className="rounded-full bg-black/30 p-2"><X className="h-4 w-4" /></button></div>{currentMedia ? <SecureMedia bucket={currentMedia.bucket} path={currentMedia.path} type={currentMedia.media_type} className="absolute inset-0 h-full w-full object-contain" /> : <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-3xl font-extrabold" style={{ background: current.background }}>{current.text}</div>}{current.text && currentMedia && <p className="absolute inset-x-4 bottom-5 rounded-xl bg-black/35 p-3 text-sm backdrop-blur">{current.text}</p>}<button disabled={viewer === 0} onClick={() => setViewer((value) => value === null ? null : Math.max(0, value - 1))} className="absolute left-2 top-1/2 rounded-full bg-black/30 p-2 disabled:opacity-20"><ChevronLeft /></button><button disabled={viewer === stories.length - 1} onClick={() => setViewer((value) => value === null ? null : Math.min(stories.length - 1, value + 1))} className="absolute right-2 top-1/2 rounded-full bg-black/30 p-2 disabled:opacity-20"><ChevronRight /></button></div>}
    </Modal>
  </>;
}

export function FlammeHomeV5({ me, onProfile }: { me: Profile; onProfile?: (profile: Profile) => void }) {
  const [tab, setTab] = useState<"all" | "contacts">("all");
  return <div className="space-y-2">
    <div className="flex items-center justify-center border-b border-black/[.06] bg-white px-3 dark:border-white/10 dark:bg-[#181b20] sm:rounded-xl sm:border sm:shadow-sm">
      <button onClick={() => setTab("all")} className={cx("relative min-h-11 flex-1 max-w-40 text-xs font-extrabold", tab === "all" ? "text-[#CE654B]" : "text-slate-500")}>Pour vous{tab === "all" && <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-[#CE654B]" />}</button>
      <button onClick={() => setTab("contacts")} className={cx("relative min-h-11 flex-1 max-w-40 text-xs font-extrabold", tab === "contacts" ? "text-[#CE654B]" : "text-slate-500")}>Abonnements{tab === "contacts" && <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-[#CE654B]" />}</button>
    </div>
    <CompactStories me={me} onProfile={onProfile} />
    <div className="flamme-home-feed-v5"><FeedViewV4 me={me} contactsOnly={tab === "contacts"} onProfile={onProfile} /></div>
    <style>{`.flamme-home-feed-v5 > div > section:first-child{display:none!important}`}</style>
  </div>;
}
