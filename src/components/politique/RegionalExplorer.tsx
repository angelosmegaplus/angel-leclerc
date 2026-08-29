import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  Flag,
  History,
  Languages,
  MapPinned,
  Maximize2,
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
} from "@/data/regionalExplorer";
import { TerritoryFlag } from "./TerritoryFlag";

const MAP_WIDTH = 610;
const MAP_HEIGHT = 610;

function orientationClass(orientation: MovementOrientation) {
  switch (orientation) {
    case "Indépendantiste":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "Autonomiste":
      return "border-primary/30 bg-primary/10 text-primary";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function MovementCard({ movement }: { movement: RegionalMovement }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-border bg-background transition-all open:border-primary/35 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${orientationClass(movement.orientation)}`}>
              {movement.orientation}
            </span>
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {movement.status}
            </span>
          </div>
          <h4 className="mt-3 font-display text-base font-bold leading-snug text-foreground">
            {movement.name} <span className="font-normal text-muted-foreground">({movement.shortName})</span>
          </h4>
          <p className="mt-1 text-xs font-medium text-primary">{movement.founded}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{movement.summary}</p>
        </div>
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary transition-transform group-open:rotate-180">
          <ChevronDown size={15} />
        </span>
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Revendications documentées</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/85">
          {movement.claims.map((claim) => (
            <li key={claim} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{claim}</span>
            </li>
          ))}
        </ul>
        <a
          href={movement.source.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
        >
          Source : {movement.source.label} <ExternalLink size={13} />
        </a>
      </div>
    </details>
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
    return regionalTerritories.filter((territory) => {
      const haystack = [territory.name, territory.capital, ...territory.languages, ...territory.movements.map((movement) => movement.name)].join(" ").toLocaleLowerCase("fr");
      return haystack.includes(needle);
    });
  }, [query]);

  const visibleIds = useMemo(() => new Set(filtered.map((territory) => territory.id)), [filtered]);

  const selectTerritory = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => document.getElementById("regional-detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dx = (event.clientX - dragRef.current.x) / zoom;
    const dy = (event.clientY - dragRef.current.y) / zoom;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section id="explorateur-regional" className="section-padding scroll-mt-24 overflow-hidden bg-background">
      <div className="container-tight">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <MapPinned size={13} /> Explorateur territorial
          </span>
          <h2 className="mt-3 font-display text-[1.7rem] font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Cliquer sur un territoire pour explorer son identité politique
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground md:text-base">
            La carte rassemble des territoires historiques et culturels pour rendre visibles les différentes traditions régionales françaises. Chaque fiche distingue l'identité du territoire des revendications formulées par les mouvements qui y ont existé ou qui y sont encore actifs.
          </p>
        </div>

        <div className="mx-auto mt-7 grid max-w-4xl grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm sm:p-4">
            <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{regionalTerritories.length}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">territoires</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm sm:p-4">
            <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{explorerMovementCount}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">mouvements</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm sm:p-4">
            <p className="font-display text-2xl font-bold text-primary sm:text-3xl">3</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">courants distingués</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:gap-7">
            <div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher Bretagne, Corse, alsacien, UDB…"
                  className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  aria-label="Rechercher un territoire ou un mouvement"
                />
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filtered.slice(0, 12).map((territory) => (
                  <button
                    key={territory.id}
                    type="button"
                    onClick={() => selectTerritory(territory.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${selected.id === territory.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                  >
                    {territory.name}
                  </button>
                ))}
              </div>

              <div className="relative mt-4 overflow-hidden rounded-3xl border border-border bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0,_transparent_65%)]">
                <div className="absolute right-3 top-3 z-10 flex gap-1.5 rounded-full border border-border bg-background/90 p-1.5 shadow-sm backdrop-blur">
                  <button type="button" onClick={() => setZoom((value) => Math.min(2.1, value + 0.2))} className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label="Zoomer">
                    <ZoomIn size={16} />
                  </button>
                  <button type="button" onClick={() => setZoom((value) => Math.max(0.9, value - 0.2))} className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label="Dézoomer">
                    <ZoomOut size={16} />
                  </button>
                  <button type="button" onClick={resetMap} className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label="Réinitialiser la carte">
                    <Maximize2 size={15} />
                  </button>
                </div>

                <svg
                  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                  role="img"
                  aria-label="Carte interactive des territoires historiques de France métropolitaine"
                  className={`aspect-[1/1.03] w-full select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onWheel={(event) => {
                    event.preventDefault();
                    setZoom((value) => Math.max(0.9, Math.min(2.1, value + (event.deltaY < 0 ? 0.1 : -0.1))));
                  }}
                >
                  <defs>
                    <filter id="territory-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.16" />
                    </filter>
                  </defs>
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
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectTerritory(territory.id);
                            }
                          }}
                          className="outline-none"
                        >
                          <path
                            d={territory.path}
                            fill={active ? "hsl(var(--primary))" : visible ? (hasMovements ? "hsl(var(--primary) / 0.26)" : "hsl(var(--muted))") : "hsl(var(--muted) / 0.25)"}
                            stroke={active ? "hsl(var(--primary-foreground))" : "hsl(var(--border))"}
                            strokeWidth={active ? 2.4 : 1.4}
                            opacity={visible ? 1 : 0.3}
                            filter={active ? "url(#territory-shadow)" : undefined}
                            className="cursor-pointer transition-all duration-200 hover:brightness-95 focus:brightness-95"
                          />
                          {hasMovements && visible ? (
                            <circle cx={territory.label[0] + 22} cy={territory.label[1] - 13} r="5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" pointerEvents="none" />
                          ) : null}
                          <text
                            x={territory.label[0]}
                            y={territory.label[1]}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
                            fontSize={active ? 12 : 10}
                            fontWeight={active ? 800 : 650}
                            opacity={visible ? 1 : 0.25}
                            pointerEvents="none"
                          >
                            {territory.name.split(/[ ,/]/)[0]}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                <div className="border-t border-border bg-background/80 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                  Carte historique indicative destinée à l'exploration. Elle ne représente ni les limites administratives actuelles ni une proposition définitive de découpage.
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Territoire sélectionné</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary/30" /> Mouvement documenté</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted ring-1 ring-border" /> Identité sans mouvement majeur recensé</span>
              </div>
            </div>

            <aside id="regional-detail-panel" className="scroll-mt-24 lg:max-h-[780px] lg:overflow-y-auto lg:pr-1">
              <div key={selected.id} className="animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
                  <div className="relative h-40 overflow-hidden border-b border-border sm:h-48">
                    <TerritoryFlag id={selected.flag} title={selected.name} colors={selected.colors} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Territoire sélectionné</p>
                      <h3 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{selected.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary"><MapPinned size={13} /> Centre(s)</div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{selected.capital}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary"><Languages size={13} /> Langues</div>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{selected.languages.join(" · ")}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary"><Flag size={13} /> Identité</div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.identity}</p>
                    </div>

                    <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary"><History size={13} /> Repère historique</div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.history}</p>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary"><Users size={13} /> Mouvements</div>
                        <h4 className="mt-1 font-display text-xl font-bold text-foreground">
                          {selected.movements.length ? `${selected.movements.length} courant${selected.movements.length > 1 ? "s" : ""} documenté${selected.movements.length > 1 ? "s" : ""}` : "Aucun courant majeur recensé ici"}
                        </h4>
                      </div>
                    </div>

                    {selected.movements.length ? (
                      <div className="mt-4 space-y-3">
                        {selected.movements.map((movement) => <MovementCard key={`${selected.id}-${movement.name}`} movement={movement} />)}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm leading-relaxed text-muted-foreground">
                        L'absence de mouvement dans cette fiche ne signifie pas absence d'identité régionale. Elle indique seulement qu'aucune organisation politique majeure n'a encore été intégrée à cette version de la base documentaire.
                      </div>
                    )}

                    {selected.references.length ? (
                      <div className="mt-5 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><BookOpen size={13} /> Pour vérifier</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.references.map((reference) => (
                            <a key={reference.href} href={reference.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                              {reference.label} <ExternalLink size={11} />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <strong className="text-foreground">Lecture documentaire :</strong> les catégories décrivent la position déclarée des organisations. Afficher un mouvement indépendantiste, autonomiste ou régionaliste ne signifie pas approuver sa revendication. Les fiches privilégient les sources officielles des organisations et les sources institutionnelles lorsqu'elles sont disponibles.
        </div>
      </div>
    </section>
  );
}
