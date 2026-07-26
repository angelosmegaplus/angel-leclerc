import { useState } from "react";
import { Menu, X, Linkedin, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/entreprise", label: "Entreprise" },
  { href: "/parcours", label: "Parcours" },
  { href: "/entreprise#contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-tight flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo Angel Leclerc Communication"
            className="h-9 w-9 rounded-md object-cover"
            width={36}
            height={36}
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
            Angel Leclerc <span className="text-primary">Communication</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/angel-leclerc-communication/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn Angel Leclerc Communication"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram Angel Leclerc Communication"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.facebook.com/share/1LFGicX7qF/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Facebook Angel Leclerc Communication"
            >
              <Facebook size={20} />
            </a>
          </div>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href="/entreprise#contact">Parler de votre projet</a>
          </Button>
        </nav>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-tight flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base py-2 text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="grid grid-cols-3 gap-3 py-2">
              <a
                href="https://www.linkedin.com/company/angel-leclerc-communication/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn Angel Leclerc Communication"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg=="
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-foreground hover:text-primary transition-colors"
                aria-label="Instagram Angel Leclerc Communication"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/share/1LFGicX7qF/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-foreground hover:text-primary transition-colors"
                aria-label="Facebook Angel Leclerc Communication"
              >
                <Facebook size={18} />
              </a>
            </div>
            <Button
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setMobileOpen(false)}
            >
              <a href="/entreprise#contact">Parler de votre projet</a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
