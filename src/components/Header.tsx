import { useState } from "react";
import { Menu, X, Linkedin, Instagram, Facebook, LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeController";
import { SearchBar } from "@/components/SearchBar";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/entreprise", label: "Entreprise" },
  { href: "/parcours", label: "Parcours" },
  { href: "/articles", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-tight flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo Angel Leclerc Communication"
            className="dark-logo-surface h-9 w-9 rounded-md object-cover"
            width={36}
            height={36}
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
            Angel Leclerc <span className="text-primary">Communication</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              activeOptions={{ exact: link.href === "/" }}
              activeProps={{ className: "text-foreground font-medium" }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3">
            <a href="https://www.linkedin.com/company/angel-leclerc-communication/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn Angel Leclerc Communication"><Linkedin size={20} /></a>
            <a href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram Angel Leclerc Communication"><Instagram size={20} /></a>
            <a href="https://www.facebook.com/share/1LFGicX7qF/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook Angel Leclerc Communication"><Facebook size={20} /></a>
          </div>
          <SearchBar />
          <ThemeToggle className="h-9 w-9 shrink-0" />
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Ouvrir l'espace administrateur"
          >
            <LogIn className="h-3.5 w-3.5" /> Espace admin
          </Link>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/contact">Parler de votre projet</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <SearchBar compact />
          <ThemeToggle className="h-10 w-10 border-transparent bg-transparent" />
          <button
            className="inline-flex h-11 w-11 items-center justify-center text-foreground"
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-tight flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} activeOptions={{ exact: link.href === "/" }} activeProps={{ className: "text-primary font-medium" }} onClick={() => setMobileOpen(false)} className="text-base py-2 text-foreground hover:text-primary transition-colors">{link.label}</Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogIn className="h-4 w-4" /> Espace admin
            </Link>
            <div className="grid grid-cols-3 gap-3 py-2">
              <a href="https://www.linkedin.com/company/angel-leclerc-communication/" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-foreground hover:text-primary transition-colors" aria-label="LinkedIn Angel Leclerc Communication"><Linkedin size={18} /></a>
              <a href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg==" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-foreground hover:text-primary transition-colors" aria-label="Instagram Angel Leclerc Communication"><Instagram size={18} /></a>
              <a href="https://www.facebook.com/share/1LFGicX7qF/" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-foreground hover:text-primary transition-colors" aria-label="Facebook Angel Leclerc Communication"><Facebook size={18} /></a>
            </div>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setMobileOpen(false)}>
              <Link to="/contact">Parler de votre projet</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
