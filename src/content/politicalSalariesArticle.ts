export const politicalSalariesArticle = {
  id: "political-salaries-20260815",
  slug: "salaires-politiques-france-combien-coutent-elus",
  title: "Salaires des politiques : combien coûtent vraiment les élus aux Français ?",
  category: "Décryptage",
  excerpt: "Président, ministres, députés, sénateurs, maires : derrière les montants mensuels, que paie réellement le contribuable ? Décryptage en chiffres, graphiques et ordres de grandeur.",
  cover_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Palais_Bourbon_Paris_7e_001.jpg/1280px-Palais_Bourbon_Paris_7e_001.jpg",
  published: true,
  published_at: "2026-08-15T12:10:00.000Z",
  author_id: null,
  created_at: "2026-08-15T12:10:00.000Z",
  updated_at: "2026-08-15T12:10:00.000Z",
  is_private: false,
  featured: true,
  attachments: [],
  scheduled_at: null,
  topics: ["Politique & société", "Économie"],
  badges: [],
  cover_meta: { alt: "Palais Bourbon, siège de l’Assemblée nationale à Paris", credit: "Wikimedia Commons", source: "Wikimedia Commons", pageUrl: "https://commons.wikimedia.org/wiki/Category:Palais_Bourbon", license: "Wikimedia Commons" },
  sources: [
    { label: "Légifrance — rémunération du Président et des membres du Gouvernement", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000026310466/" },
    { label: "Assemblée nationale — situation matérielle du député", url: "https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute" },
    { label: "Assemblée nationale — budget 2026", url: "https://www.assemblee-nationale.fr/dyn/17/divers/budget/Presentation-Budget-AN-2026.html" },
    { label: "Sénat — indemnité parlementaire", url: "https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/lindemnite-parlementaire.html" },
    { label: "Sénat — frais de mandat", url: "https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/les-frais-de-mandat.html" },
    { label: "Collectivités locales — indemnités des élus locaux", url: "https://www.collectivites-locales.gouv.fr/connaitre-les-acteurs-et-les-institutions/elus-locaux/conditions-dexercice-des-mandats-locaux/indemnite-de-fonction" },
    { label: "Sénat — rapport sur les indemnités des élus locaux", url: "https://www.senat.fr/rap/r23-121/r23-121_mono.html" }
  ],
  ai_disclosure: { personal: true, chatgpt: true, otherAi: false, otherAiName: "", images: false, imagesTool: "" },
  content: `
<style>
.psa{--a:#2563eb;--b:#7c3aed;--g:#16a34a;--r:#dc2626;--o:#ea580c}.psa .hero-number{font-size:clamp(2.2rem,8vw,4.8rem);font-weight:900;line-height:1;letter-spacing:-.055em}.psa .cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px 0}.psa .card{padding:18px;border:1px solid hsl(var(--border));border-radius:18px;background:hsl(var(--card));position:relative;overflow:hidden}.psa .card b{display:block;font-size:1.55rem;margin-top:5px}.psa .eyebrow{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:hsl(var(--muted-foreground))}.psa .chart{margin:28px 0;padding:20px;border-radius:20px;border:1px solid hsl(var(--border));background:hsl(var(--card))}.psa .chart h3{margin:0 0 5px;font-size:1.05rem}.psa .chart p{margin:0 0 18px;color:hsl(var(--muted-foreground));font-size:.85rem}.psa .row{display:grid;grid-template-columns:125px 1fr 90px;gap:10px;align-items:center;margin:12px 0;font-size:.82rem}.psa .track{height:16px;background:hsl(var(--muted));border-radius:99px;overflow:hidden}.psa .bar{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--a),var(--b));transform-origin:left;animation:psaGrow 1.3s cubic-bezier(.2,.8,.2,1) both}.psa .green{background:linear-gradient(90deg,#16a34a,#4ade80)}.psa .orange{background:linear-gradient(90deg,#ea580c,#fbbf24)}@keyframes psaGrow{from{transform:scaleX(0);opacity:.2}to{transform:scaleX(1);opacity:1}}.psa .pulse{animation:psaPulse 3s ease-in-out infinite}@keyframes psaPulse{50%{transform:translateY(-4px);box-shadow:0 14px 35px rgba(37,99,235,.13)}}.psa .callout{margin:28px 0;padding:18px 20px;border-left:4px solid var(--a);border-radius:12px;background:rgba(37,99,235,.07)}.psa .photo{margin:30px 0}.psa .photo img{width:100%;max-height:390px;object-fit:cover;border-radius:18px}.psa .photo figcaption{font-size:.72rem;color:hsl(var(--muted-foreground));margin-top:7px}.psa .split{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0}.psa .donut{width:170px;height:170px;margin:20px auto;border-radius:50%;background:conic-gradient(var(--a) 0 5.3%,var(--b) 5.3% 8.5%,#94a3b8 8.5% 100%);display:grid;place-items:center;animation:psaSpin 1.2s ease-out both}.psa .donut:after{content:'1,58 Md€';width:112px;height:112px;border-radius:50%;background:hsl(var(--card));display:grid;place-items:center;font-weight:900;font-size:1.05rem}@keyframes psaSpin{from{transform:rotate(-100deg);opacity:0}to{transform:rotate(0);opacity:1}}.psa .legend{font-size:.8rem;line-height:1.8}.psa .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.psa .saving{font-size:2.3rem;font-weight:900;color:var(--g)}@media(max-width:650px){.psa .cards,.psa .split{grid-template-columns:1fr}.psa .row{grid-template-columns:1fr}.psa .row strong{text-align:left}}
</style>
<div class="psa">
<p>Quand on parle du « coût des politiques », un chiffre spectaculaire suffit souvent à lancer une polémique. Le problème : on mélange régulièrement le revenu personnel d’un élu avec l’argent destiné à payer ses collaborateurs, ses déplacements ou le fonctionnement d’une institution. Pour savoir ce que paient réellement les Français, il faut séparer les deux.</p>
<div class="cards">
 <div class="card pulse"><span class="eyebrow">Président</span><b>≈ 16 039 €</b><span>brut par mois</span></div>
 <div class="card pulse"><span class="eyebrow">Ministre / ministre délégué</span><b>≈ 10 692 €</b><span>brut par mois</span></div>
 <div class="card pulse"><span class="eyebrow">Député</span><b>7 637,39 €</b><span>brut par mois</span></div>
 <div class="card pulse"><span class="eyebrow">Sénateur</span><b>7 637,39 €</b><span>brut par mois</span></div>
</div>
<div class="chart"><h3>Rémunération brute annuelle</h3><p>Comparaison des principales fonctions nationales.</p>
 <div class="row"><span>Président</span><div class="track"><i class="bar" style="width:100%"></i></div><strong>192 462 €</strong></div>
 <div class="row"><span>Ministre</span><div class="track"><i class="bar" style="width:66.7%"></i></div><strong>128 308 €</strong></div>
 <div class="row"><span>Député</span><div class="track"><i class="bar" style="width:47.6%"></i></div><strong>91 649 €</strong></div>
 <div class="row"><span>Sénateur</span><div class="track"><i class="bar" style="width:47.6%"></i></div><strong>91 649 €</strong></div>
</div>
<h2>Le chiffre qui change tout : salaire ou moyens de travail ?</h2>
<p>Un député dispose aussi d’une dotation de fonctionnement d’environ <strong>7 238 € par mois</strong> en métropole et d’un crédit collaborateurs d’environ <strong>11 463 € par mois</strong>. Ce dernier sert à rémunérer ses assistants : ce n’est pas 11 463 € de salaire supplémentaire pour le député. Même logique au Sénat, où existent une avance pour frais de mandat et un crédit collaborateurs.</p>
<div class="callout"><strong>À retenir.</strong> Additionner salaire + collaborateurs + frais et appeler le résultat « salaire du député » est trompeur. Le coût du mandat est supérieur à la rémunération de l’élu, mais tout cet argent ne lui appartient pas.</div>
<figure class="photo"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Senat_France.jpg/1280px-Senat_France.jpg" alt="Palais du Luxembourg, siège du Sénat"><figcaption>Le Palais du Luxembourg, siège du Sénat · Wikimedia Commons</figcaption></figure>
<h2>Députés et sénateurs : près de 85 millions d’euros d’indemnités</h2>
<p>Pour les <strong>577 députés</strong>, la seule indemnité brute représente un ordre de grandeur proche de <strong>52,9 millions d’euros par an</strong>. Pour les <strong>348 sénateurs</strong>, environ <strong>31,9 millions</strong>. Ensemble : près de <strong>84,8 millions d’euros</strong> de rémunérations parlementaires brutes par an.</p>
<div class="chart"><h3>Indemnités parlementaires annuelles</h3><p>Ordre de grandeur calculé à partir de l’indemnité mensuelle et du nombre de sièges.</p>
 <div class="row"><span>Députés</span><div class="track"><i class="bar green" style="width:100%"></i></div><strong>52,9 M€</strong></div>
 <div class="row"><span>Sénateurs</span><div class="track"><i class="bar green" style="width:60.3%"></i></div><strong>31,9 M€</strong></div>
</div>
<h2>Les maires : une réalité totalement différente</h2>
<p>Il n’existe pas un « salaire du maire ». L’indemnité dépend de la population. Elle est d’environ <strong>1 048 € brut par mois</strong> dans une commune de moins de 500 habitants et peut atteindre environ <strong>5 960 €</strong> dans une ville de 100 000 habitants ou plus, hors majorations possibles.</p>
<div class="chart"><h3>Indemnité mensuelle maximale d’un maire</h3><p>Le montant augmente avec la population de la commune.</p>
 <div class="row"><span>&lt; 500 hab.</span><div class="track"><i class="bar orange" style="width:17.6%"></i></div><strong>1 048 €</strong></div>
 <div class="row"><span>500–999</span><div class="track"><i class="bar orange" style="width:27.8%"></i></div><strong>1 657 €</strong></div>
 <div class="row"><span>1 000–3 499</span><div class="track"><i class="bar orange" style="width:35.6%"></i></div><strong>2 121 €</strong></div>
 <div class="row"><span>10 000–19 999</span><div class="track"><i class="bar orange" style="width:44.8%"></i></div><strong>2 672 €</strong></div>
 <div class="row"><span>50 000–99 999</span><div class="track"><i class="bar orange" style="width:75.9%"></i></div><strong>4 522 €</strong></div>
 <div class="row"><span>100 000+</span><div class="track"><i class="bar orange" style="width:100%"></i></div><strong>5 960 €</strong></div>
</div>
<h2>Pourquoi le local pèse beaucoup plus lourd</h2>
<p>Une estimation de la DGCL reprise par le Sénat situait les indemnités de fonction des élus communaux autour de <strong>1,498 milliard d’euros par an</strong> sur le périmètre étudié. C’est très supérieur au Parlement, mais la comparaison brute cache une évidence : la France compte des dizaines de milliers de communes et plusieurs centaines de milliers de mandats locaux.</p>
<div class="split"><div class="chart" style="margin:0"><h3>Une base illustrative</h3><div class="donut"></div><div class="legend"><span class="dot" style="background:#2563eb"></span>Députés : ~52,9 M€<br><span class="dot" style="background:#7c3aed"></span>Sénateurs : ~31,9 M€<br><span class="dot" style="background:#94a3b8"></span>Élus communaux : ~1,498 Md€</div></div><div class="card"><span class="eyebrow">Total de cette base</span><div class="hero-number">≈ 1,58<br>Md€</div><p>Ce n’est <strong>pas</strong> le coût total de la politique française : seulement l’addition de trois catégories d’indemnités comparables.</p></div></div>
<h2>Et si on baissait tout de 10 % ?</h2>
<p>Appliquée mécaniquement à cette base d’environ 1,58 milliard d’euros, une baisse de 10 % donnerait une économie théorique proche de :</p>
<div class="card pulse"><span class="eyebrow">Économie annuelle théorique</span><div class="saving">≈ 158 M€</div><span>soit seulement quelques euros par habitant et par an.</span></div>
<p>Le chiffre est loin d’être négligeable, mais il ne bouleverserait pas à lui seul les finances publiques françaises. Et une coupe uniforme poserait un autre problème : enlever 10 ou 20 % au maire d’un village n’a pas le même effet social que réduire une rémunération nationale élevée.</p>
<h2>Alors, où réduire intelligemment ?</h2>
<div class="cards">
 <div class="card"><span class="eyebrow">01</span><b>Doublons</b><span>Mutualiser les fonctions redondantes entre collectivités et administrations.</span></div>
 <div class="card"><span class="eyebrow">02</span><b>Frais</b><span>Renforcer la traçabilité et récupérer systématiquement les dépenses injustifiées.</span></div>
 <div class="card"><span class="eyebrow">03</span><b>Structures</b><span>Examiner cabinets, organismes et structures satellites plutôt que la seule fiche de paie.</span></div>
 <div class="card"><span class="eyebrow">04</span><b>Présence</b><span>Mieux relier certaines indemnités à l’exercice effectif du mandat lorsque la loi le permet.</span></div>
</div>
<div class="callout"><strong>Le vrai débat n’est pas seulement « combien gagnent-ils ? »</strong> Il est aussi : combien de niveaux, de structures et de moyens publics faut-il financer pour obtenir quel service démocratique ? Une économie sérieuse se mesure à son efficacité, pas seulement à son potentiel de buzz.</div>
<h2>Ce qu’il faut retenir</h2>
<p>Oui, les plus hautes fonctions politiques sont bien rémunérées. Oui, leurs institutions mobilisent également des moyens importants. Mais non, les frais de mandat et les salaires des collaborateurs ne sont pas des revenus personnels cachés. Et non, diviser les indemnités des élus ne suffirait pas à résoudre les déficits publics.</p>
<p>La piste la plus solide est donc moins spectaculaire : <strong>contrôler les dépenses, supprimer les doublons et évaluer l’utilité réelle des structures</strong>. C’est moins viral qu’un chiffre choc. C’est aussi beaucoup plus sérieux.</p>
</div>`
};