import { useEffect, useRef, useState } from "react";

const SARLAT: [number, number] = [44.8892, 1.2166];

type Place = {
  name: string;
  coords: [number, number];
  note: string;
  primary?: boolean;
};

const PLACES: Place[] = [
  { name: "Sarlat-la-Canéda", coords: SARLAT, note: "Zone prioritaire", primary: true },
  { name: "Souillac", coords: [44.8943, 1.4773], note: "Possible si l'offre est intéressante" },
  { name: "Périgueux", coords: [45.184, 0.7211], note: "Envisageable si offre très intéressante (déménagement)" },
  { name: "Brive-la-Gaillarde", coords: [45.1589, 1.5333], note: "Envisageable si offre très intéressante (déménagement)" },
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
        center: [44.99, 1.13],
        zoom: 9,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map);

      L.circle(SARLAT, {
        radius: 15000,
        color: "#CE654B",
        weight: 1.5,
        opacity: 0.6,
        fillColor: "#CE654B",
        fillOpacity: 0.12,
      }).addTo(map);

      for (const place of PLACES) {
        const size = place.primary ? 18 : 12;
        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${
            place.primary ? "#CE654B" : "#181716"
          };border:2px solid #FFFDF9;box-shadow:0 1px 4px rgba(24,23,22,.35);opacity:${
            place.primary ? 1 : 0.8
          }"></span>`,
        });
        L.marker(place.coords, { icon, title: place.name })
          .addTo(map)
          .bindPopup(
            `<strong style="font-size:13px">${place.name}</strong><br/><span style="font-size:12px">${place.note}</span>`,
          );
      }

      setReady(true);
      map.fitBounds(
        L.latLngBounds(PLACES.map((p) => p.coords)).pad(0.15),
        { padding: [10, 10] },
      );
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Carte de la zone de recherche d'alternance autour de Sarlat-la-Canéda"
      className="h-[280px] w-full bg-muted sm:h-[300px]"
      style={{ opacity: ready ? 1 : 0.5, transition: "opacity .3s" }}
    />
  );
}
