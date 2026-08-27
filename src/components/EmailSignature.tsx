import { useMemo, useRef, useState } from "react";
import { Check, Copy, Mail, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SignatureData = {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  website: string;
};

const DEFAULT_DATA: SignatureData = {
  name: "Angel Leclerc",
  role: "Conseil & Rédaction",
  company: "Angel Leclerc Communication",
  email: "contact@angel-leclerc.fr",
  phone: "06 01 76 69 78",
  website: "www.angel-leclerc.fr",
};

/** Logo de marque existant, hébergé publiquement (monogramme AL du site). */
const LOGO_URL = "https://www.angel-leclerc.fr/icons/apple-touch-icon.png";

function buildSignatureHtml(d: SignatureData): string {
  const phoneHref = `tel:+33${d.phone.replace(/\D/g, "").replace(/^0/, "")}`;
  const siteHref = `https://${d.website.replace(/^https?:\/\//, "")}`;
  return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#181716;">
  <tr>
    <td style="padding-right:14px;vertical-align:middle;">
      <img src="${LOGO_URL}" width="80" height="80" alt="Angel Leclerc Communication" style="display:block;width:80px;height:80px;border-radius:16px;" />
    </td>
    <td style="padding-right:14px;border-right:3px solid #CE654B;vertical-align:top;">
      <div style="font-size:18px;font-weight:700;color:#181716;">${escapeHtml(d.name)}</div>
      <div style="font-size:12px;color:#CE654B;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(d.role)}</div>
      <div style="font-size:12px;color:#6b6660;margin-top:2px;">${escapeHtml(d.company)}</div>
    </td>
    <td style="padding-left:14px;vertical-align:top;font-size:12px;line-height:1.8;color:#3c3936;">
      <div>✉ <a href="mailto:${escapeHtml(d.email)}" style="color:#181716;text-decoration:none;">${escapeHtml(d.email)}</a></div>
      <div>☎ <a href="${phoneHref}" style="color:#181716;text-decoration:none;">${escapeHtml(d.phone)}</a></div>
      <div>🌐 <a href="${siteHref}" style="color:#CE654B;text-decoration:none;font-weight:600;">${escapeHtml(d.website)}</a></div>
      <div style="font-size:11px;color:#8a857f;font-style:italic;margin-top:4px;">« Donner du souffle à vos idées »</div>
    </td>
  </tr>
</table>`;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FIELDS: { key: keyof SignatureData; label: string; placeholder: string }[] = [
  { key: "name", label: "Nom", placeholder: "Angel Leclerc" },
  { key: "role", label: "Fonction", placeholder: "Conseil & Rédaction" },
  { key: "company", label: "Structure", placeholder: "Angel Leclerc Communication" },
  { key: "email", label: "Email", placeholder: "contact@angel-leclerc.fr" },
  { key: "phone", label: "Téléphone", placeholder: "06 01 76 69 78" },
  { key: "website", label: "Site web", placeholder: "www.angel-leclerc.fr" },
];

export function EmailSignature() {
  const [data, setData] = useState<SignatureData>(DEFAULT_DATA);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => buildSignatureHtml(data), [data]);

  const copyRich = async () => {
    try {
      if (navigator.clipboard && "ClipboardItem" in window) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([previewRef.current?.innerText ?? html], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
      } else if (previewRef.current) {
        // Fallback : sélection visuelle + copie exécutable
        const range = document.createRange();
        range.selectNodeContents(previewRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("copy");
        sel?.removeAllRanges();
      }
      setCopied(true);
      toast.success("Signature copiée — collez-la dans les paramètres de votre messagerie.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible, essayez de sélectionner la signature manuellement.");
    }
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success("Code HTML copié.");
    } catch {
      toast.error("Copie impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <PenLine className="h-5 w-5 text-primary" /> Signature mail
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalisez les champs puis copiez la signature pour la coller dans Gmail, Outlook ou toute messagerie.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">{field.label}</span>
              <input
                type="text"
                value={data[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => setData((d) => ({ ...d, [field.key]: e.target.value }))}
                className="min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Aperçu</p>
          <div className="rounded-2xl border border-border bg-[#FFFDF9] p-4 shadow-sm">
            <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void copyRich()} className="min-h-10">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copiée !" : "Copier la signature"}
            </Button>
            <Button variant="outline" onClick={() => void copyHtml()} className="min-h-10">
              <Mail className="mr-2 h-4 w-4" /> Copier le code HTML
            </Button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Astuce : dans Gmail, ouvrez Paramètres → Général → Signature, puis collez directement (Ctrl+V).
          </p>
        </div>
      </div>
    </div>
  );
}
