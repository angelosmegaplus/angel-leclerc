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

if old not in text:
    raise SystemExit("Portfolio card pattern not found")

path.write_text(text.replace(old, new, 1))
