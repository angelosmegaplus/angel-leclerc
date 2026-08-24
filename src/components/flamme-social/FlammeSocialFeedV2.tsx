import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  SmilePlus,
  Trash2,
  Video,
  Vote,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Avatar,
  Card,
  Empty,
  Modal,
  SecureMedia,
  cx,
  dateLabel,
  isAllowedMedia,
  moderatePublicText,
  notify,
  relativeLabel,
  safeExt,
  socialDb,
  socialErrorMessage,
  type CommentRow,
  type Media,
  type PollVote,
  type Post,
  type Profile,
  type ReactionRow,
  type StoryMedia,
  type StoryRow,
} from "./social-v2-shared";

type FeedBundle = {
  posts: Post[];
  profiles: Map<string, Profile>;
  media: Media[];
  reactions: ReactionRow[];
  comments: CommentRow[];
  votes: PollVote[];
  saved: Set<string>;
};

type RankedRow = { post_id: string; score: number; created_at: string };

const EMPTY: FeedBundle = {
  posts: [],
  profiles: new Map(),
  media: [],
  reactions: [],
  comments: [],
  votes: [],
  saved: new Set(),
};

const REACTIONS = [
  { id: "like", emoji: "👍", label: "J’aime" },
  { id: "love", emoji: "❤️", label: "J’adore" },
  { id: "laugh", emoji: "😂", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Waouh" },
  { id: "sad", emoji: "😢", label: "Triste" },
  { id: "support", emoji: "🤝", label: "Soutien" },
] as const;

const MOODS = ["😊 Heureux", "🥳 En fête", "😎 Détendu", "🤩 Enthousiaste", "😴 Fatigué", "🤔 Pensif"];

function LocalFilePreview({ file, className = "h-full w-full object-cover" }: { file: File; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (!url) return <div className={cx("animate-pulse bg-slate-200", className)} />;
  return file.type.startsWith("video/") ? (
    <video src={url} controls muted playsInline preload="metadata" className={className} />
  ) : (
    <img src={url} alt="Aperçu" decoding="async" draggable={false} className={className} />
  );
}

function StoryRail({ me, onProfile }: { me: Profile; onProfile?: (profile: Profile) => void }) {
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [profiles, setProfiles] = useState(new Map<string, Profile>());
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<StoryRow["visibility"]>("public");
  const [background, setBackground] = useState("#CE654B");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetCreator = useCallback(() => {
    setText("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const closeCreator = () => {
    if (busy) return;
    setCreateOpen(false);
    resetCreator();
  };

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const { data: rows, error: storyError } = await socialDb
      .from("flamme_stories")
      .select("*")
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(80);
    if (storyError) return;

    const list = (rows ?? []) as StoryRow[];
    const storyIds = list.map((story) => story.id);
    const authorIds = [...new Set(list.map((story) => story.author_id))];
    const [{ data: people }, { data: mediaRows }] = await Promise.all([
      authorIds.length ? socialDb.from("flamme_profiles").select("*").in("id", authorIds) : Promise.resolve({ data: [] }),
      storyIds.length ? socialDb.from("flamme_story_media").select("*").in("story_id", storyIds) : Promise.resolve({ data: [] }),
    ]);
    setStories(list);
    setProfiles(new Map((people ?? []).map((profile: Profile) => [profile.id, profile])));
    setMedia((mediaRows ?? []) as StoryMedia[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, StoryRow[]>();
    for (const story of stories) {
      const current = map.get(story.author_id) ?? [];
      current.push(story);
      map.set(story.author_id, current);
    }
    return [...map.entries()].map(([authorId, items]) => ({ authorId, items }));
  }, [stories]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() && !file) return;
    setBusy(true);
    setError(null);
    let storyId: string | null = null;
    let uploadedPath: string | null = null;
    try {
      if (file && !isAllowedMedia(file)) throw new Error("Formats acceptés : JPG, PNG, WebP, MP4 ou WebM, 50 Mo maximum.");
      if (visibility === "public" && text.trim() && !(await moderatePublicText(text, "story"))) return;

      const { data: story, error: storyError } = await socialDb
        .from("flamme_stories")
        .insert({ author_id: me.id, text: text.trim(), background, visibility })
        .select("*")
        .single();
      if (storyError || !story?.id) throw storyError ?? new Error("La story n’a pas pu être créée.");
      storyId = story.id as string;

      if (file) {
        const path = `${me.id}/stories/${storyId}/${crypto.randomUUID()}.${safeExt(file)}`;
        const { error: uploadError } = await supabase.storage.from("flamme-private-media").upload(path, file, {
          upsert: false,
          cacheControl: "3600",
        });
        if (uploadError) throw uploadError;
        uploadedPath = path;
        const { error: mediaError } = await socialDb.from("flamme_story_media").insert({
          story_id: storyId,
          path,
          bucket: "flamme-private-media",
          media_type: file.type.startsWith("video/") ? "video" : "image",
        });
        if (mediaError) throw mediaError;
      }

      resetCreator();
      setCreateOpen(false);
      await load();
    } catch (cause) {
      if (uploadedPath) await supabase.storage.from("flamme-private-media").remove([uploadedPath]).then(() => undefined, () => undefined);
      if (storyId) await socialDb.from("flamme_stories").delete().eq("id", storyId).then(() => undefined, () => undefined);
      setError(socialErrorMessage(cause, "La story n’a pas pu être publiée."));
    } finally {
      setBusy(false);
    }
  };

  const openStory = async (story: StoryRow) => {
    const index = stories.findIndex((item) => item.id === story.id);
    setViewer(index < 0 ? 0 : index);
    await socialDb.from("flamme_story_views").upsert({ story_id: story.id, user_id: me.id }, { onConflict: "story_id,user_id" }).then(() => undefined, () => undefined);
  };

  const current = viewer === null ? null : stories[viewer];
  const currentAuthor = current ? profiles.get(current.author_id) : null;
  const currentMedia = current ? media.find((item) => item.story_id === current.id) : null;

  return (
    <>
      <Card className="overflow-hidden p-2 sm:p-3">
        <div className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setCreateOpen(true)} className="relative h-[168px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#F0F2F5] text-left shadow-sm dark:bg-white/[.06]">
            <div className="h-[112px] overflow-hidden bg-slate-200 dark:bg-white/10"><Avatar profile={me} size="xl" /></div>
            <span className="absolute left-1/2 top-[96px] flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#CE654B] text-white dark:border-[#181b20]"><Plus className="h-4 w-4" /></span>
            <strong className="absolute inset-x-2 bottom-3 text-center text-[11px] leading-tight text-slate-800 dark:text-white">Créer une story</strong>
          </button>

          {grouped.map((group) => {
            const person = profiles.get(group.authorId);
            const story = group.items[0];
            if (!story) return null;
            const preview = media.find((item) => item.story_id === story.id);
            return (
              <button key={group.authorId} type="button" onClick={() => void openStory(story)} className="relative h-[168px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-slate-900 text-left text-white shadow-sm">
                {preview ? (
                  <SecureMedia bucket={preview.bucket} path={preview.path} type={preview.media_type} controls={false} muted className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-sm font-extrabold" style={{ background: story.background }}>{story.text}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <span className="absolute left-2 top-2 rounded-full border-2 border-[#CE654B] bg-white p-[1px] dark:bg-[#181b20]"><Avatar profile={person} size="sm" /></span>
                <strong className="absolute inset-x-2 bottom-2 line-clamp-2 text-[11px] leading-tight">{person?.display_name ?? "Flamme"}</strong>
              </button>
            );
          })}
        </div>
      </Card>

      <Modal open={createOpen} onClose={closeCreator}>
        <form onSubmit={create} className="p-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-extrabold dark:text-white">Créer une story</h2><p className="text-xs text-slate-500">Visible pendant 24 heures.</p></div>
            <button type="button" disabled={busy} onClick={closeCreator} className="rounded-full bg-[#E4E6EB] p-2 dark:bg-white/10"><X className="h-5 w-5" /></button>
          </div>

          <div className="mt-5 min-h-72 overflow-hidden rounded-2xl p-4 text-white shadow-inner" style={{ background }}>
            {file ? (
              <div className="h-72 overflow-hidden rounded-xl bg-black/20"><LocalFilePreview file={file} /></div>
            ) : (
              <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1500} placeholder="Écrivez quelque chose…" className="h-64 w-full resize-none bg-transparent text-center text-2xl font-extrabold outline-none placeholder:text-white/60" />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3 text-xs font-bold dark:border-white/20 dark:text-white"><ImageIcon className="mr-1.5 h-4 w-4" />Photo/vidéo<input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); }} /></label>
            {["#CE654B", "#172638", "#6554C0", "#D94F70", "#168A72", "#181716"].map((color) => <button key={color} type="button" aria-label={`Fond ${color}`} onClick={() => setBackground(color)} className="h-10 w-10 rounded-full border-2 border-white shadow" style={{ background: color }} />)}
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as StoryRow["visibility"])} className="ml-auto min-h-11 rounded-full border bg-transparent px-3 text-xs font-bold dark:border-white/20 dark:text-white"><option className="text-black" value="public">Public</option><option className="text-black" value="contacts">Contacts</option><option className="text-black" value="only_me">Moi</option></select>
          </div>
          {file && <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1500} placeholder="Ajouter une légende…" className="mt-3 w-full rounded-xl border p-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />}
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy || (!text.trim() && !file)} className="mt-4 w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "Publication…" : "Partager la story"}</button>
        </form>
      </Modal>

      <Modal open={viewer !== null} onClose={() => setViewer(null)} className="max-w-md bg-black p-0 dark:bg-black">
        {current && (
          <div className="relative min-h-[72dvh] overflow-hidden bg-black text-white sm:rounded-2xl">
            <div className="absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-black/65 to-transparent" />
            <div className="absolute left-4 right-4 top-4 z-30 flex items-center gap-3">
              <Avatar profile={currentAuthor} size="sm" />
              <div className="min-w-0 flex-1"><button onClick={() => currentAuthor && onProfile?.(currentAuthor)} className="block truncate text-sm font-bold">{currentAuthor?.display_name ?? "Flamme"}</button><span className="text-[11px] text-white/70">{relativeLabel(current.created_at)}</span></div>
              {current.author_id === me.id && <button onClick={async () => { if (!confirm("Supprimer cette story ?")) return; const item=media.find((row)=>row.story_id===current.id); if(item) await supabase.storage.from(item.bucket).remove([item.path]).then(()=>undefined,()=>undefined); await socialDb.from("flamme_stories").delete().eq("id", current.id); setViewer(null); await load(); }} className="rounded-full bg-black/30 p-2"><Trash2 className="h-4 w-4" /></button>}
              <button onClick={() => setViewer(null)} className="rounded-full bg-black/30 p-2"><X className="h-4 w-4" /></button>
            </div>
            {currentMedia ? <SecureMedia bucket={currentMedia.bucket} path={currentMedia.path} type={currentMedia.media_type} className="h-[72dvh] w-full object-cover" controls={currentMedia.media_type === "video"} autoPlay muted={false} /> : <div className="flex h-[72dvh] items-center justify-center p-8 text-center text-3xl font-extrabold" style={{ background: current.background }}>{current.text}</div>}
            {currentMedia && current.text && <div className="absolute inset-x-5 bottom-8 rounded-2xl bg-black/45 p-4 text-center text-lg font-bold backdrop-blur">{current.text}</div>}
            <button disabled={viewer === 0} onClick={() => setViewer((value) => value === null ? value : Math.max(0, value - 1))} className="absolute left-2 top-1/2 z-30 rounded-full bg-black/35 p-2 disabled:opacity-20"><ChevronLeft /></button>
            <button disabled={viewer === stories.length - 1} onClick={() => setViewer((value) => value === null ? value : Math.min(stories.length - 1, value + 1))} className="absolute right-2 top-1/2 z-30 rounded-full bg-black/35 p-2 disabled:opacity-20"><ChevronRight /></button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Composer({ me, onCreated, groupId, videoOnly = false }: { me: Profile; onCreated: () => void; groupId?: string; videoOnly?: boolean }) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Post["visibility"]>("public");
  const [files, setFiles] = useState<File[]>([]);
  const [poll, setPoll] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [mood, setMood] = useState("");
  const [moodsOpen, setMoodsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...list].slice(0, 6);
    if (next.some((item) => !isAllowedMedia(item))) return setError("Formats acceptés : JPG, PNG, WebP, MP4 ou WebM, 50 Mo maximum par fichier.");
    if (next.some((item) => item.type.startsWith("video/")) && next.length > 1) return setError("Une vidéo doit être publiée seule.");
    if (videoOnly && !next[0]?.type.startsWith("video/")) return setError("La section Vidéos attend un fichier MP4 ou WebM.");
    setFiles(next);
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    const base = text.trim();
    const content = `${base}${base && mood ? "\n\n" : ""}${mood}`.trim();
    if (!content && !files.length && !poll) return;
    if (poll && (question.trim().length < 2 || cleanOptions.length < 2)) return setError("Un sondage doit avoir une question et au moins deux réponses.");
    setBusy(true);
    setError(null);
    let postId: string | null = null;
    const uploaded: Array<{ bucket: string; path: string }> = [];
    try {
      if (visibility === "public" && content && !(await moderatePublicText(content, videoOnly ? "video" : "publication"))) return;
      const kind: Post["kind"] = videoOnly || files.some((item) => item.type.startsWith("video/")) ? "video" : "post";
      const pollData = poll ? { question: question.trim(), options: cleanOptions.slice(0, 8) } : null;
      const { data: post, error: postError } = await socialDb.from("flamme_posts").insert({ author_id: me.id, group_id: groupId ?? null, content, visibility, kind, poll: pollData }).select("id").single();
      if (postError || !post?.id) throw postError ?? new Error("Publication impossible.");
      postId = post.id as string;
      const bucket = visibility === "public" ? "flamme-media" : "flamme-private-media";
      for (let position = 0; position < files.length; position += 1) {
        const item = files[position];
        if (!item) continue;
        const path = `${me.id}/posts/${postId}/${crypto.randomUUID()}.${safeExt(item)}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, item, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push({ bucket, path });
        const { error: rowError } = await socialDb.from("flamme_post_media").insert({ post_id: postId, path, bucket, media_type: item.type.startsWith("video/") ? "video" : "image", position });
        if (rowError) throw rowError;
      }
      setText(""); setFiles([]); setPoll(false); setQuestion(""); setOptions(["", ""]); setMood(""); setMoodsOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onCreated();
    } catch (cause) {
      for (const item of uploaded) await supabase.storage.from(item.bucket).remove([item.path]).then(() => undefined, () => undefined);
      if (postId) await socialDb.from("flamme_posts").delete().eq("id", postId).then(() => undefined, () => undefined);
      setError(socialErrorMessage(cause, "La publication n’a pas pu être envoyée."));
    } finally {
      setBusy(false);
    }
  };

  const firstName = me.display_name?.trim().split(/\s+/)[0] || "vous";
  return (
    <Card className="p-3 sm:p-4">
      <form onSubmit={submit}>
        <div className="flex items-start gap-3">
          <Avatar profile={me} />
          <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={5000} rows={2} placeholder={videoOnly ? "Une légende pour votre vidéo…" : `Quoi de neuf, ${firstName} ?`} className="min-h-14 min-w-0 flex-1 resize-none rounded-2xl bg-[#F0F2F5] px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-[#CE654B]/25 dark:bg-white/[.06] dark:text-white dark:focus:bg-white/[.08]" />
        </div>

        {mood && <div className="mt-2 ml-14 inline-flex items-center gap-2 rounded-full bg-[#F0F2F5] px-3 py-1.5 text-xs font-bold dark:bg-white/10 dark:text-white"><span>{mood}</span><button type="button" onClick={() => setMood("")} className="min-h-0 p-0 text-slate-400"><X className="h-3.5 w-3.5" /></button></div>}

        {files.length > 0 && <div className={cx("mt-3 grid gap-1 overflow-hidden rounded-xl bg-black/5", files.length > 1 && "grid-cols-2")}>
          {files.map((item, index) => <div key={`${item.name}-${index}`} className={cx("relative overflow-hidden bg-slate-100", files.length === 1 ? "max-h-[420px]" : "aspect-square")}><LocalFilePreview file={item} className="h-full max-h-[420px] w-full object-cover" /><button type="button" onClick={() => { const next=files.filter((_,i)=>i!==index); setFiles(next); if(!next.length && fileInputRef.current) fileInputRef.current.value=""; }} className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-white"><X className="h-4 w-4" /></button></div>)}
        </div>}

        {poll && <div className="mt-3 rounded-xl border border-black/[.06] bg-[#F8F9FA] p-3 dark:border-white/10 dark:bg-white/[.04]"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Question du sondage" className="w-full rounded-xl border bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181b20] dark:text-white" /><div className="mt-2 space-y-2">{options.map((option, index) => <div key={index} className="flex gap-2"><input value={option} onChange={(event) => setOptions((current) => current.map((value, i) => i === index ? event.target.value : value))} placeholder={`Choix ${index + 1}`} className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181b20] dark:text-white" />{options.length > 2 && <button type="button" onClick={() => setOptions((current) => current.filter((_,i)=>i!==index))} className="px-2 text-slate-400"><X className="h-4 w-4" /></button>}</div>)}</div>{options.length < 8 && <button type="button" onClick={() => setOptions((current) => [...current, ""])} className="mt-2 text-xs font-bold text-[#CE654B]">+ Ajouter un choix</button>}</div>}

        {moodsOpen && !videoOnly && <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-[#F8F9FA] p-3 dark:bg-white/[.04]">{MOODS.map((item) => <button key={item} type="button" onClick={() => { setMood(item); setMoodsOpen(false); }} className="rounded-full bg-white px-3 py-2 text-xs font-bold shadow-sm dark:bg-white/10 dark:text-white">{item}</button>)}</div>}
        {error && <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

        <div className="mt-3 grid grid-cols-3 border-t border-black/[.06] pt-2 dark:border-white/10">
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-600 hover:bg-[#F0F2F5] dark:text-slate-300 dark:hover:bg-white/[.06]"><ImageIcon className="h-4 w-4 text-emerald-600" />{videoOnly ? "Vidéo" : "Photo/vidéo"}<input ref={fileInputRef} type="file" multiple={!videoOnly} accept={videoOnly ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,video/mp4,video/webm"} className="hidden" onChange={(event) => addFiles(event.target.files)} /></label>
          {!videoOnly ? <button type="button" onClick={() => setPoll((value) => !value)} className={cx("flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-600 hover:bg-[#F0F2F5] dark:text-slate-300 dark:hover:bg-white/[.06]", poll && "bg-[#CE654B]/10 text-[#CE654B]")}><Vote className="h-4 w-4 text-violet-600" />Sondage</button> : <span />}
          {!videoOnly ? <button type="button" onClick={() => setMoodsOpen((value) => !value)} className="flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-600 hover:bg-[#F0F2F5] dark:text-slate-300 dark:hover:bg-white/[.06]"><SmilePlus className="h-4 w-4 text-amber-500" />Humeur</button> : <span />}
        </div>
        <div className="mt-2 flex items-center gap-2"><select value={visibility} onChange={(event) => setVisibility(event.target.value as Post["visibility"])} className="min-h-10 rounded-lg border-0 bg-[#F0F2F5] px-2 text-xs font-bold text-slate-600 outline-none dark:bg-white/10 dark:text-slate-300"><option value="public">🌍 Public</option><option value="contacts">👥 Contacts</option><option value="only_me">🔒 Moi uniquement</option></select><button disabled={busy || (!text.trim() && !files.length && !poll && !mood)} className="ml-auto rounded-lg bg-[#CE654B] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-40">{busy ? "Publication…" : "Publier"}</button></div>
      </form>
    </Card>
  );
}

function PollBlock({ post, votes, me, onChanged }: { post: Post; votes: PollVote[]; me: Profile; onChanged: () => void }) {
  const options = post.poll?.options ?? [];
  if (!post.poll || options.length < 2) return null;
  const mine = votes.find((vote) => vote.user_id === me.id);
  const total = votes.length;
  const vote = async (index: number) => { await socialDb.from("flamme_poll_votes").upsert({ post_id: post.id, user_id: me.id, option_index: index }, { onConflict: "post_id,user_id" }); onChanged(); };
  return <div className="mx-4 mb-3"><p className="mb-2 text-sm font-extrabold dark:text-white">{post.poll.question}</p><div className="space-y-2">{options.map((option, index) => { const count=votes.filter((item)=>item.option_index===index).length; const percentage=total?Math.round((count*100)/total):0; return <button key={index} type="button" onClick={()=>void vote(index)} className={cx("relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm font-semibold dark:border-white/10 dark:text-white",mine?.option_index===index&&"border-[#CE654B] ring-1 ring-[#CE654B]")}><span className="absolute inset-y-0 left-0 bg-[#CE654B]/12" style={{width:`${percentage}%`}}/><span className="relative flex justify-between gap-3"><span>{option}</span><span className="text-xs text-slate-500">{percentage}%</span></span></button>; })}</div><p className="mt-2 text-[11px] text-slate-500">{total} vote{total>1?"s":""}{mine?" · Vous avez voté":""}</p></div>;
}

function PostCard({ post, me, author, media, reactions, comments, votes, profiles, saved, onChanged, onProfile }: { post: Post; me: Profile; author?: Profile; media: Media[]; reactions: ReactionRow[]; comments: CommentRow[]; votes: PollVote[]; profiles: Map<string, Profile>; saved: boolean; onChanged: () => void; onProfile?: (profile: Profile) => void }) {
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reactOpen, setReactOpen] = useState(false);
  const mine = reactions.find((reaction) => reaction.user_id === me.id);
  const reactionInfo = REACTIONS.find((reaction) => reaction.id === mine?.reaction);
  const counts = REACTIONS.map((reaction) => ({ ...reaction, count: reactions.filter((item) => item.reaction === reaction.id).length })).filter((reaction) => reaction.count > 0);

  const react = async (reaction: ReactionRow["reaction"] | null) => { setReactOpen(false); await socialDb.from("flamme_reactions").delete().eq("post_id", post.id).eq("user_id", me.id); if (reaction) { await socialDb.from("flamme_reactions").insert({ post_id: post.id, user_id: me.id, reaction }); await notify(post.author_id, me.id, "reaction", "post", post.id, { reaction }); } onChanged(); };
  const save = async () => { if(saved) await socialDb.from("flamme_saved_items").delete().eq("post_id",post.id).eq("user_id",me.id); else await socialDb.from("flamme_saved_items").insert({post_id:post.id,user_id:me.id}); onChanged(); };
  const addComment = async (event: FormEvent) => { event.preventDefault(); const value=comment.trim(); if(!value||commentBusy)return; setCommentBusy(true); try { if(post.visibility==="public"&&!(await moderatePublicText(value,"commentaire")))return; const {data,error}=await socialDb.from("flamme_comments").insert({post_id:post.id,author_id:me.id,parent_id:replyTo,content:value}).select("id").single(); if(error)throw error; if(data?.id){await notify(post.author_id,me.id,replyTo?"reply":"comment","post",post.id,{comment_id:data.id});setComment("");setReplyTo(null);onChanged();}} catch(cause){alert(socialErrorMessage(cause,"Commentaire impossible."));} finally{setCommentBusy(false);} };
  const share = async () => { const url=`${location.origin}/flamme/social?post=${post.id}`; try{if(navigator.share)await navigator.share({title:"Flamme",text:post.content.slice(0,120),url});else{await navigator.clipboard.writeText(url);alert("Lien copié.");}}catch{/* annulé */} };
  const edit = async () => { const next=prompt("Modifier la publication",post.content); if(next===null||!next.trim())return; if(post.visibility==="public"&&!(await moderatePublicText(next,"publication")))return; await socialDb.from("flamme_posts").update({content:next.trim()}).eq("id",post.id); onChanged(); };
  const remove = async () => { if(!confirm("Supprimer cette publication ?"))return; for(const item of media) await supabase.storage.from(item.bucket??"flamme-media").remove([item.path]).then(()=>undefined,()=>undefined); await socialDb.from("flamme_posts").delete().eq("id",post.id); onChanged(); };
  const report = async () => { const details=prompt("Pourquoi signalez-vous ce contenu ?",""); if(details===null)return; await socialDb.from("flamme_reports").insert({reporter_id:me.id,target_type:"post",target_id:post.id,reason:"other",details:details.slice(0,1000)}); alert("Signalement envoyé."); };
  const roots=comments.filter((item)=>!item.parent_id);

  return <Card className="overflow-hidden">
    <div className="flex gap-3 p-4 pb-2"><button onClick={()=>author&&onProfile?.(author)}><Avatar profile={author}/></button><div className="min-w-0 flex-1"><button onClick={()=>author&&onProfile?.(author)} className="block max-w-full truncate text-left text-sm font-extrabold text-slate-900 hover:underline dark:text-white">{author?.display_name??"Utilisateur Flamme"}</button><p className="mt-0.5 truncate text-[11px] text-slate-500">{dateLabel(post.created_at)} · {post.visibility==="public"?"🌍":post.visibility==="contacts"?"👥":"🔒"}</p></div>{post.author_id===me.id?<div className="flex"><button onClick={()=>void edit()} className="rounded-full p-2 text-slate-400" title="Modifier">✎</button><button onClick={()=>void remove()} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></div>:<button onClick={()=>void report()} className="rounded-full p-2 text-slate-400"><MoreHorizontal className="h-5 w-5"/></button>}</div>
    {post.content&&<p className="whitespace-pre-wrap break-words px-4 pb-3 text-[15px] leading-[1.48] text-slate-800 dark:text-slate-100">{post.content}</p>}
    <PollBlock post={post} votes={votes} me={me} onChanged={onChanged}/>
    {media.length>0&&<div className={cx("grid gap-[2px] overflow-hidden bg-black/5",media.length>1&&"grid-cols-2")}>{media.slice(0,6).map((item,index)=><div key={item.id} className={cx("relative overflow-hidden",media.length===1?"max-h-[70dvh]":"aspect-square",media.length===3&&index===0&&"row-span-2")}><SecureMedia bucket={item.bucket??"flamme-media"} path={item.path} type={item.media_type} className="h-full max-h-[70dvh] w-full object-cover" controls={item.media_type==="video"}/>{index===5&&media.length>6&&<span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-extrabold text-white">+{media.length-6}</span>}</div>)}</div>}
    <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500"><div className="flex items-center gap-1">{counts.slice(0,3).map((reaction)=><span key={reaction.id}>{reaction.emoji}</span>)}{reactions.length>0&&<span>{reactions.length}</span>}</div><button onClick={()=>setCommentsOpen(true)}>{comments.length>0?`${comments.length} commentaire${comments.length>1?"s":""}`:""}</button></div>
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] border-t border-black/[.06] px-2 py-1 dark:border-white/10"><div className="relative flex"><button onClick={()=>void react(mine?null:"like")} className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-slate-600 hover:bg-[#F0F2F5] dark:text-slate-300 dark:hover:bg-white/[.06]",mine&&"text-[#CE654B]")}>{reactionInfo?<span className="text-base">{reactionInfo.emoji}</span>:<Heart className="h-4 w-4"/>}{reactionInfo?.label??"J’aime"}</button><button type="button" onClick={()=>setReactOpen((v)=>!v)} aria-label="Choisir une réaction" className="min-h-0 w-7 rounded-lg text-sm text-slate-400 hover:bg-[#F0F2F5]">⌄</button>{reactOpen&&<div className="absolute bottom-full left-0 z-30 mb-1 flex rounded-full border bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#242830]">{REACTIONS.map((reaction)=><button key={reaction.id} onClick={()=>void react(reaction.id)} title={reaction.label} className="min-h-0 rounded-full p-1 text-xl transition active:scale-125 sm:hover:-translate-y-1 sm:hover:scale-125">{reaction.emoji}</button>)}</div>}</div><button onClick={()=>setCommentsOpen((v)=>!v)} className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-slate-600 hover:bg-[#F0F2F5] dark:text-slate-300"><MessageCircle className="h-4 w-4"/>Commenter</button><button onClick={()=>void share()} className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-slate-600 hover:bg-[#F0F2F5] dark:text-slate-300"><Share2 className="h-4 w-4"/>Partager</button><button onClick={()=>void save()} className={cx("rounded-lg p-2 text-slate-500 hover:bg-[#F0F2F5]",saved&&"text-[#CE654B]")} title="Enregistrer"><Bookmark className={cx("h-4 w-4",saved&&"fill-current")}/></button></div>
    {commentsOpen&&<div className="border-t border-black/[.05] bg-[#F8F9FA] p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="max-h-80 space-y-3 overflow-y-auto">{roots.slice(-20).map((row)=>{const person=profiles.get(row.author_id);const replies=comments.filter((item)=>item.parent_id===row.id);return <div key={row.id}><div className="flex gap-2"><Avatar profile={person} size="sm"/><div className="min-w-0"><div className="rounded-2xl bg-white px-3 py-2 dark:bg-white/[.07]"><strong className="text-xs dark:text-white">{person?.display_name??"Utilisateur"}</strong><p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{row.content}</p></div><button onClick={()=>{setReplyTo(row.id);setCommentsOpen(true)}} className="ml-2 min-h-0 py-1 text-[11px] font-bold text-slate-500">Répondre</button></div></div>{replies.map((reply)=>{const p=profiles.get(reply.author_id);return <div key={reply.id} className="ml-10 mt-2 flex gap-2"><Avatar profile={p} size="xs"/><div className="rounded-2xl bg-white px-3 py-2 text-sm dark:bg-white/[.07] dark:text-slate-200"><strong className="block text-[11px] dark:text-white">{p?.display_name??"Utilisateur"}</strong>{reply.content}</div></div>})}</div>})}{!roots.length&&<p className="py-3 text-center text-xs text-slate-500">Soyez le premier à commenter.</p>}</div><form onSubmit={addComment} className="mt-3 flex items-end gap-2"><Avatar profile={me} size="sm"/><div className="min-w-0 flex-1">{replyTo&&<div className="mb-1 flex items-center justify-between px-2 text-[10px] text-slate-500"><span>Réponse à un commentaire</span><button type="button" onClick={()=>setReplyTo(null)} className="min-h-0">Annuler</button></div>}<div className="flex rounded-2xl bg-white p-1.5 dark:bg-white/[.07]"><input value={comment} onChange={(event)=>setComment(event.target.value)} maxLength={1500} placeholder="Écrire un commentaire…" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none dark:text-white"/><button disabled={!comment.trim()||commentBusy} className="rounded-full p-2 text-[#CE654B] disabled:opacity-30"><Send className="h-4 w-4"/></button></div></div></form></div>}
  </Card>;
}

function FeedSkeleton() {
  return <div className="space-y-3">{[0,1,2].map((item)=><Card key={item} className="overflow-hidden"><div className="flex gap-3 p-4"><div className="h-11 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-white/10"/><div className="flex-1"><div className="h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-white/10"/><div className="mt-2 h-2 w-24 animate-pulse rounded bg-slate-100 dark:bg-white/5"/></div></div><div className="mx-4 mb-4 h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5"/></Card>)}</div>;
}

export function FeedViewV2({ me, savedOnly=false, contactsOnly=false, groupId, onProfile, showComposer=true }: { me: Profile; savedOnly?: boolean; contactsOnly?: boolean; groupId?: string; onProfile?: (profile: Profile) => void; showComposer?: boolean }) {
  const [bundle,setBundle]=useState<FeedBundle>(EMPTY);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [limit,setLimit]=useState(20);
  const [hasMore,setHasMore]=useState(false);
  const reloadTimer=useRef<number|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      let posts:Post[]=[];
      let savedIds:string[]|undefined;
      if(savedOnly){const {data,error:savedError}=await socialDb.from("flamme_saved_items").select("post_id").eq("user_id",me.id).order("created_at",{ascending:false}).limit(limit);if(savedError)throw savedError;savedIds=(data??[]).map((row:{post_id:string})=>row.post_id);if(!savedIds.length){setBundle(EMPTY);setHasMore(false);return;}}

      if(!groupId&&!savedOnly&&!contactsOnly){
        const {data:ranked,error:rankError}=await socialDb.rpc("flamme_ranked_feed",{p_limit:limit,p_before:null,p_contacts_only:false});
        const rankedRows=(ranked??[]) as RankedRow[];
        if(!rankError&&rankedRows.length){const ids=rankedRows.map((row)=>row.post_id);const {data,error:postError}=await socialDb.from("flamme_posts").select("*").in("id",ids);if(postError)throw postError;const byId=new Map(((data??[]) as Post[]).map((post)=>[post.id,post]));posts=ids.map((id)=>byId.get(id)).filter(Boolean) as Post[];}
      }

      if(!posts.length){let query=socialDb.from("flamme_posts").select("*").order("created_at",{ascending:false}).limit(limit);query=groupId?query.eq("group_id",groupId):query.is("group_id",null);if(savedIds)query=query.in("id",savedIds);if(contactsOnly){const {data:follows}=await socialDb.from("flamme_follows").select("following_id").eq("follower_id",me.id).eq("status","accepted");const contactIds=[me.id,...(follows??[]).map((row:{following_id:string})=>row.following_id)];query=query.in("author_id",contactIds);}const {data,error:postError}=await query;if(postError)throw postError;posts=(data??[]) as Post[];if(savedIds){const byId=new Map(posts.map((post)=>[post.id,post]));posts=savedIds.map((id)=>byId.get(id)).filter(Boolean) as Post[];}}

      const ids=posts.map((post)=>post.id);setHasMore(posts.length>=limit);if(!ids.length){setBundle(EMPTY);return;}
      const [mediaRes,reactionRes,commentRes,voteRes,savedRes]=await Promise.all([socialDb.from("flamme_post_media").select("*").in("post_id",ids).order("position"),socialDb.from("flamme_reactions").select("*").in("post_id",ids),socialDb.from("flamme_comments").select("*").in("post_id",ids).order("created_at"),socialDb.from("flamme_poll_votes").select("*").in("post_id",ids),socialDb.from("flamme_saved_items").select("post_id").eq("user_id",me.id).in("post_id",ids)]);
      const comments=(commentRes.data??[]) as CommentRow[];const profileIds=[...new Set([...posts.map((post)=>post.author_id),...comments.map((item)=>item.author_id)])];const {data:people}=await socialDb.from("flamme_profiles").select("*").in("id",profileIds);
      setBundle({posts,profiles:new Map((people??[]).map((profile:Profile)=>[profile.id,profile])),media:(mediaRes.data??[]) as Media[],reactions:(reactionRes.data??[]) as ReactionRow[],comments,votes:(voteRes.data??[]) as PollVote[],saved:new Set((savedRes.data??[]).map((row:{post_id:string})=>row.post_id))});
    }catch(cause){setError(socialErrorMessage(cause,"Impossible de charger le fil."));}finally{setLoading(false);}
  },[contactsOnly,groupId,limit,me.id,savedOnly]);

  const scheduleReload=useCallback(()=>{if(reloadTimer.current)window.clearTimeout(reloadTimer.current);reloadTimer.current=window.setTimeout(()=>void load(),300);},[load]);
  useEffect(()=>{void load();const channel=socialDb.channel(`flamme-feed-${groupId??"main"}-${me.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"flamme_posts"},scheduleReload).subscribe();return()=>{if(reloadTimer.current)window.clearTimeout(reloadTimer.current);void socialDb.removeChannel(channel);};},[groupId,load,me.id,scheduleReload]);

  return <div className="space-y-3">{!groupId&&!savedOnly&&!contactsOnly&&<StoryRail me={me} onProfile={onProfile}/>} {showComposer&&!savedOnly&&<Composer me={me} groupId={groupId} onCreated={scheduleReload}/>} {error&&<Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>} {loading&&bundle.posts.length===0?<FeedSkeleton/>:!bundle.posts.length?<Empty title={savedOnly?"Aucun contenu enregistré":contactsOnly?"Le fil de vos contacts est calme":"Le fil est encore calme"} text={savedOnly?"Utilisez le marque-page sous une publication pour la retrouver ici.":"Publiez quelque chose ou découvrez de nouvelles personnes."}/>:<>{bundle.posts.map((post)=><PostCard key={post.id} post={post} me={me} author={bundle.profiles.get(post.author_id)} media={bundle.media.filter((item)=>item.post_id===post.id)} reactions={bundle.reactions.filter((item)=>item.post_id===post.id)} comments={bundle.comments.filter((item)=>item.post_id===post.id)} votes={bundle.votes.filter((item)=>item.post_id===post.id)} profiles={bundle.profiles} saved={bundle.saved.has(post.id)} onChanged={scheduleReload} onProfile={onProfile}/>)}{hasMore&&<button onClick={()=>setLimit((value)=>Math.min(100,value+20))} disabled={loading||limit>=100} className="w-full rounded-xl bg-white py-3 text-sm font-extrabold text-[#CE654B] shadow-sm disabled:opacity-40 dark:bg-[#181b20]">{loading?"Chargement…":"Afficher plus"}</button>}</>}</div>;
}

function VerticalVideo({post,media,author,me,reactions,onChanged,onProfile}:{post:Post;media:Media;author?:Profile;me:Profile;reactions:ReactionRow[];onChanged:()=>void;onProfile?:(profile:Profile)=>void}){
  const [url,setUrl]=useState<string|null>(null);const videoRef=useRef<HTMLVideoElement|null>(null);const [playing,setPlaying]=useState(false);const [muted,setMuted]=useState(true);const liked=reactions.some((reaction)=>reaction.user_id===me.id);
  useEffect(()=>{let active=true;void(async()=>{if((media.bucket??"flamme-media")==="flamme-media"){if(active)setUrl(supabase.storage.from("flamme-media").getPublicUrl(media.path).data.publicUrl);return;}const {data}=await supabase.storage.from("flamme-private-media").createSignedUrl(media.path,3600);if(active)setUrl(data?.signedUrl??null);})();return()=>{active=false};},[media.bucket,media.path]);
  useEffect(()=>{const node=videoRef.current;if(!node)return;const observer=new IntersectionObserver((entries)=>{const entry=entries[0];const visible=Boolean(entry?.isIntersecting&&entry.intersectionRatio>.65);if(visible)void node.play().then(()=>setPlaying(true)).catch(()=>undefined);else{node.pause();setPlaying(false);}},{threshold:[.2,.65,.9]});observer.observe(node);return()=>observer.disconnect();},[url]);
  const toggle=()=>{const node=videoRef.current;if(!node)return;if(node.paused){void node.play();setPlaying(true);}else{node.pause();setPlaying(false);}};
  const like=async()=>{if(liked)await socialDb.from("flamme_reactions").delete().eq("post_id",post.id).eq("user_id",me.id);else{await socialDb.from("flamme_reactions").insert({post_id:post.id,user_id:me.id,reaction:"like"});await notify(post.author_id,me.id,"reaction","post",post.id,{reaction:"like"});}onChanged();};
  const share=async()=>{const link=`${location.origin}/flamme/social?post=${post.id}`;try{if(navigator.share)await navigator.share({title:"Vidéo Flamme",text:post.content,url:link});else await navigator.clipboard.writeText(link);}catch{/* annulé */}};
  return <article className="relative mx-auto h-[calc(100dvh-128px)] min-h-[520px] w-full max-w-[520px] snap-start overflow-hidden rounded-xl bg-black text-white shadow-xl sm:h-[calc(100dvh-90px)]">{url?<video ref={videoRef} src={url} muted={muted} loop playsInline preload="metadata" onClick={toggle} className="h-full w-full object-contain"/>:<div className="h-full w-full animate-pulse bg-white/10"/>}<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20"/><button onClick={toggle} className="absolute left-4 top-4 rounded-full bg-black/30 p-2 backdrop-blur">{playing?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4"/>}</button><button onClick={()=>setMuted((value)=>!value)} className="absolute right-4 top-4 rounded-full bg-black/30 px-3 py-2 text-[11px] font-bold backdrop-blur">{muted?"Son off":"Son on"}</button><div className="absolute bottom-5 left-4 right-20"><button onClick={()=>author&&onProfile?.(author)} className="flex items-center gap-2"><Avatar profile={author} size="sm"/><strong className="text-sm">{author?.display_name??"Flamme"}</strong></button>{post.content&&<p className="mt-3 line-clamp-4 text-sm leading-relaxed">{post.content}</p>}<p className="mt-2 text-[11px] text-white/60">{relativeLabel(post.created_at)}</p></div><div className="absolute bottom-7 right-3 flex flex-col items-center gap-4"><button onClick={()=>void like()} className="flex flex-col items-center text-[10px]"><span className={cx("flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur",liked&&"bg-[#CE654B]")}><Heart className={cx("h-5 w-5",liked&&"fill-current")}/></span><span className="mt-1">{reactions.length}</span></button><button onClick={()=>void share()} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur"><Share2 className="h-5 w-5"/></button></div></article>;
}

export function VideoFeedV2({me,onProfile}:{me:Profile;onProfile?:(profile:Profile)=>void}){
  const [posts,setPosts]=useState<Post[]>([]);const [media,setMedia]=useState<Media[]>([]);const [profiles,setProfiles]=useState(new Map<string,Profile>());const [reactions,setReactions]=useState<ReactionRow[]>([]);const [composer,setComposer]=useState(false);const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);const {data:rows}=await socialDb.from("flamme_posts").select("*").eq("kind","video").is("group_id",null).order("created_at",{ascending:false}).limit(40);const list=(rows??[]) as Post[];const ids=list.map((post)=>post.id);if(!ids.length){setPosts([]);setMedia([]);setLoading(false);return;}const [{data:mediaRows},{data:reactionRows}]=await Promise.all([socialDb.from("flamme_post_media").select("*").in("post_id",ids).eq("media_type","video"),socialDb.from("flamme_reactions").select("*").in("post_id",ids)]);const authors=[...new Set(list.map((post)=>post.author_id))];const {data:people}=await socialDb.from("flamme_profiles").select("*").in("id",authors);setPosts(list);setMedia((mediaRows??[]) as Media[]);setProfiles(new Map((people??[]).map((profile:Profile)=>[profile.id,profile])));setReactions((reactionRows??[]) as ReactionRow[]);setLoading(false);},[]);
  useEffect(()=>{void load();},[load]);
  return <div><div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-[#181b20]"><div><h1 className="text-lg font-extrabold dark:text-white">Vidéos</h1><p className="text-xs text-slate-500">Défilement vertical, une vidéo à la fois.</p></div><button onClick={()=>setComposer((value)=>!value)} className="rounded-lg bg-[#CE654B] px-3 py-2 text-xs font-extrabold text-white"><Plus className="mr-1 inline h-4 w-4"/>Publier</button></div>{composer&&<div className="mb-3"><Composer me={me} videoOnly onCreated={()=>{setComposer(false);void load();}}/></div>}{loading&&!posts.length?<FeedSkeleton/>:!posts.length?<Empty icon={Video} title="Aucune vidéo" text="Publiez la première vidéo courte de Flamme."/>:<div className="h-[calc(100dvh-136px)] snap-y snap-mandatory space-y-3 overflow-y-auto pb-20 sm:h-[calc(100dvh-82px)]">{posts.map((post)=>{const item=media.find((mediaItem)=>mediaItem.post_id===post.id);if(!item)return null;return <VerticalVideo key={post.id} post={post} media={item} author={profiles.get(post.author_id)} me={me} reactions={reactions.filter((reaction)=>reaction.post_id===post.id)} onChanged={load} onProfile={onProfile}/>;})}</div>}</div>;
}
