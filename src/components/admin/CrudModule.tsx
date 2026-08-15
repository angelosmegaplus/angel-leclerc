import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "./AdminShell";
import { AdminStatus, type AdminStatusTone } from "./AdminStatus";
import {
  deleteRow,
  listRows,
  logActivity,
  str,
  tagsOf,
  upsertRow,
  type AngelTable,
  type Field,
  type Row,
} from "@/lib/angelos";

function emptyValues(fields: Field[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "tags") out[f.name] = [];
    else if (f.type === "select") out[f.name] = f.options?.[0]?.value ?? "";
    else out[f.name] = "";
  }
  return out;
}

function toFormValues(fields: Field[], row: Row): Record<string, unknown> {
  const out = emptyValues(fields);
  for (const f of fields) {
    const v = row[f.name];
    if (f.type === "tags") out[f.name] = tagsOf(row, f.name);
    else if (f.type === "datetime" && typeof v === "string") out[f.name] = v.slice(0, 16);
    else out[f.name] = v ?? "";
  }
  return out;
}

function toPayload(fields: Field[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "tags") out[f.name] = Array.isArray(v) ? v : [];
    else if (f.type === "number") out[f.name] = v === "" || v == null ? null : Number(v);
    else if (typeof v === "string") out[f.name] = v.trim() === "" ? null : v.trim();
    else out[f.name] = v ?? null;
  }
  return out;
}

function statusTone(value: string): AdminStatusTone {
  const normalized = value.toLowerCase();
  if (/refus|erreur|error|echec|échec|annul|supprim|bloqu/.test(normalized)) return "error";
  if (/termin|termine|valid|accept|publ|ready|success|fini|resolu|résolu/.test(normalized)) return "success";
  if (/cours|running|progress|traitement|actif/.test(normalized)) return "info";
  return "pending";
}

