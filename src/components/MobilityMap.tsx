import { useEffect, useRef, useState } from "react";

type Place = {
  name: string;
  coords: [number, number];
  note: string;
  kind: "base" | "priority";
};

const PLACES: Place[] = [
  {
    name: "Sarlat-la-Canéda",
    coords: [44.8892, 1.2166],
    note: "Base actuelle et zone de recherche",
    kind: "base",
  },
  {
    name: "Bergerac",
    coords: [44.8538, 0.4834],
    note: "Radio, médias et communication",
    kind: "priority",
  },
  {
    name: "Périgueux",
    coords: [45.184, 0.7211],
    note: "Communication, médias et opportunités BTS",
    kind: "priority",
  },
  {
    name: "Brive-la-Gaillarde",
    coords: [45.1589, 1.5333],
    note: "Communication, médias et entreprises structurées",
    kind: "priority",
  },
  {
    name: "Bordeaux",
    coords: [44.8378, -0.5792],
    note: "Zone élargie prioritaire : médias, radio, journalisme et communication",
    kind: "priority",
  },
];

export default function MobilityMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [44.98, 0.55],
        zoom: 8,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map);

      for (const place of PLACES) {
        const isBase = place.kind === "base";
        const size = isBase ? 18 : 14;
        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${
            isBase ? "#CE654B" : "#181716"
          };border:2px solid #FFFDF9;box-shadow:0 1px 5px rgba(24,23,22,.35);opacity:${
            isBase ? 1 : 0.88
          }"></span>`,
        });

        L.marker(place.coords, { icon, title: place.name })
          .addTo(map)
          .bindTooltip(place.name, {
            permanent: true,
            direction: "top",
            offset: [0, -8],
            className: "angel-mobility-label",
          })
          .bindPopup(
            `<strong style="font-size:13px">${place.name}</strong><br/><span style="font-size:12px">${place.note}</span>`,
          );
      }

      setReady(true);
      map.fitBounds(L.latLngBounds(PLACES.map((p) => p.coords)).pad(0.14), {
        padding: [18, 18],
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div className="relative">
      <style>{`
        .angel-mobility-label {
          border: 1px solid rgba(0,0,0,.12);
          border-radius: 9999px;
          background: rgba(255,253,249,.94);
          color: #181716;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 7px;
        }
        .angel-mobility-label::before { display: none; }
      `}</style>
      <div
        ref={containerRef}
        role="img"
        aria-label="Carte des principales zones de recherche d'alternance : Bordeaux, Périgueux, Bergerac, Brive-la-Gaillarde et Sarlat-la-Canéda"
        className="h-[320px] w-full bg-muted sm:h-[360px]"
        style={{ opacity: ready ? 1 : 0.5, transition: "opacity .3s" }}
      />
    </div>
  );
}
