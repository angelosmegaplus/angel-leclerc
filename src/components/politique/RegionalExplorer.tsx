import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  Flag,
  History,
  Languages,
  ListFilter,
  MapPinned,
  RotateCcw,
  Search,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  explorerMovementCount,
  regionalTerritories,
  type MovementOrientation,
  type RegionalMovement,
  type RegionalTerritory,
} from "@/data/regionalExplorer";
import { TerritoryFlag } from "./TerritoryFlag";

const MAP_WIDTH = 610;
const MAP_HEIGHT = 610;

function orientationClass(orientation: MovementOrientation) {
  if (orientation === "Indépendantiste") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (orientation === "Autonomiste") return "border-primary/30 bg-primary/10 text-primary";
  return "border-border bg-muted text-muted-foreground";
}

function MovementCard({ movement }: { movement: RegionalMovement }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-border bg-background transition-all open:border-primary/35 open:shadow-sm">
      <summary className="flex min-h-[76px] cursor-pointer list-none items-start justify-between gap-3 p-3.5 [&::-webkit-details-marker]:hidden sm:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${orientationClass(movement.orientation)}`}>{movement.orientation}</span>
            <span className="rounded-full border border-border bg-card px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{movement.status}</span>
          </div>
          <h4 className="mt-2.5 font-display text-[0.98rem] font-bold leading-snug text-foreground sm:text-base">{movement.name} <span className="font-normal text-muted-foreground">({movement.shortName})</span></h4>
          <p className="mt-1 text-[11px] font-semibold text-primary">{movement.founded}</p>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted-foreground group-open:line-clamp-none sm:text-sm">{movement.summary}</p>
        </div>
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary transition-transform group-open:rotate-180"><ChevronDown size={15} /></span>
      </summary>
      <div className="border-t border-border px-3.5 pb-4 pt-3 sm:px-4">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Revendications documentées</p>
        <ul className="mt-2.5 space-y-2 text-[12px] leading-5 text-foreground/85 sm:text-sm">
          {movement.claims.map((claim) => <li key={claim} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{claim}</span></li>)}
        </ul>
        <a href={movement.source.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-primary hover:underline">Source : {movement.source.label} <ExternalLink size={12} /></a>
      </div>
    </details>
  );
}

