import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

const footerLinks = [
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "À propos" },
  { to: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container-tight py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="font-display text-xl font-bold tracking-tight text-foreground">
              Conseil & Création
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Accompagnement sur mesure pour entreprises et entrepreneurs. Stratégie, design et développement au service de vos projets.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-foreground">Navigation</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-foreground">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail size={16} className="mt-0.5 text-primary" />
                <span>contact@exemple.fr</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone size={16} className="mt-0.5 text-primary" />
                <span>06 12 34 56 78</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={16} className="mt-0.5 text-primary" />
                <span>Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Conseil & Création. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link to="/mentions-legales" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Mentions légales
            </Link>
            <Link to="/politique-confidentialite" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
