from pathlib import Path

path = Path("src/routes/entreprise.tsx")
text = path.read_text()

old = '''  {
    icon: FolderOpen,
    eyebrow: "Portfolio",
    title: "Mes réalisations",
    text: "Découvrez des projets concrets, les missions réalisées et les résultats obtenus.",
    href: "/parcours#realisations",
    cta: "Voir les réalisations",
  },'''

new = '''  {
    icon: FolderOpen,
    eyebrow: "Portfolio créatif",
    title: "Mes créations graphiques",
    text: "950 créations Canva recensées depuis avril 2022 : logos, affiches, publications, identités visuelles et supports numériques.",
    href: "/portfolio",
    cta: "Voir le portfolio",
  },'''

if old in text:
    text = text.replace(old, new, 1)

needle = '''                    <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>'''

replacement = '''                    <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{item.title}</h3>
                    {item.href === "/portfolio" && (
                      <div data-canva-enterprise="true" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                        <span className="font-display text-2xl font-bold leading-none text-primary">950</span>
                        <span className="text-[11px] font-semibold leading-tight text-foreground">créations Canva<br />depuis avril 2022</span>
                      </div>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>'''

if 'data-canva-enterprise="true"' not in text:
    if needle not in text:
        raise SystemExit("Enterprise card JSX pattern not found")
    text = text.replace(needle, replacement, 1)

path.write_text(text)
