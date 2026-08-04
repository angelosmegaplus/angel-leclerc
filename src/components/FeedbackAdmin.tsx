import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  listFeedback,
  deleteFeedback,
  updateFeedbackPayment,
  saveFeedbackSettings,
} from "@/lib/feedback.functions";
import {
  CONTENT_TYPE_LABELS,
  DEFAULT_QUESTIONS,
  euros,
  type FeedbackContentType,
} from "@/lib/feedback";

type Row = {
  id: string;
  content_type: string;
  content_key: string;
  content_title: string | null;
  rating: number;
  comment: string | null;
  email: string | null;
  support_amount_cents: number | null;
  payment_status: string;
  paid_amount_cents: number | null;
  payment_reference: string | null;
  created_at: string;
};

type Form = {
  enabled: boolean;
  supportEnabled: boolean;
  commentEnabled: boolean;
  publicDisplay: "none" | "average" | "average_count";
  minRatingForSupport: number;
  amounts: string;
  minAmount: string;
  links: Record<string, string>;
  questions: Record<string, string>;
  disabledPaths: string;
};

function centsList(value: string): number[] {
  return value
    .split(/[,\s]+/)
    .map((v) => Math.round(Number(v.replace(",", ".")) * 100))
    .filter((v) => Number.isFinite(v) && v >= 100);
}

