import { Mail, MapPin, Phone } from "lucide-react";

const navLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#services", label: "Services" },
  { href: "#a-propos", label: "À propos" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card">
      <div className="container-tight py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-foreground">
              Angel Leclerc <span className="text-primary">Communication</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gestion de projet · Conseil · Rédaction
            </p>
            <p className="mt-6 text-sm italic text-muted-foreground">
              Donner du souffle à vos idées.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
              Coordonnées
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-primary" />
                <a
                  href="mailto:contact@angel-leclerc.fr"
                  className="hover:text-foreground transition-colors break-all"
                >
                  contact@angel-leclerc.fr
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-primary" />
                <a
                  href="tel:+33601766978"
                  className="hover:text-foreground transition-colors"
                >
                  06 01 76 69 78
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  25 Grande Rue<br />
                  03110 Broût-Vernet, France
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground/80">Adresse courrier</span>
                  CIAS, 4b rue Stéphane Hessel<br />
                  24200 Sarlat-la-Canéda, France
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">
            Angel Leclerc — Entrepreneur individuel
          </p>
          <p className="mt-2">
            SIREN : 106 487 192 · SIRET : 106 487 192 00010 · Code APE : 7021Z — Conseil en relations
            publiques et communication
          </p>
          <p className="mt-1">
            TVA non applicable, article 293 B du Code général des impôts.
          </p>
          <p className="mt-1">
            Paiements traités via Revolut Business.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Angel Leclerc Communication. Tous droits réservés.
            </p>
            <p className="text-muted-foreground/80">Mentions légales · Politique de confidentialité</p>
          </div>
        </div>
      </div>
    </footer>
  );
}