import { useState } from "react";
import { Check, Facebook, Linkedin, Link2, Mail, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const SITE_URL = "https://www.angel-leclerc.fr";

type Props = {
  title: string;
  slug: string;
  excerpt?: string | null;
  className?: string;
};

export function ShareArticle({ title, slug, excerpt, className }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/articles/${slug}`
      : `${SITE_URL}/articles/${slug}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: excerpt ?? title, url });
      } catch {
        /* partage annulé */
      }
      return;
    }
    setOpen(true);
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
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      icon: Linkedin,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      icon: Facebook,
    },
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${enc(`${title} ${url}`)}`,
      icon: MessageCircle,
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      icon: Send,
    },
    {
      label: "E-mail",
      href: `mailto:?subject=${enc(title)}&body=${enc(`${excerpt ? excerpt + "\n\n" : ""}${url}`)}`,
      icon: Mail,
    },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <div className={className}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Partager cet article"
            onClick={(e) => {
              if (typeof navigator !== "undefined" && "share" in navigator) {
                e.preventDefault();
                void handleNativeShare();
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            <Share2 className="h-4 w-4 text-primary" /> Partager
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start" className="w-52">
        {links.map((l) => (
          <DropdownMenuItem key={l.label} asChild>
            <a href={l.href} target="_blank" rel="noreferrer" className="cursor-pointer">
              <l.icon className="mr-2 h-4 w-4 text-primary" /> {l.label}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => void handleCopy()} className="cursor-pointer">
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-primary" />
          ) : (
            <Link2 className="mr-2 h-4 w-4 text-primary" />
          )}
          Copier le lien
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}