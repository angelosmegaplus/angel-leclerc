import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Linkedin, Instagram, Facebook, LogIn, Home, Briefcase, Route, FileText, Mail } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeController";
import { SearchBar } from "@/components/SearchBar";

const navLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/entreprise", label: "Entreprise", icon: Briefcase },
  { href: "/parcours", label: "Parcours", icon: Route },
  { href: "/articles", label: "Blog", icon: FileText },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-tight flex h-16 items-center justify-between gap-4 sm:gap-8">
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

        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.href}
                initial={isHome ? { opacity: 0, y: -8, scale: 0.6 } : false}
                animate={isHome ? { opacity: 1, y: 0, scale: 1 } : undefined}
                transition={isHome ? { duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] } : undefined}
                className="group relative"
              >
                <Link
                  to={link.href}
                  activeOptions={{ exact: link.href === "/" }}
                  activeProps={{ className: "text-foreground bg-muted" }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={link.label}
                >
                  <Icon size={18} className="transition-transform duration-200 group-hover:scale-110 group-active:scale-90" />
                </Link>
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                  {link.label}
                </span>
              </motion.div>
            );
          })}
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
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} to={link.href} activeOptions={{ exact: link.href === "/" }} activeProps={{ className: "text-primary font-medium" }} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-base py-2 text-foreground hover:text-primary transition-colors">
                  <Icon size={20} className="text-muted-foreground" />
                  {link.label}
                </Link>
              );
            })}
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
