import { Linkedin, Instagram, Facebook, Settings, LockKeyhole } from "lucide-react";
import { Link } from "@tanstack/react-router";

const navLinks = [
  { to: "/", label: "Accueil" },
  { to: "/entreprise", label: "Entreprise" },
  { to: "/entreprise", hash: "services", label: "Services" },
  { to: "/parcours", label: "Parcours" },
  { to: "/articles", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function Footer() {
  return <footer className="w-full border-t border-border bg-card"><div className="container-tight py-16">
    <div className="grid gap-10 md:grid-cols-3">
      <div><p className="font-display text-lg font-bold tracking-tight text-foreground">Angel Leclerc <span className="text-primary">Communication</span></p><p className="mt-2 text-sm text-muted-foreground">Gestion de projet · Conseil · Rédaction</p><p className="mt-6 text-sm italic text-muted-foreground">Donner du souffle à vos idées.</p></div>
      <div><h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Navigation</h3><ul className="mt-4 space-y-2">{navLinks.map((link) => <li key={link.label}><Link to={link.to} hash={link.hash} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link></li>)}</ul></div>
      <div><h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Me contacter</h3><Link to="/contact" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent">Page contact</Link><h3 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-foreground">Réseaux sociaux</h3><div className="mt-4 flex flex-wrap gap-3">
        <a href="https://www.linkedin.com/company/angel-leclerc-communication/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"><Linkedin size={16} className="text-primary" />LinkedIn</a>
        <a href="https://www.instagram.com/angelof_com?igsh=MWpqMjc3Mm03MHJpYg==" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"><Instagram size={16} className="text-primary" />Instagram</a>
        <a href="https://www.facebook.com/share/1LFGicX7qF/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"><Facebook size={16} className="text-primary" />Facebook</a>
      </div></div>
    </div>

    <div className="mt-12 border-t border-border pt-8 text-xs leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">Angel Leclerc — Entrepreneur individuel</p>
      <p className="mt-2">SIREN : 106 487 192 · SIRET : 106 487 192 00010 · Code APE : 7021Z — Conseil en relations publiques et communication</p>
      <p className="mt-1">TVA non applicable, article 293 B du Code général des impôts.</p><p className="mt-1">Paiements traités via Revolut Business.</p><p className="mt-3 text-[11px] text-muted-foreground/70">Siège social : 25 Grande Rue, 03110 Broût-Vernet, France</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p>© {new Date().getFullYear()} Angel Leclerc Communication. Tous droits réservés.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/angel-os-ia" aria-label="Découvrir Angel OS" className="group relative inline-flex min-h-[58px] items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-black px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"><span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" /><span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm"><img src="/angel-os/logo.png" alt="" className="h-full w-full object-cover" /></span><span className="relative leading-tight"><span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">Propulsé par</span><span className="mt-0.5 inline-flex items-center gap-1.5 font-semibold tracking-tight text-white">Angel OS <Settings aria-hidden className="h-3.5 w-3.5 animate-spin text-primary motion-reduce:animate-none [animation-duration:5s]" /></span></span></a>
          <Link to="/angel-os-ia" aria-label="Découvrir Angel Guard OS" className="group relative inline-flex min-h-[58px] items-center gap-3 overflow-hidden rounded-2xl border border-orange-500/30 bg-black px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400/70 hover:shadow-orange-500/10"><span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-orange-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" /><span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><LockKeyhole className="h-5 w-5 text-orange-400" /></span><span className="relative leading-tight"><span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">Protégé par</span><span className="mt-0.5 inline-flex items-center gap-1.5 font-semibold tracking-tight text-white">Angel Guard OS</span></span></Link>
        </div>
      </div><p className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/mentions-legales" className="text-muted-foreground/90 underline-offset-4 transition-colors hover:text-foreground hover:underline">Mentions légales</Link><span aria-hidden className="text-muted-foreground/60">·</span><Link to="/politique-confidentialite" className="text-muted-foreground/90 underline-offset-4 transition-colors hover:text-foreground hover:underline">Politique de confidentialité</Link><span aria-hidden className="text-muted-foreground/60">·</span><Link to="/politique-cookies" className="text-muted-foreground/90 underline-offset-4 transition-colors hover:text-foreground hover:underline">Politique des cookies</Link><span aria-hidden className="text-muted-foreground/60">·</span><Link to="/boutique" className="text-muted-foreground/90 underline-offset-4 transition-colors hover:text-foreground hover:underline">Boutique</Link></p></div>
    </div>
  </div></footer>;
}
