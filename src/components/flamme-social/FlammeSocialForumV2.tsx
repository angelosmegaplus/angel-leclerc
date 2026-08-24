import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Clock3, LockKeyhole, MessageSquareText, Pin, Plus, Reply, Search, Trash2, X } from "lucide-react";
import { Avatar, Card, Empty, Modal, cx, moderatePublicText, notify, relativeLabel, socialDb, socialErrorMessage, type Profile } from "./social-v2-shared";

type ForumTopic = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: "Général" | "Aide" | "Culture" | "Actualité" | "Technique" | "Autres";
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

type ForumReply = {
  id: string;
  topic_id: string;
  author_id: string;
  body: string;
  reply_to_id?: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORIES: ForumTopic["category"][] = ["Général", "Aide", "Culture", "Actualité", "Technique", "Autres"];

function TopicRow({ topic, author, replies, onOpen }: { topic: ForumTopic; author?: Profile; replies: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="forum-topic-row w-full border-b border-black/[.06] px-3 py-3 text-left transition hover:bg-black/[.025] last:border-b-0 dark:border-white/10 dark:hover:bg-white/[.03] sm:px-4">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar profile={author} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {topic.is_pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-[#CE654B]" />}
            <strong className="min-w-0 flex-1 break-words text-[14px] leading-snug text-slate-900 dark:text-white">{topic.title}</strong>
            {topic.is_locked && <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
          </div>
          <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-slate-500">{topic.body}</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
            <span className="max-w-[45%] truncate font-bold text-[#CE654B]">{topic.category}</span>
            <span className="max-w-[45%] truncate">{author?.display_name ?? "Membre"}</span>
            <span>{replies} réponse{replies > 1 ? "s" : ""}</span>
            <span>activité {relativeLabel(topic.updated_at)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function ForumViewV2({ me, onProfile, onMessages }: { me: Profile; onProfile?: (profile: Profile) => void; onMessages?: () => void }) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replyCounts, setReplyCounts] = useState(new Map<string, number>());
  const [profiles, setProfiles] = useState(new Map<string, Profile>());
  const [selected, setSelected] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyProfiles, setReplyProfiles] = useState(new Map<string, Profile>());
  const [replyLimit, setReplyLimit] = useState(30);
  const [replyTotal, setReplyTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Tous" | ForumTopic["category"]>("Tous");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState<ForumTopic["category"]>("Général");
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<ForumReply | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    const [{ data: topicRows, error: topicError }, { data: replyRows }] = await Promise.all([
      socialDb.from("flamme_forum_topics").select("*").order("is_pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(150),
      socialDb.from("flamme_forum_replies").select("topic_id").limit(5000),
    ]);
    if (topicError) {
      setError(socialErrorMessage(topicError, "Impossible de charger les discussions."));
      return;
    }
    const list = (topicRows ?? []) as ForumTopic[];
    const counts = new Map<string, number>();
    for (const row of replyRows ?? []) counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
    const authorIds = [...new Set(list.map((topic) => topic.author_id))];
    const { data: people } = authorIds.length ? await socialDb.from("flamme_profiles").select("*").in("id", authorIds) : { data: [] };
    setTopics(list);
    setReplyCounts(counts);
    setProfiles(new Map((people ?? []).map((profile: Profile) => [profile.id, profile])));
  }, []);

  const loadThread = useCallback(async (topic: ForumTopic, limit = replyLimit) => {
    setError(null);
    const { data: rows, error: replyError, count } = await socialDb
      .from("flamme_forum_replies")
      .select("*", { count: "exact" })
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true })
      .range(0, Math.max(0, limit - 1));
    if (replyError) {
      setError(socialErrorMessage(replyError, "Impossible de charger les réponses."));
      return;
    }
    const list = (rows ?? []) as ForumReply[];
    const ids = [...new Set([topic.author_id, ...list.map((reply) => reply.author_id)])];
    const { data: people } = ids.length ? await socialDb.from("flamme_profiles").select("*").in("id", ids) : { data: [] };
    setReplies(list);
    setReplyTotal(count ?? list.length);
    setReplyProfiles(new Map((people ?? []).map((profile: Profile) => [profile.id, profile])));
  }, [replyLimit]);

  useEffect(() => {
    void loadTopics();
    const channel = socialDb
      .channel("flamme-forum-topics")
      .on("postgres_changes", { event: "*", schema: "public", table: "flamme_forum_topics" }, () => void loadTopics())
      .on("postgres_changes", { event: "*", schema: "public", table: "flamme_forum_replies" }, () => void loadTopics())
      .subscribe();
    return () => { void socialDb.removeChannel(channel); };
  }, [loadTopics]);

  useEffect(() => {
    if (!selected) return;
    void loadThread(selected, replyLimit);
    const channel = socialDb
      .channel(`flamme-forum-thread-${selected.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "flamme_forum_replies", filter: `topic_id=eq.${selected.id}` }, () => void loadThread(selected, replyLimit))
      .subscribe();
    return () => { void socialDb.removeChannel(channel); };
  }, [loadThread, replyLimit, selected]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return topics.filter((topic) => {
      if (category !== "Tous" && topic.category !== category) return false;
      if (!needle) return true;
      const author = profiles.get(topic.author_id);
      return `${topic.title} ${topic.body} ${topic.category} ${author?.display_name ?? ""}`.toLowerCase().includes(needle);
    });
  }, [category, profiles, query, topics]);

  const createTopic = async (event: FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    const body = newBody.trim();
    if (title.length < 3 || !body) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await moderatePublicText(`${title}\n${body}`, "discussion de forum"))) return;
      const { data, error: insertError } = await socialDb
        .from("flamme_forum_topics")
        .insert({ author_id: me.id, title, body, category: newCategory })
        .select("*")
        .single();
      if (insertError || !data) throw insertError ?? new Error("Discussion impossible.");
      setCreateOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewCategory("Général");
      await loadTopics();
      setSelected(data as ForumTopic);
      setReplyLimit(30);
    } catch (cause) {
      setError(socialErrorMessage(cause, "La discussion n’a pas pu être créée."));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || selected.is_locked || busy) return;
    const body = replyBody.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await moderatePublicText(body, "réponse de forum"))) return;
      const { data, error: insertError } = await socialDb
        .from("flamme_forum_replies")
        .insert({ topic_id: selected.id, author_id: me.id, body, reply_to_id: replyTo?.id ?? null })
        .select("id")
        .single();
      if (insertError || !data?.id) throw insertError ?? new Error("Réponse impossible.");
      await notify(selected.author_id, me.id, "forum_reply", "forum_topic", selected.id, { reply_id: data.id });
      setReplyBody("");
      setReplyTo(null);
      setReplyLimit((value) => Math.max(value, replyTotal + 1));
      await loadThread(selected, Math.max(replyLimit, replyTotal + 1));
      await loadTopics();
    } catch (cause) {
      setError(socialErrorMessage(cause, "La réponse n’a pas pu être envoyée."));
    } finally {
      setBusy(false);
    }
  };

  const deleteTopic = async () => {
    if (!selected || selected.author_id !== me.id || !confirm("Supprimer définitivement cette discussion et toutes ses réponses ?")) return;
    const { error: deleteError } = await socialDb.from("flamme_forum_topics").delete().eq("id", selected.id);
    if (deleteError) return setError(socialErrorMessage(deleteError, "Suppression impossible."));
    setSelected(null);
    await loadTopics();
  };

  const deleteReply = async (reply: ForumReply) => {
    if (reply.author_id !== me.id || !confirm("Supprimer cette réponse ?")) return;
    const { error: deleteError } = await socialDb.from("flamme_forum_replies").delete().eq("id", reply.id);
    if (deleteError) return setError(socialErrorMessage(deleteError, "Suppression impossible."));
    if (selected) await loadThread(selected, replyLimit);
  };

  if (selected) {
    const author = replyProfiles.get(selected.author_id) ?? profiles.get(selected.author_id);
    return (
      <div className="forum-thread-view space-y-2 sm:space-y-3">
        <Card className="forum-thread-header p-3 sm:p-4">
          <div className="flex min-w-0 items-start gap-2">
            <button type="button" onClick={() => { setSelected(null); setReplyTo(null); setReplyLimit(30); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] text-slate-600 dark:bg-white/10 dark:text-slate-200" aria-label="Retour aux discussions"><ArrowLeft className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-full bg-[#CE654B]/10 px-2 py-1 text-[10px] font-extrabold text-[#CE654B]">{selected.category}</span>
                {selected.is_locked && <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />}
              </div>
              <h1 className="mt-2 break-words text-lg font-extrabold leading-tight text-slate-950 dark:text-white sm:text-xl">{selected.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500"><span>créé {relativeLabel(selected.created_at)}</span><span>·</span><span>{replyTotal} réponse{replyTotal > 1 ? "s" : ""}</span></p>
            </div>
            {selected.author_id === me.id && <button type="button" onClick={() => void deleteTopic()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600" title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
          </div>
        </Card>

        <Card className="forum-message-card overflow-hidden">
          <div className="flex min-w-0 gap-3 p-3 sm:p-4">
            <button type="button" onClick={() => author && onProfile?.(author)} className="shrink-0"><Avatar profile={author} size="md" /></button>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center justify-between gap-2"><button type="button" onClick={() => author && onProfile?.(author)} className="min-w-0 truncate text-left text-sm font-extrabold dark:text-white">{author?.display_name ?? "Membre Flamme"}</button><span className="shrink-0 text-[10px] text-slate-400"># sujet</span></div>
              <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-slate-800 dark:text-slate-100">{selected.body}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          {replies.map((reply, index) => {
            const person = replyProfiles.get(reply.author_id);
            const quoted = reply.reply_to_id ? replies.find((item) => item.id === reply.reply_to_id) : null;
            const quotedAuthor = quoted ? replyProfiles.get(quoted.author_id) : null;
            return (
              <Card key={reply.id} className="forum-message-card overflow-hidden">
                <div className="flex min-w-0 gap-3 p-3 sm:p-4">
                  <button type="button" onClick={() => person && onProfile?.(person)} className="shrink-0"><Avatar profile={person} size="md" /></button>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><button type="button" onClick={() => person && onProfile?.(person)} className="block max-w-full truncate text-left text-sm font-extrabold dark:text-white">{person?.display_name ?? "Membre"}</button><span className="text-[10px] text-slate-500">{relativeLabel(reply.created_at)}</span></div><span className="shrink-0 text-[10px] text-slate-400">#{index + 1}</span></div>
                    {quoted && <div className="mt-2 border-l-2 border-[#CE654B] bg-[#CE654B]/[.05] px-3 py-2 text-xs text-slate-500"><strong className="block truncate text-[10px] text-[#CE654B]">{quotedAuthor?.display_name ?? "Réponse citée"}</strong><p className="mt-0.5 line-clamp-2 break-words">{quoted.body}</p></div>}
                    <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-slate-800 dark:text-slate-100">{reply.body}</p>
                    <div className="mt-2 flex items-center gap-3"><button type="button" onClick={() => setReplyTo(reply)} className="flex min-h-9 items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#CE654B]"><Reply className="h-3.5 w-3.5" />Répondre</button>{reply.author_id === me.id && <button type="button" onClick={() => void deleteReply(reply)} className="min-h-9 text-[11px] font-bold text-slate-400 hover:text-red-600">Supprimer</button>}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {replies.length < replyTotal && <button type="button" onClick={() => setReplyLimit((value) => value + 30)} className="w-full rounded-xl bg-white py-3 text-sm font-extrabold text-[#CE654B] shadow-sm dark:bg-[#181b20]">Afficher les réponses suivantes</button>}

        <Card className="forum-reply-composer sticky bottom-[72px] z-20 p-3 shadow-lg lg:bottom-3 sm:p-4">
          {selected.is_locked ? <p className="flex items-center gap-2 text-sm font-bold text-slate-500"><LockKeyhole className="h-4 w-4" />Cette discussion est verrouillée.</p> : <form onSubmit={sendReply}>
            {replyTo && <div className="mb-2 flex min-w-0 items-center gap-2 rounded-lg bg-[#F0F2F5] px-3 py-2 text-xs dark:bg-white/[.06]"><Reply className="h-3.5 w-3.5 shrink-0 text-[#CE654B]"/><span className="min-w-0 flex-1 truncate text-slate-500">Réponse à {replyProfiles.get(replyTo.author_id)?.display_name ?? "un membre"}</span><button type="button" onClick={() => setReplyTo(null)} className="shrink-0"><X className="h-4 w-4"/></button></div>}
            <div className="flex min-w-0 items-end gap-2"><Avatar profile={me} size="sm"/><textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} rows={2} maxLength={8000} placeholder="Répondre à la discussion…" className="min-h-12 min-w-0 flex-1 resize-none rounded-xl bg-[#F0F2F5] px-3 py-2.5 text-[16px] outline-none dark:bg-white/[.06] dark:text-white"/><button disabled={busy || !replyBody.trim()} className="shrink-0 rounded-xl bg-[#CE654B] px-3 py-3 text-xs font-extrabold text-white disabled:opacity-40">Envoyer</button></div>
          </form>}
          {error && <p className="mt-2 break-words rounded-xl bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        </Card>
      </div>
    );
  }

  return (
    <div className="forum-index-view space-y-2 sm:space-y-3">
      <Card className="p-3 sm:p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0"><h1 className="flex items-center gap-2 text-lg font-extrabold dark:text-white sm:text-xl"><MessageSquareText className="h-5 w-5 shrink-0 text-[#CE654B]"/>Discussions</h1><p className="mt-1 break-words text-xs leading-relaxed text-slate-500">Lancez un sujet, puis échangez réponse après réponse comme sur un forum.</p></div>
          <button type="button" onClick={() => setCreateOpen(true)} className="shrink-0 rounded-xl bg-[#CE654B] px-3 py-2.5 text-xs font-extrabold text-white"><Plus className="mr-1 inline h-4 w-4"/>Sujet</button>
        </div>
        <div className="mt-3 rounded-xl bg-[#F0F2F5] p-2.5 text-[11px] leading-relaxed text-slate-600 dark:bg-white/[.05] dark:text-slate-300">Les <strong>groupes de conversation privés</strong> se créent maintenant dans <button type="button" onClick={onMessages} className="font-extrabold text-[#CE654B]">Messages</button>. Ici, on garde uniquement les discussions publiques organisées par sujet.</div>
        <label className="mt-3 flex min-w-0 items-center gap-2 rounded-xl bg-[#F0F2F5] px-3 py-2.5 dark:bg-white/[.06]"><Search className="h-4 w-4 shrink-0 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un sujet…" className="min-w-0 flex-1 bg-transparent text-[16px] outline-none dark:text-white"/></label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><button type="button" onClick={() => setCategory("Tous")} className={cx("shrink-0 rounded-full px-3 py-2 text-[11px] font-extrabold", category === "Tous" ? "bg-[#CE654B] text-white" : "bg-[#F0F2F5] text-slate-600 dark:bg-white/10 dark:text-slate-200")}>Tous</button>{CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={cx("shrink-0 rounded-full px-3 py-2 text-[11px] font-extrabold", category === item ? "bg-[#CE654B] text-white" : "bg-[#F0F2F5] text-slate-600 dark:bg-white/10 dark:text-slate-200")}>{item}</button>)}</div>
      </Card>

      <Card className="overflow-hidden p-0">{filtered.map((topic) => <TopicRow key={topic.id} topic={topic} author={profiles.get(topic.author_id)} replies={replyCounts.get(topic.id) ?? 0} onOpen={() => { setSelected(topic); setReplyLimit(30); }} />)}{!filtered.length && <div className="p-4"><Empty icon={MessageSquareText} title="Aucune discussion" text="Créez un sujet pour démarrer le forum."/></div>}</Card>
      {error && <Card className="border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</Card>}

      <Modal open={createOpen} onClose={() => !busy && setCreateOpen(false)}>
        <form onSubmit={createTopic} className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-extrabold dark:text-white sm:text-xl">Nouveau sujet</h2><p className="text-xs text-slate-500">Une question ou un thème, puis les réponses suivent chronologiquement.</p></div><button type="button" onClick={() => setCreateOpen(false)} disabled={busy} className="shrink-0 rounded-full bg-[#F0F2F5] p-2 dark:bg-white/10"><X className="h-5 w-5"/></button></div>
          <select value={newCategory} onChange={(event) => setNewCategory(event.target.value as ForumTopic["category"])} className="mt-4 w-full rounded-xl border bg-white p-3 text-[16px] dark:border-white/10 dark:bg-[#181b20] dark:text-white">{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <input required minLength={3} maxLength={160} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Titre du sujet" className="mt-3 w-full rounded-xl border p-3 text-[16px] dark:border-white/10 dark:bg-white/5 dark:text-white"/>
          <textarea required maxLength={12000} rows={7} value={newBody} onChange={(event) => setNewBody(event.target.value)} placeholder="Expliquez votre sujet…" className="mt-3 w-full resize-y rounded-xl border p-3 text-[16px] leading-relaxed dark:border-white/10 dark:bg-white/5 dark:text-white"/>
          {error && <p className="mt-3 break-words rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <button disabled={busy || newTitle.trim().length < 3 || !newBody.trim()} className="mt-4 w-full rounded-xl bg-[#CE654B] py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "Publication…" : "Publier le sujet"}</button>
        </form>
      </Modal>
    </div>
  );
}