export function CrudModule({
  table,
  title,
  description,
  fields,
  titleField,
  subtitleFields = [],
  statusField,
  filters,
  duplicateKeys,
  renderExtra,
  entityLabel,
}: {
  table: AngelTable;
  title: string;
  description: string;
  fields: Field[];
  titleField: string;
  subtitleFields?: string[];
  statusField?: string;
  filters?: { label: string; test: (row: Row) => boolean }[];
  duplicateKeys?: string[];
  renderExtra?: (row: Row) => React.ReactNode;
  entityLabel: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(() => emptyValues(fields));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("Tous");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["angel", table],
    queryFn: () => listRows(table),
  });

  const statusLabel = (row: Row) => {
    if (!statusField) return "";
    const field = fields.find((item) => item.name === statusField);
    const value = str(row, statusField);
    return field?.options?.find((option) => option.value === value)?.label ?? value;
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) list = list.filter((row) => fields.some((field) => str(row, field.name).toLowerCase().includes(q)));
    const active = filters?.find((item) => item.label === filter);
    if (active) list = list.filter(active.test);
    return list;
  }, [rows, query, filter, filters, fields]);

  const duplicates = useMemo(() => {
    if (!duplicateKeys || editing === null) return [] as Row[];
    const currentId = editing === "new" ? null : editing.id;
    return rows.filter((row) => row.id !== currentId && duplicateKeys.some((key) => {
      const value = String(values[key] ?? "").trim().toLowerCase();
      return value.length > 1 && str(row, key).toLowerCase() === value;
    }));
  }, [rows, values, duplicateKeys, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const id = editing && editing !== "new" ? editing.id : null;
      const row = await upsertRow(table, toPayload(fields, values), id);
      await logActivity(id ? "update" : "create", table, row.id, { title: str(row, titleField) });
      return row;
    },
    onSuccess: () => {
      toast.success(`${entityLabel} enregistré${entityLabel.endsWith("e") ? "e" : ""}.`);
      void qc.invalidateQueries({ queryKey: ["angel", table] });
      void qc.invalidateQueries({ queryKey: ["angel", "activity_log"] });
      setEditing(null);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Enregistrement impossible"),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      await deleteRow(table, row.id);
      await logActivity("delete", table, row.id, { title: str(row, titleField) });
    },
    onSuccess: () => {
      toast.success("Supprimé.");
      void qc.invalidateQueries({ queryKey: ["angel", table] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Suppression impossible"),
  });

  const openNew = () => {
    setValues(emptyValues(fields));
    setEditing("new");
  };

  if (editing) {
    return (
      <AdminCard title={editing === "new" ? `Nouveau — ${title}` : `Modifier — ${title}`}>
        {duplicates.length > 0 ? (
          <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white">Doublon possible</p>
              <ul className="mt-1 text-white/55">
                {duplicates.slice(0, 3).map((duplicate) => <li key={duplicate.id}>• {str(duplicate, titleField)}</li>)}
              </ul>
            </div>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const id = `${table}-${field.name}`;
              const value = values[field.name];
              return (
                <div key={field.name} className={`space-y-1.5 ${field.full || field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>
                  {field.type === "textarea" ? (
                    <Textarea id={id} rows={4} required={field.required} value={String(value ?? "")} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
                  ) : field.type === "select" ? (
                    <select id={id} value={String(value ?? "")} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : field.type === "tags" ? (
                    <Input id={id} placeholder="séparées par des virgules" value={(Array.isArray(value) ? value : []).join(", ")} onChange={(event) => setValues({ ...values, [field.name]: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
                  ) : (
                    <Input
                      id={id}
                      required={field.required}
                      type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : field.type}
                      value={String(value ?? "")}
                      onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                    />
                  )}
                  {field.help ? <p className="text-[11px] text-muted-foreground">{field.help}</p> : null}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-11" disabled={save.isPending}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enregistrer</Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </form>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-4">
      <AdminCard title={title} description={description}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={openNew} className="min-h-11 shrink-0"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher…" className="h-11 pl-9" aria-label={`Rechercher dans ${title}`} />
          </div>
        </div>
        {filters?.length ? (
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["Tous", ...filters.map((item) => item.label)].map((label) => (
              <button key={label} type="button" onClick={() => setFilter(label)} aria-pressed={filter === label} className={`min-h-10 shrink-0 rounded-xl border px-3 text-xs font-semibold transition ${filter === label ? "border-red-500/35 bg-red-500/15 text-red-100" : "border-white/10 bg-white/[.025] text-white/50 hover:border-red-500/20 hover:text-white"}`}>{label}</button>
            ))}
          </div>
        ) : null}
      </AdminCard>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Aucun élément pour l'instant.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => {
            const label = statusField ? statusLabel(row) : "";
            const rawStatus = statusField ? str(row, statusField) : "";
            return (
              <li key={row.id} className="rounded-xl border border-white/10 bg-white/[.02] p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 break-words text-sm font-semibold text-white sm:text-base">{str(row, titleField) || "Sans titre"}</p>
                      {statusField ? <AdminStatus tone={statusTone(`${rawStatus} ${label}`)} compact>{label || rawStatus || "État inconnu"}</AdminStatus> : null}
                    </div>
                    {subtitleFields.length > 0 ? <p className="mt-1 text-xs leading-relaxed text-white/45 sm:text-sm">{subtitleFields.map((key) => str(row, key)).filter(Boolean).join(" · ")}</p> : null}
                    {renderExtra?.(row)}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" className="min-h-11 min-w-11 rounded-xl" aria-label={`Modifier ${str(row, titleField) || entityLabel}`} onClick={() => { setValues(toFormValues(fields, row)); setEditing(row); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="min-h-11 min-w-11 rounded-xl" aria-label={`Supprimer ${str(row, titleField) || entityLabel}`} onClick={() => { if (confirm(`Supprimer « ${str(row, titleField)} » ?`)) remove.mutate(row); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
