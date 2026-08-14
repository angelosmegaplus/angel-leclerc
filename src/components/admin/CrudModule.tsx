import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "./AdminShell";
import { type AngelTable, type Field, type Row } from "@/lib/angelos";
import { deleteRow, listRows, logActivity, str, tagsOf, upsertRow } from "@/lib/angelos-native";

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
    const f = fields.find((x) => x.name === statusField);
    const v = str(row, statusField);
    return f?.options?.find((o) => o.value === v)?.label ?? v;
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) list = list.filter((r) => fields.some((f) => str(r, f.name).toLowerCase().includes(q)));
    const active = filters?.find((f) => f.label === filter);
    if (active) list = list.filter(active.test);
    return list;
  }, [rows, query, filter, filters, fields]);

  const duplicates = useMemo(() => {
    if (!duplicateKeys || editing === null) return [] as Row[];
    const currentId = editing === "new" ? null : editing.id;
    return rows.filter((r) =>
      r.id !== currentId && duplicateKeys.some((k) => {
        const a = String(values[k] ?? "").trim().toLowerCase();
        return a.length > 1 && str(r, k).toLowerCase() === a;
      }),
    );
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
      qc.invalidateQueries({ queryKey: ["angel", table] });
      qc.invalidateQueries({ queryKey: ["angel", "activity_log"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Enregistrement impossible"),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      await deleteRow(table, row.id);
      await logActivity("delete", table, row.id, { title: str(row, titleField) });
    },
    onSuccess: () => {
      toast.success("Supprimé.");
      qc.invalidateQueries({ queryKey: ["angel", table] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Suppression impossible"),
  });

  const openNew = () => {
    setValues(emptyValues(fields));
    setEditing("new");
  };

  if (editing) {
    return (
      <AdminCard title={editing === "new" ? `Nouveau — ${title}` : `Modifier — ${title}`}>
        {duplicates.length > 0 && (
          <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-foreground">Doublon possible</p>
              <ul className="mt-1 text-muted-foreground">
                {duplicates.slice(0, 3).map((d) => <li key={d.id}>• {str(d, titleField)}</li>)}
              </ul>
            </div>
          </div>
        )}
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `${table}-${f.name}`;
              const v = values[f.name];
              return (
                <div key={f.name} className={`space-y-1.5 ${f.full || f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={id}>{f.label}{f.required && " *"}</Label>
                  {f.type === "textarea" ? (
                    <Textarea id={id} rows={4} required={f.required} value={String(v ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                  ) : f.type === "select" ? (
                    <select id={id} value={String(v ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "tags" ? (
                    <Input id={id} placeholder="séparées par des virgules" value={(Array.isArray(v) ? v : []).join(", ")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                  ) : (
                    <Input id={id} required={f.required} type={f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : f.type} value={String(v ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                  )}
                  {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-11" disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </form>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-4">
      <AdminCard title={title} description={description}>
        <div className="flex flex-col gap-3">
          <Button onClick={openNew} className="min-h-11 sm:self-start"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="h-11 pl-9" aria-label={`Rechercher dans ${title}`} />
          </div>
          {filters && filters.length > 0 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["Tous", ...filters.map((f) => f.label)].map((label) => (
                <button key={label} type="button" onClick={() => setFilter(label)} className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-medium ${filter === label ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground"}`}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </AdminCard>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucun élément pour l'instant.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => (
            <li key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{str(row, titleField) || "Sans titre"}</p>
                  {subtitleFields.length > 0 && <p className="mt-0.5 text-sm text-muted-foreground">{subtitleFields.map((k) => str(row, k)).filter(Boolean).join(" · ")}</p>}
                  {statusField && <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/70">{statusLabel(row)}</span>}
                  {renderExtra?.(row)}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="min-h-11 min-w-11" aria-label="Modifier" onClick={() => { setValues(toFormValues(fields, row)); setEditing(row); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="min-h-11 min-w-11" aria-label="Supprimer" onClick={() => { if (confirm(`Supprimer « ${str(row, titleField)} » ?`)) remove.mutate(row); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
