import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Check, ListTodo, Plus, Trash2 } from "lucide-react";
import { addAiMemory, addChatGptTask, archiveAiMemory, getAiMemoryState, resolveChatGptTask } from "@/lib/ai-memory.functions";

export function AIMemoryPanel() {
  const loadState = useServerFn(getAiMemoryState);
  const addMemory = useServerFn(addAiMemory);
  const archiveMemory = useServerFn(archiveAiMemory);
  const addTask = useServerFn(addChatGptTask);
  const resolveTask = useServerFn(resolveChatGptTask);
  const [state, setState] = useState<any>({ memory: [], queue: [] });
  const [scope, setScope] = useState<"public" | "private">("private");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try { setState(await loadState()); } catch { /* panneau non bloquant */ }
  }
  useEffect(() => { void refresh(); }, []);

  async function saveMemory() {
    if (title.trim().length < 2 || content.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      await addMemory({ data: { scope, title, content } });
      setTitle("");
      setContent("");
      await refresh();
    } finally { setBusy(false); }
  }

  async function saveTask() {
    if (task.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      await addTask({ data: { title: task, description: "Tâche ajoutée depuis la mémoire Angel OS IA pour traitement via ChatGPT." } });
      setTask("");
      await refresh();
    } finally { setBusy(false); }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2" aria-label="Mémoire et file ChatGPT">
      <div className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Brain className="h-5 w-5" /></span>
          <div className="min-w-0"><h2 className="font-semibold text-white">Mémoire Angel OS IA</h2><p className="text-xs text-white/45">Contexte relu automatiquement avant les réponses.</p></div>
        </div>
        <div className="mt-4 grid gap-2">
          <select value={scope} onChange={(event) => setScope(event.target.value as "public" | "private")} className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
            <option value="private">Privé · administration uniquement</option>
            <option value="public">Public · assistant du site</option>
          </select>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre court" className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} placeholder="Ex. priorité actuelle, changement important, information à connaître…" className="resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <button type="button" onClick={() => void saveMemory()} disabled={busy || title.trim().length < 2 || content.trim().length < 2} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-40"><Plus className="h-4 w-4" />Ajouter à la mémoire</button>
        </div>
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {(state.memory ?? []).map((item: any) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
              <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-white">{item.title}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-white/55">{item.content}</p><span className="mt-2 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/35">{item.scope === "public" ? "public" : "privé"}</span></div><button type="button" aria-label={`Archiver ${item.title}`} onClick={async () => { await archiveMemory({ data: { id: item.id } }); await refresh(); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-white/40 transition hover:border-red-500/20 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[#090b0d] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><ListTodo className="h-5 w-5" /></span>
          <div className="min-w-0"><h2 className="font-semibold text-white">File ChatGPT</h2><p className="text-xs text-white/45">Modifications, contrôles et publications encore à traiter.</p></div>
        </div>
        <div className="mt-4 flex gap-2">
          <input value={task} onChange={(event) => setTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveTask(); }} placeholder="Ex. corriger la page Contact puis publier" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          <button type="button" onClick={() => void saveTask()} disabled={busy || task.trim().length < 2} aria-label="Ajouter la tâche" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white transition hover:bg-red-400 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 max-h-[23rem] space-y-2 overflow-y-auto">
          {(state.queue ?? []).length === 0 ? <p className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/40">Aucune tâche technique en attente.</p> : null}
          {(state.queue ?? []).map((item: any) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
              <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{item.title}</p>{item.description ? <p className="mt-1 text-xs leading-relaxed text-white/45">{item.description}</p> : null}<p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-red-300/70">{item.kind === "operator_request" ? "Angel OS IA → ChatGPT" : "ChatGPT"}{item.sensitive ? " · validation requise" : ""}</p></div><button type="button" aria-label={`Marquer ${item.title} terminé`} onClick={async () => { await resolveTask({ data: { id: item.id } }); await refresh(); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/15"><Check className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
