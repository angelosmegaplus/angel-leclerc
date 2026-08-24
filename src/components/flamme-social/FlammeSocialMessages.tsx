import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LockKeyhole, MessageCircle, Plus, Search, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  decryptMessage,
  encryptMessage,
  generateConversationKey,
  getConversationKey,
  getOrCreateLocalIdentity,
  getStoredDeviceId,
  saveConversationKey,
  setStoredDeviceId,
  unwrapConversationKey,
  wrapConversationKey,
  type LocalIdentity,
} from "@/lib/flamme-social-crypto";

const db = supabase as any;

type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_path?: string | null;
  allow_messages?: "everyone" | "contacts" | "nobody";
};

type DeviceRow = { id: string; user_id: string; public_jwk: JsonWebKey; label: string };
type ConversationRow = { id: string; kind: "direct" | "group"; title?: string | null; created_at: string };
type ConversationCard = ConversationRow & { peer?: Profile; memberIds: string[] };
type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_device_id: string;
  ciphertext: string;
  iv: string;
  created_at: string;
};
type DecryptedMessage = MessageRow & { text: string };

type Props = { me: Profile };

function avatarUrl(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from("flamme-avatars").getPublicUrl(path).data.publicUrl;
}

function Avatar({ profile, small = false }: { profile?: Profile; small?: boolean }) {
  const src = avatarUrl(profile?.avatar_path);
  const label = profile?.display_name?.slice(0, 1)?.toUpperCase() || "?";
  return src ? (
    <img src={src} alt="" className={`${small ? "h-9 w-9" : "h-11 w-11"} rounded-full object-cover`} />
  ) : (
    <span className={`${small ? "h-9 w-9" : "h-11 w-11"} flex shrink-0 items-center justify-center rounded-full bg-[#CE654B]/15 font-bold text-[#A84D38]`}>
      {label}
    </span>
  );
}

function timeLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function FlammeSocialMessages({ me }: Props) {
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const selected = useMemo(() => conversations.find((item) => item.id === selectedId) ?? null, [conversations, selectedId]);

  const ensureDevice = useCallback(async () => {
    const localIdentity = await getOrCreateLocalIdentity(me.id);
    setIdentity(localIdentity);
    let stored = await getStoredDeviceId(me.id);
    if (stored) {
      const { data } = await db.from("flamme_device_keys").select("id").eq("id", stored).eq("user_id", me.id).maybeSingle();
      if (data?.id) {
        await db.from("flamme_device_keys").update({ public_jwk: localIdentity.publicJwk, last_seen_at: new Date().toISOString() }).eq("id", stored);
        setDeviceId(stored);
        return { identity: localIdentity, deviceId: stored };
      }
    }
    const { data, error: insertError } = await db
      .from("flamme_device_keys")
      .insert({ user_id: me.id, label: "Navigateur actuel", public_jwk: localIdentity.publicJwk })
      .select("id")
      .single();
    if (insertError || !data?.id) throw insertError ?? new Error("Impossible d’enregistrer la clé publique de cet appareil.");
    stored = data.id as string;
    await setStoredDeviceId(me.id, stored);
    setDeviceId(stored);
    return { identity: localIdentity, deviceId: stored };
  }, [me.id]);

  const loadConversations = useCallback(async () => {
    const { data: ownMemberships, error: membershipError } = await db
      .from("flamme_conversation_members")
      .select("conversation_id")
      .eq("user_id", me.id);
    if (membershipError) throw membershipError;
    const ids = (ownMemberships ?? []).map((row: any) => row.conversation_id as string);
    if (!ids.length) {
      setConversations([]);
      setLoading(false);
      return;
    }
    const [{ data: rows }, { data: members }] = await Promise.all([
      db.from("flamme_conversations").select("id,kind,title,created_at").in("id", ids).order("created_at", { ascending: false }),
      db.from("flamme_conversation_members").select("conversation_id,user_id").in("conversation_id", ids),
    ]);
    const memberRows = members ?? [];
    const peerIds = Array.from(new Set(memberRows.map((row: any) => row.user_id as string).filter((id: string) => id !== me.id)));
    let profileMap = new Map<string, Profile>();
    if (peerIds.length) {
      const { data: profiles } = await db.from("flamme_profiles").select("id,handle,display_name,avatar_path,allow_messages").in("id", peerIds);
      profileMap = new Map((profiles ?? []).map((profile: Profile) => [profile.id, profile]));
    }
    const cards: ConversationCard[] = (rows ?? []).map((row: ConversationRow) => {
      const memberIds = memberRows.filter((member: any) => member.conversation_id === row.id).map((member: any) => member.user_id as string);
      const peerId = memberIds.find((id: string) => id !== me.id);
      return { ...row, memberIds, peer: peerId ? profileMap.get(peerId) : undefined };
    });
    setConversations(cards);
    setSelectedId((current) => current && cards.some((card) => card.id === current) ? current : cards[0]?.id ?? null);
    setLoading(false);
  }, [me.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        await ensureDevice();
        if (active) await loadConversations();
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Impossible d’initialiser la messagerie chiffrée.");
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [ensureDevice, loadConversations]);

  const obtainConversationKey = useCallback(async (conversationId: string) => {
    const cached = await getConversationKey(conversationId);
    if (cached) return cached;
    if (!identity || !deviceId) throw new Error("La clé de cet appareil n’est pas prête.");
    const { data: wrapped, error: wrappedError } = await db
      .from("flamme_conversation_keys")
      .select("wrapped_key,iv,sender_device_id")
      .eq("conversation_id", conversationId)
      .eq("recipient_user_id", me.id)
      .eq("recipient_device_id", deviceId)
      .maybeSingle();
    if (wrappedError) throw wrappedError;
    if (!wrapped) throw new Error("Aucune clé de conversation n’est disponible sur cet appareil. L’historique ancien peut rester illisible en bêta.");
    const { data: senderDevice, error: senderError } = await db
      .from("flamme_device_keys")
      .select("public_jwk")
      .eq("id", wrapped.sender_device_id)
      .single();
    if (senderError || !senderDevice?.public_jwk) throw senderError ?? new Error("Clé publique d’origine introuvable.");
    const key = await unwrapConversationKey(
      wrapped.wrapped_key,
      wrapped.iv,
      identity.privateKey,
      senderDevice.public_jwk as JsonWebKey,
      conversationId,
    );
    await saveConversationKey(conversationId, key);
    return key;
  }, [deviceId, identity, me.id]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setError(null);
    try {
      const key = await obtainConversationKey(conversationId);
      const { data, error: rowsError } = await db
        .from("flamme_messages")
        .select("id,conversation_id,sender_id,sender_device_id,ciphertext,iv,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(250);
      if (rowsError) throw rowsError;
      const decrypted = await Promise.all((rows ?? []).map(async (row: MessageRow) => {
        try {
          return { ...row, text: await decryptMessage(key, row.ciphertext, row.iv) };
        } catch {
          return { ...row, text: "🔒 Message illisible sur cet appareil" };
        }
      }));
      setMessages(decrypted);
      await db.from("flamme_conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", me.id);
    } catch (cause) {
      setMessages([]);
      setError(cause instanceof Error ? cause.message : "Impossible de déchiffrer cette conversation.");
    }
  }, [me.id, obtainConversationKey]);

  useEffect(() => {
    if (!selectedId || !deviceId || !identity) return;
    void loadMessages(selectedId);
    if (channelRef.current) void db.removeChannel(channelRef.current);
    const channel = db
      .channel(`flamme-messages-${selectedId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "flamme_messages", filter: `conversation_id=eq.${selectedId}` }, () => void loadMessages(selectedId))
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channel) void db.removeChannel(channel);
    };
  }, [deviceId, identity, loadMessages, selectedId]);

  useEffect(() => {
    const value = search.trim();
    if (value.length < 2) {
      setPeople([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const escaped = value.replace(/[%_]/g, "");
      const { data } = await db
        .from("flamme_profiles")
        .select("id,handle,display_name,avatar_path,allow_messages")
        .neq("id", me.id)
        .or(`handle.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
        .limit(8);
      setPeople(data ?? []);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [me.id, search]);

  const startConversation = async (peer: Profile) => {
    setError(null);
    try {
      if (!identity || !deviceId) throw new Error("Le chiffrement de cet appareil n’est pas prêt.");
      if (peer.allow_messages === "nobody") throw new Error("Cette personne n’accepte pas de nouveaux messages.");
      const existing = conversations.find((conversation) => conversation.kind === "direct" && conversation.memberIds.includes(peer.id));
      if (existing) {
        setSelectedId(existing.id);
        setSearch("");
        return;
      }
      const { data: peerDevices, error: deviceError } = await db
        .from("flamme_device_keys")
        .select("id,user_id,public_jwk,label")
        .eq("user_id", peer.id)
        .order("last_seen_at", { ascending: false })
        .limit(5);
      if (deviceError) throw deviceError;
      if (!peerDevices?.length) throw new Error("Cette personne doit ouvrir Messages sur Flamme une première fois avant de pouvoir recevoir une conversation chiffrée.");

      const { data: conversation, error: conversationError } = await db
        .from("flamme_conversations")
        .insert({ kind: "direct", created_by: me.id })
        .select("id")
        .single();
      if (conversationError || !conversation?.id) throw conversationError ?? new Error("Création de conversation impossible.");
      const conversationId = conversation.id as string;
      const memberResult = await db.from("flamme_conversation_members").insert([
        { conversation_id: conversationId, user_id: me.id },
        { conversation_id: conversationId, user_id: peer.id },
      ]);
      if (memberResult.error) throw memberResult.error;

      const key = await generateConversationKey();
      await saveConversationKey(conversationId, key);
      const wraps: any[] = [];
      const selfWrap = await wrapConversationKey(key, identity.privateKey, identity.publicJwk, conversationId);
      wraps.push({
        conversation_id: conversationId,
        recipient_user_id: me.id,
        recipient_device_id: deviceId,
        sender_device_id: deviceId,
        wrapped_key: selfWrap.wrappedKey,
        iv: selfWrap.iv,
      });
      for (const peerDevice of peerDevices as DeviceRow[]) {
        const wrapped = await wrapConversationKey(key, identity.privateKey, peerDevice.public_jwk, conversationId);
        wraps.push({
          conversation_id: conversationId,
          recipient_user_id: peer.id,
          recipient_device_id: peerDevice.id,
          sender_device_id: deviceId,
          wrapped_key: wrapped.wrappedKey,
          iv: wrapped.iv,
        });
      }
      const keyResult = await db.from("flamme_conversation_keys").insert(wraps);
      if (keyResult.error) throw keyResult.error;
      setSearch("");
      setPeople([]);
      await loadConversations();
      setSelectedId(conversationId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de commencer la conversation.");
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !selectedId || !deviceId || sending) return;
    setSending(true);
    setError(null);
    try {
      const key = await obtainConversationKey(selectedId);
      const encrypted = await encryptMessage(key, text);
      const { error: sendError } = await db.from("flamme_messages").insert({
        conversation_id: selectedId,
        sender_id: me.id,
        sender_device_id: deviceId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
      });
      if (sendError) throw sendError;
      setDraft("");
      const peerId = selected?.memberIds.find((id) => id !== me.id);
      if (peerId) {
        await db.from("flamme_notifications").insert({
          user_id: peerId,
          actor_id: me.id,
          kind: "message",
          entity_type: "conversation",
          entity_id: selectedId,
        }).catch(() => undefined);
      }
      await loadMessages(selectedId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#E6DED2] bg-[#FFFDF9] shadow-sm">
      <div className="border-b border-[#E6DED2] bg-[#172638] px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" /> Messages</div>
            <p className="mt-0.5 text-xs text-white/65">Chiffrement de bout en bout — bêta</p>
          </div>
          <span title="Le serveur ne reçoit que du texte chiffré" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold"><ShieldCheck className="h-3.5 w-3.5" /> E2E</span>
        </div>
      </div>

      {error && <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

      <div className="grid min-h-[620px] md:grid-cols-[310px_minmax(0,1fr)]">
        <aside className={`${selectedId ? "hidden md:block" : "block"} border-r border-[#E6DED2] bg-[#F6F1E8]/55`}>
          <div className="border-b border-[#E6DED2] p-3">
            <label className="flex items-center gap-2 rounded-xl border border-[#E6DED2] bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nouvelle discussion…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            {!!people.length && (
              <div className="mt-2 overflow-hidden rounded-xl border border-[#E6DED2] bg-white shadow-lg">
                {people.map((person) => (
                  <button key={person.id} type="button" onClick={() => void startConversation(person)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F6F1E8]">
                    <Avatar profile={person} small />
                    <span className="min-w-0"><strong className="block truncate text-sm">{person.display_name}</strong><span className="block truncate text-xs text-slate-500">@{person.handle}</span></span>
                    <Plus className="ml-auto h-4 w-4 text-[#CE654B]" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="max-h-[540px] overflow-y-auto p-2">
            {loading ? <p className="p-4 text-sm text-slate-500">Chargement…</p> : !conversations.length ? (
              <div className="p-6 text-center text-sm text-slate-500"><MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />Aucune discussion.<br />Recherche une personne pour commencer.</div>
            ) : conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selectedId === conversation.id ? "bg-white shadow-sm" : "hover:bg-white/70"}`}>
                <Avatar profile={conversation.peer} small />
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{conversation.peer?.display_name ?? conversation.title ?? "Discussion"}</strong><span className="block truncate text-xs text-slate-500">{conversation.peer ? `@${conversation.peer.handle}` : "Discussion de groupe"}</span></span>
              </button>
            ))}
          </div>
        </aside>

        <section className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-col bg-white`}>
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500"><div><LockKeyhole className="mx-auto mb-3 h-10 w-10 text-[#CE654B]/50" /><strong className="block text-base text-slate-800">Messages privés</strong><span>Choisis une discussion. Le serveur Flamme ne reçoit que des messages chiffrés.</span></div></div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[#E6DED2] px-3 py-3 sm:px-4">
                <button type="button" className="rounded-lg px-2 py-1 text-sm md:hidden" onClick={() => setSelectedId(null)}>←</button>
                <Avatar profile={selected.peer} small />
                <div className="min-w-0"><strong className="block truncate text-sm">{selected.peer?.display_name ?? selected.title ?? "Discussion"}</strong><span className="text-xs text-slate-500">{selected.peer ? `@${selected.peer.handle}` : "Discussion"}</span></div>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><LockKeyhole className="h-3 w-3" /> chiffré</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-[#F6F1E8]/40 p-3 sm:p-5">
                {messages.map((message) => {
                  const own = message.sender_id === me.id;
                  return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${own ? "rounded-br-md bg-[#CE654B] text-white" : "rounded-bl-md bg-white text-slate-900"}`}><p className="whitespace-pre-wrap break-words">{message.text}</p><p className={`mt-1 text-right text-[10px] ${own ? "text-white/70" : "text-slate-400"}`}>{timeLabel(message.created_at)}</p></div></div>;
                })}
                {!messages.length && <p className="py-12 text-center text-sm text-slate-400">Début de la conversation chiffrée.</p>}
              </div>
              <form className="flex gap-2 border-t border-[#E6DED2] bg-white p-3" onSubmit={(event) => { event.preventDefault(); void send(); }}>
                <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} placeholder="Écrire un message…" className="min-w-0 flex-1 rounded-full border border-[#E6DED2] bg-[#F6F1E8]/45 px-4 py-2.5 text-sm outline-none focus:border-[#CE654B]" />
                <button type="submit" disabled={!draft.trim() || sending} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172638] text-white disabled:opacity-40" aria-label="Envoyer"><Send className="h-4 w-4" /></button>
              </form>
            </>
          )}
        </section>
      </div>
      <div className="border-t border-[#E6DED2] bg-[#F6F1E8]/65 px-4 py-3 text-[11px] leading-relaxed text-slate-600">
        <strong>Bêta sécurité :</strong> la clé privée reste sur cet appareil. Un nouvel appareil ne peut lire l’historique que s’il possède une clé de conversation enveloppée pour lui. Si la clé locale est perdue, Flamme ne prétend pas pouvoir récupérer les anciens messages. Mistral n’accède jamais automatiquement au contenu déchiffré.
      </div>
    </div>
  );
}
