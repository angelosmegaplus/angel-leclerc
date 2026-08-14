import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clipboard, Globe2, Loader2, RefreshCw, Server, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDomain, listDomains, removeDomain, verifyDomain } from "@/lib/domains.functions";

type Verification = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof verifyDomain>>>>;

function CopyValue({ value }: { value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <code className="min-w-0 flex-1 truncate text-xs text-foreground">{value}</code>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 shrink-0 px-2"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          toast.success("Copié");
        }}
      >
        <Clipboard className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function StatusPill({ ok, pending, labelOk, labelPending }: { ok: boolean; pending?: boolean; labelOk: string; labelPending: string }) {
  if (pending) return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Vérification…</span>;
  return ok
    ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"><CheckCircle2 className="h-3 w-3" /> {labelOk}</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700"><TriangleAlert className="h-3 w-3" /> {labelPending}</span>;
}

export function DomainsPanel() {
  const queryClient = useQueryClient();
  const load = useServerFn(listDomains);
  const add = useServerFn(addDomain);
  const remove = useServerFn(removeDomain);
  const verify = useServerFn(verifyDomain);
  const [domain, setDomain] = useState("");
  const [checks, setChecks] = useState<Record<string, any>>({});
  const [checking, setChecking] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["angel-domains"],
    queryFn: () => load(),
  });

  const targets = data?.targets;
  const records = useMemo(() => {
    const rows: Array<{ type: string; name: string; value: string; note: string }> = [];
    if (targets?.ipv4) rows.push({ type: "A", name: "@", value: targets.ipv4, note: "Fait pointer le domaine principal vers le serveur Angel OS." });
    if (targets?.ipv6) rows.push({ type: "AAAA", name: "@", value: targets.ipv6, note: "Version IPv6 du serveur, si votre registrar la prend en charge." });
    if (targets?.canonical) rows.push({ type: "CNAME", name: "www", value: targets.canonical, note: "Relie www à l'adresse canonique du serveur." });
    return rows;
  }, [targets]);

  const addMutation = useMutation({
    mutationFn: async () => add({ data: { domain } }),
    onSuccess: async (result) => {
      setDomain("");
      toast.success(`${result.domain} ajouté`);
      await queryClient.invalidateQueries({ queryKey: ["angel-domains"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Domaine invalide"),
  });

  async function runCheck(name: string) {
    setChecking(name);
    try {
      const result = await verify({ data: { domain: name } });
      setChecks((previous) => ({ ...previous, [name]: result }));
      if (result.dnsOk && result.httpsOk) toast.success("Domaine correctement connecté");
      else toast.info("La configuration n'est pas encore complète");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vérification impossible");
    } finally {
      setChecking(null);
    }
  }

  return (
    <div className="space-y-5">
      <AdminCard
        title="Domaines"
        description="Connectez un nom de domaine à Angel OS sans toucher à la configuration Linux. L'assistant vous indique exactement quoi copier chez votre registrar."
      >
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (domain.trim()) addMutation.mutate();
          }}
        >
          <Input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="exemple.fr"
            autoCapitalize="none"
            autoCorrect="off"
            className="min-h-11"
          />
          <Button type="submit" disabled={addMutation.isPending || !domain.trim()} className="min-h-11 shrink-0">
            {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe2 className="mr-2 h-4 w-4" />}
            Ajouter le domaine
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Vous pouvez écrire le domaine simplement, par exemple <strong>angel-leclerc.fr</strong>. Pas besoin d'ajouter https:// ou www.
        </p>
      </AdminCard>

      <AdminCard title="1. Ce qu'il faut copier" description="Ouvrez la zone DNS de votre fournisseur de domaine puis ajoutez les lignes ci-dessous.">
        {records.length === 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <p className="font-medium text-foreground">Adresse publique du serveur non renseignée.</p>
            <p className="mt-1 text-muted-foreground">Angel OS doit recevoir ANGEL_PUBLIC_IPV4 et/ou ANGEL_DOMAIN_TARGET sur le serveur Linux. Une fois renseigné, les valeurs à copier apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={`${record.type}-${record.name}`} className="rounded-xl border border-border bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-[80px_100px_1fr]">
                  <div><p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Type</p><p className="mt-1 font-semibold">{record.type}</p></div>
                  <div><p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Nom</p><p className="mt-1 font-semibold">{record.name}</p></div>
                  <div><p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Valeur</p><div className="mt-1"><CopyValue value={record.value} /></div></div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{record.note}</p>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="2. Vérifier la connexion" description="Après avoir enregistré les DNS, cliquez sur Vérifier. La propagation peut prendre quelques minutes ou parfois plusieurs heures.">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
        ) : !data?.domains.length ? (
          <p className="text-sm text-muted-foreground">Ajoutez d'abord un domaine ci-dessus.</p>
        ) : (
          <div className="space-y-3">
            {data.domains.map((item) => {
              const check = checks[item.domain];
              const busy = checking === item.domain;
              return (
                <div key={item.domain} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{item.domain}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill ok={Boolean(check?.dnsOk)} pending={busy} labelOk="DNS connecté" labelPending="DNS à vérifier" />
                        <StatusPill ok={Boolean(check?.httpsOk)} pending={busy} labelOk="HTTPS actif" labelPending="HTTPS en attente" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="min-h-10" disabled={busy} onClick={() => runCheck(item.domain)}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Vérifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-10"
                        aria-label={`Supprimer ${item.domain}`}
                        onClick={async () => {
                          if (!confirm(`Retirer ${item.domain} d'Angel OS ?`)) return;
                          await remove({ data: { domain: item.domain } });
                          setChecks((previous) => {
                            const next = { ...previous };
                            delete next[item.domain];
                            return next;
                          });
                          await queryClient.invalidateQueries({ queryKey: ["angel-domains"] });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {check && (
                    <div className="mt-4 rounded-lg border border-border/70 bg-card p-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Diagnostic Angel OS</p>
                      <p className="mt-1">A trouvé : A {check.found.a.length ? check.found.a.join(", ") : "—"} · AAAA {check.found.aaaa.length ? check.found.aaaa.join(", ") : "—"} · CNAME {check.found.cname.length ? check.found.cname.join(", ") : "—"}</p>
                      {!check.dnsOk && <p className="mt-2">Le domaine ne pointe pas encore vers ce serveur. Vérifiez les valeurs DNS ci-dessus puis réessayez.</p>}
                      {check.dnsOk && !check.httpsOk && <p className="mt-2">Le DNS est bon. Le certificat HTTPS peut encore être en cours d'émission par Caddy.</p>}
                      {check.dnsOk && check.httpsOk && <p className="mt-2 font-medium text-primary">Tout est bon : le domaine et HTTPS répondent correctement.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard title="DNS" description="Le domaine sait où se trouve Angel OS."><Server className="h-5 w-5 text-muted-foreground" /></AdminCard>
        <AdminCard title="HTTPS" description="Caddy émet et renouvelle automatiquement le certificat."><ShieldCheck className="h-5 w-5 text-muted-foreground" /></AdminCard>
        <AdminCard title="Sans jargon" description="L'interface vous dit quoi copier et ce qui bloque."><Globe2 className="h-5 w-5 text-muted-foreground" /></AdminCard>
      </div>
    </div>
  );
}