function TerritoryDetails({ territory, compact = false }: { territory: RegionalTerritory; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className={`relative overflow-hidden border-b border-border ${compact ? "h-28" : "h-36 sm:h-44"}`}>
        <TerritoryFlag id={territory.flag} title={territory.name} colors={territory.colors} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-white/75">Territoire sélectionné</p>
          <h3 className="mt-0.5 font-display text-xl font-bold tracking-tight sm:text-2xl">{territory.name}</h3>
        </div>
      </div>
      <div className="p-3.5 sm:p-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-wider text-primary"><MapPinned size={12} /> Centre(s)</div>
            <p className="mt-1.5 text-[12px] font-bold leading-5 text-foreground">{territory.capital}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-wider text-primary"><Languages size={12} /> Langues</div>
            <p className="mt-1.5 text-[12px] font-bold leading-5 text-foreground">{territory.languages.join(" · ")}</p>
          </div>
        </div>

        <details open={!compact} className="group mt-3 rounded-2xl border border-border bg-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-[11px] font-extrabold text-foreground"><Flag size={13} className="text-primary" /> Identité et histoire</span>
            <ChevronDown size={15} className="text-primary transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-3.5 pb-3.5 pt-3">
            <p className="text-[12px] leading-5 text-muted-foreground sm:text-sm">{territory.identity}</p>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/45 p-3"><History size={13} className="mt-0.5 shrink-0 text-primary" /><p className="text-[11px] leading-5 text-muted-foreground sm:text-xs">{territory.history}</p></div>
          </div>
        </details>

        <div className="mt-4">
          <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-primary"><Users size={13} /> Mouvements</div>
          <p className="mt-1 font-display text-base font-bold text-foreground">{territory.movements.length ? `${territory.movements.length} courant${territory.movements.length > 1 ? "s" : ""} documenté${territory.movements.length > 1 ? "s" : ""}` : "Aucun courant majeur recensé"}</p>
        </div>

        {territory.movements.length ? <div className="mt-3 space-y-2.5">{territory.movements.map((movement) => <MovementCard key={`${territory.id}-${movement.name}`} movement={movement} />)}</div> : <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/35 p-3 text-[11px] leading-5 text-muted-foreground">L'absence de mouvement dans la fiche signifie seulement qu'aucune organisation politique majeure n'a encore été intégrée à cette base documentaire.</div>}

        {territory.references.length ? (
          <div className="mt-4 border-t border-border pt-3.5">
            <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><BookOpen size={12} /> Pour vérifier</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {territory.references.map((reference) => <a key={reference.href} href={reference.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-foreground hover:border-primary hover:text-primary">{reference.label} <ExternalLink size={10} /></a>)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RegionalExplorer() {
  const [selectedId, setSelectedId] = useState("bretagne");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const selected = regionalTerritories.find((territory) => territory.id === selectedId) ?? regionalTerritories[0];
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    if (!needle) return regionalTerritories;
    return regionalTerritories.filter((territory) => [territory.name, territory.capital, ...territory.languages, ...territory.movements.flatMap((movement) => [movement.name, movement.shortName])].join(" ").toLocaleLowerCase("fr").includes(needle));
  }, [query]);
  const visibleIds = useMemo(() => new Set(filtered.map((territory) => territory.id)), [filtered]);

  const resetMap = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const selectTerritory = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => document.getElementById("regional-mobile-card")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 40);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.panX + (event.clientX - dragRef.current.x) / zoom, y: dragRef.current.panY + (event.clientY - dragRef.current.y) / zoom });
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const mapSvg = (mobile = false) => (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Carte interactive des territoires historiques de France métropolitaine"
      className={`aspect-square w-full select-none touch-pan-y ${dragging ? "cursor-grabbing" : "lg:cursor-grab"}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={(event) => {
        if (mobile) return;
        event.preventDefault();
        setZoom((value) => Math.max(0.9, Math.min(2.1, value + (event.deltaY < 0 ? 0.1 : -0.1))));
      }}
    >
      <defs><filter id={mobile ? "territory-shadow-mobile" : "territory-shadow"} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.16" /></filter></defs>
      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`} style={{ transformOrigin: "305px 305px" }}>
        {regionalTerritories.map((territory) => {
          const active = selected.id === territory.id;
          const visible = visibleIds.has(territory.id);
          const hasMovements = territory.movements.length > 0;
          return (
            <g
              key={territory.id}
              role="button"
              tabIndex={0}
              aria-label={`${territory.name}, ${territory.movements.length} mouvement${territory.movements.length > 1 ? "s" : ""} documenté${territory.movements.length > 1 ? "s" : ""}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => selectTerritory(territory.id)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectTerritory(territory.id); } }}
              className="outline-none"
            >
              <path d={territory.path} fill={active ? "hsl(var(--primary))" : visible ? (hasMovements ? "hsl(var(--primary) / 0.28)" : "hsl(var(--muted))") : "hsl(var(--muted) / 0.25)"} stroke={active ? "hsl(var(--primary-foreground))" : "hsl(var(--border))"} strokeWidth={active ? 3.3 : 1.7} opacity={visible ? 1 : 0.22} filter={active ? `url(#${mobile ? "territory-shadow-mobile" : "territory-shadow"})` : undefined} className="cursor-pointer transition-all duration-150 hover:brightness-95" />
              {hasMovements && visible ? <circle cx={territory.label[0] + 22} cy={territory.label[1] - 13} r={mobile ? 6 : 5} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" pointerEvents="none" /> : null}
              {!mobile ? <text x={territory.label[0]} y={territory.label[1]} textAnchor="middle" dominantBaseline="middle" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"} fontSize={active ? 13 : 11} fontWeight={active ? 800 : 700} opacity={visible ? 1 : 0.2} pointerEvents="none">{territory.name.split(/[ ,/]/)[0]}</text> : null}
            </g>
          );
        })}
      </g>
    </svg>
  );

  return (
    <section id="explorateur-regional" className="section-padding scroll-mt-24 bg-muted/40">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><MapPinned size={13} /> Explorateur régional</span>
          <h2 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">Choisissez une région, puis découvrez son identité et ses mouvements.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground md:mt-4 md:text-base">Sur mobile, la liste et les fiches passent avant la carte pour rester lisibles. La carte historique reste disponible en option.</p>
        </div>

        <div className="mx-auto mt-5 flex max-w-md justify-center gap-2 text-center sm:max-w-2xl">
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-foreground">{regionalTerritories.length} territoires</span>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-foreground">{explorerMovementCount} mouvements</span>
        </div>

        <div className="mt-8 lg:hidden">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bretagne, Corse, UDB…" className="h-12 w-full rounded-full border border-border bg-background pl-10 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" aria-label="Rechercher une région ou un mouvement" />
            </div>

            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground" htmlFor="territory-mobile-select">Choisir directement</label>
            <div className="relative mt-2">
              <ListFilter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={16} />
              <select id="territory-mobile-select" value={selected.id} onChange={(event) => selectTerritory(event.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-border bg-background pl-10 pr-10 text-base font-semibold text-foreground outline-none focus:border-primary">
                {regionalTerritories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            </div>

            <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filtered.map((territory) => (
                <button key={territory.id} type="button" onClick={() => selectTerritory(territory.id)} className={`min-h-11 shrink-0 snap-start rounded-full border px-3.5 text-sm font-semibold transition-colors ${selected.id === territory.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>{territory.name}</button>
              ))}
            </div>

            {filtered.length === 0 ? <p className="mt-3 rounded-xl bg-muted/45 p-3 text-sm text-muted-foreground">Aucun territoire ou mouvement ne correspond à cette recherche.</p> : null}
          </div>

          <div id="regional-mobile-card" className="mt-4"><TerritoryDetails territory={selected} compact /></div>

          <details className="group mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPinned size={19} /></span>
                <span><span className="block text-sm font-semibold text-foreground">Voir la carte historique</span><span className="mt-0.5 block text-xs text-muted-foreground">Optionnelle sur téléphone</span></span>
              </span>
              <ChevronDown size={17} className="shrink-0 text-primary transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">Territoire sélectionné</span>
                <span className="text-sm font-semibold text-foreground">{selected.name}</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-background">{mapSvg(true)}</div>
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Les noms ont volontairement été retirés de la petite carte mobile pour éviter l'illisibilité. Touchez une zone pour la sélectionner, puis lisez sa fiche au-dessus.</p>
            </div>
          </details>
        </div>

        <div className="mt-10 hidden rounded-2xl border border-border bg-card p-6 shadow-sm lg:block">
          <div className="grid gap-6 lg:grid-cols-[1.03fr_0.97fr]">
            <div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bretagne, Corse, UDB…" className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" aria-label="Rechercher une région ou un mouvement" />
              </div>

              <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filtered.map((territory) => (
                  <button key={territory.id} type="button" onClick={() => selectTerritory(territory.id)} className={`min-h-10 shrink-0 rounded-full border px-3 text-[11px] font-bold transition-colors ${selected.id === territory.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"}`}>{territory.name}</button>
                ))}
              </div>

              <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0,_transparent_68%)]">
                <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-full border border-border bg-background/92 p-1 shadow-sm backdrop-blur">
                  <button type="button" onClick={resetMap} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label="Réinitialiser la carte"><RotateCcw size={15} /></button>
                  <button type="button" onClick={() => setZoom((value) => Math.min(2.1, value + 0.2))} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label="Zoomer"><ZoomIn size={16} /></button>
                  <button type="button" onClick={() => setZoom((value) => Math.max(0.9, value - 0.2))} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label="Dézoomer"><ZoomOut size={16} /></button>
                </div>
                {mapSvg(false)}
                <div className="border-t border-border bg-background/85 px-3 py-2.5 text-[11px] leading-4 text-muted-foreground">Carte historique indicative : elle sert à explorer des identités et mouvements, pas à imposer un découpage administratif.</div>
              </div>
            </div>

            <aside className="max-h-[760px] overflow-y-auto pr-1"><TerritoryDetails territory={selected} /></aside>
          </div>
        </div>
      </div>
    </section>
  );
}