export function FeedbackAdmin() {
  const load = useServerFn(listFeedback);
  const remove = useServerFn(deleteFeedback);
  const updatePayment = useServerFn(updateFeedbackPayment);
  const saveSettings = useServerFn(saveFeedbackSettings);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () => load(),
  });

  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "comments" | "support">("all");

  useEffect(() => {
    const s = data?.settings;
    if (!s || form) return;
    const amounts = Array.isArray(s.amounts_cents) ? (s.amounts_cents as number[]) : [];
    const links = (s.revolut_links ?? {}) as Record<string, string>;
    const questions = (s.questions ?? {}) as Record<string, string>;
    setForm({
      enabled: s.enabled,
      supportEnabled: s.support_enabled,
      commentEnabled: s.comment_enabled,
      publicDisplay: s.public_display as Form["publicDisplay"],
      minRatingForSupport: s.min_rating_for_support,
      amounts: amounts.map((c) => c / 100).join(", "),
      minAmount: String((s.min_amount_cents ?? 100) / 100),
      links: { ...links },
      questions: { ...DEFAULT_QUESTIONS, ...questions },
      disabledPaths: (Array.isArray(s.disabled_paths) ? (s.disabled_paths as string[]) : []).join(
        "\n",
      ),
    });
  }, [data, form]);

  const rows = (data?.rows ?? []) as Row[];

  const stats = useMemo(() => {
    const count = rows.length;
    const avg = count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;
    const paid = rows.filter((r) => r.payment_status === "paid");
    const totalPaid = paid.reduce((s, r) => s + (r.paid_amount_cents ?? 0), 0);
    const intents = rows.filter((r) => r.support_amount_cents).length;
    const byRating = [1, 2, 3, 4, 5].map((v) => rows.filter((r) => r.rating === v).length);
    return {
      count,
      avg,
      paidCount: paid.length,
      totalPaid,
      conversion: count ? Math.round((intents / count) * 100) : 0,
      byRating,
    };
  }, [rows]);

  const visible = rows.filter((r) =>
    filter === "comments" ? Boolean(r.comment) : filter === "support" ? r.support_amount_cents : true,
  );

  const amountKeys = form ? centsList(form.amounts) : [];

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await saveSettings({
        data: {
          enabled: form.enabled,
          supportEnabled: form.supportEnabled,
          commentEnabled: form.commentEnabled,
          publicDisplay: form.publicDisplay,
          minRatingForSupport: form.minRatingForSupport,
          amountsCents: centsList(form.amounts),
          minAmountCents: Math.max(100, Math.round(Number(form.minAmount.replace(",", ".")) * 100)),
          revolutLinks: form.links,
          questions: form.questions,
          confirmationTexts: {},
          disabledPaths: form.disabledPaths
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean),
        },
      });
      toast.success("Réglages enregistrés");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Avis reçus", String(stats.count)],
          ["Note moyenne", stats.count ? `${stats.avg.toFixed(1)}/5` : "—"],
          ["Contributions reçues", `${stats.paidCount} · ${euros(stats.totalPaid)}`],
          ["Taux de passage au soutien", `${stats.conversion} %`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Répartition des notes</p>
        <div className="mt-3 space-y-2">
          {[5, 4, 3, 2, 1].map((v) => {
            const n = stats.byRating[v - 1] ?? 0;
            const pct = stats.count ? (n / stats.count) * 100 : 0;
            return (
              <div key={v} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-muted-foreground">{v} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-display text-base font-bold text-foreground">Réglages</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["enabled", "Activer les avis sur le site"],
              ["commentEnabled", "Autoriser les commentaires"],
              ["supportEnabled", "Proposer le soutien financier"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
          <div>
            <Label className="text-sm">Affichage public de la note</Label>
            <select
              value={form.publicDisplay}
              onChange={(e) =>
                setForm({ ...form, publicDisplay: e.target.value as Form["publicDisplay"] })
              }
              className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="none">Ne rien afficher</option>
              <option value="average">Moyenne seule</option>
              <option value="average_count">Moyenne et nombre d'avis</option>
            </select>
          </div>
          <div>
            <Label className="text-sm">Note minimale pour proposer le soutien</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={form.minRatingForSupport}
              onChange={(e) =>
                setForm({ ...form, minRatingForSupport: Number(e.target.value) || 3 })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm">Montants proposés (en €, séparés par une virgule)</Label>
            <Input
              value={form.amounts}
              onChange={(e) => setForm({ ...form, amounts: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm">Montant minimum (€)</Label>
            <Input
              value={form.minAmount}
              onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-foreground">Liens de paiement Revolut</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Créez un lien de paiement Revolut pour chaque montant, puis collez-le ici. Le lien
            « montant libre » permet au visiteur de saisir la somme de son choix.
          </p>
          <div className="mt-3 space-y-3">
            {[...amountKeys.map(String), "custom"].map((key) => (
              <div key={key} className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
                <Label className="text-sm">
                  {key === "custom" ? "Montant libre" : euros(Number(key))}
                </Label>
                <Input
                  value={form.links[key] ?? ""}
                  placeholder="https://checkout.revolut.com/..."
                  onChange={(e) =>
                    setForm({ ...form, links: { ...form.links, [key]: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(Object.keys(DEFAULT_QUESTIONS) as FeedbackContentType[]).map((type) => (
            <div key={type}>
              <Label className="text-sm">Question — {CONTENT_TYPE_LABELS[type]}</Label>
              <Input
                value={form.questions[type] ?? ""}
                onChange={(e) =>
                  setForm({ ...form, questions: { ...form.questions, [type]: e.target.value } })
                }
                className="mt-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Label className="text-sm">
            Contenus sans avis (une clé par ligne, ex. /articles/mon-article)
          </Label>
          <Textarea
            value={form.disabledPaths}
            rows={3}
            onChange={(e) => setForm({ ...form, disabledPaths: e.target.value })}
            className="mt-2"
          />
        </div>

        <Button className="mt-5" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les réglages
        </Button>
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Tous les avis"],
              ["comments", "Avec commentaire"],
              ["support", "Avec soutien"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
          )}
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        size={14}
                        className={
                          v <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                        }
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CONTENT_TYPE_LABELS[r.content_type as FeedbackContentType] ?? r.content_type} ·{" "}
                    {r.content_title || r.content_key}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("fr-FR")}
                </span>
              </div>

              {r.comment && (
                <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">{r.comment}</p>
              )}
              {r.email && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Contact : <a href={`mailto:${r.email}`} className="underline">{r.email}</a>
                </p>
              )}

              {r.support_amount_cents ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs">
                  <span className="text-muted-foreground">
                    Soutien annoncé : {euros(r.support_amount_cents)} · statut {r.payment_status}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updatePayment({
                          data: {
                            id: r.id,
                            status: "paid",
                            paidAmountCents: r.support_amount_cents,
                            reference: r.payment_reference ?? "",
                          },
                        });
                        toast.success("Marqué comme reçu");
                        refetch();
                      }}
                    >
                      Marquer reçu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updatePayment({ data: { id: r.id, status: "cancelled" } });
                        toast.success("Marqué comme annulé");
                        refetch();
                      }}
                    >
                      Annulé
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Supprimer cet avis ?")) return;
                    await remove({ data: { id: r.id } });
                    toast.success("Avis supprimé");
                    refetch();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}