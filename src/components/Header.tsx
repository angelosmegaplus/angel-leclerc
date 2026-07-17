import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Accueil" },
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "À propos" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-tight flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Conseil & Création
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/contact">Me contacter</Link>
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
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-base text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Button
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setMobileOpen(false)}
            >
              <Link to="/contact">Me contacter</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
