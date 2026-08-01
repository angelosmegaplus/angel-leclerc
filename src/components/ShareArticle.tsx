import { useState } from "react";
import { Check, Facebook, Linkedin, Link2, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  title: string;
  slug: string;
  excerpt?: string | null;
  className?: string;
};

export function ShareArticle({ title, slug, excerpt, className }: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/articles/${slug}`
      : `https://www.angel-leclerc.fr/articles/${slug}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: excerpt ?? title, url });
      } catch {
        /* partage annulé */
      }
      return;
    }
    void handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const enc = encodeURIComponent;
  const links = [
    {
      label: "Partager sur LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      icon: Linkedin,
    },
    {
      label: "Partager sur Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      icon: Facebook,
    },
    {
      label: "Partager par e-mail",
      href: `mailto:?subject=${enc(title)}&body=${enc(`${excerpt ? excerpt + "\n\n" : ""}${url}`)}`,
      icon: Mail,
    },
  ];

  const itemClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/60 hover:text-primary";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <Share2 className="h-4 w-4 text-primary" /> Partager
      </button>

      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          title={l.label}
          className={itemClass}
        >
          <l.icon className="h-4 w-4" />
        </a>
      ))}

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copier le lien de l'article"
        title="Copier le lien"
        className={itemClass}
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}