import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "./AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupAddress, type MapsPlace } from "@/lib/maps.functions";

/** Recherche d'adresse réelle (Google Maps) pour préparer un déplacement. */
export function AddressLookupCard() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<MapsPlace[]>([]);
  const lookup = useServerFn(lookupAddress);

  const search = useMutation({
    mutationFn: (value: string) => lookup({ data: { query: value } }),
    onSuccess: (result) => {
      setPlaces(result);
      if (result.length === 0) toast.info("Aucune adresse trouvée.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Recherche impossible"),
  });

  return (
    <AdminCard
      title="Adresse et trajet"
      description="Vérifiez une adresse de rendez-vous et obtenez l’itinéraire depuis Sarlat-la-Canéda."
    >
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim().length >= 3) search.mutate(query.trim());
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Adresse, lieu, entreprise…"
          className="h-11"
          aria-label="Adresse à vérifier"
        />
        <Button type="submit" className="min-h-11" disabled={search.isPending}>
          {search.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
          Vérifier
        </Button>
      </form>

      {places.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {places.map((place) => (
            <li key={`${place.lat}-${place.lng}-${place.address}`} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium text-foreground">{place.address}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {place.distanceFromBaseKm !== null
                  ? `Environ ${place.distanceFromBaseKm} km à vol d’oiseau depuis Sarlat-la-Canéda.`
                  : "Distance non calculable."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="min-h-10">
                  <a href={place.mapUrl} target="_blank" rel="noreferrer">Voir sur la carte</a>
                </Button>
                <Button asChild size="sm" variant="ghost" className="min-h-10">
                  <a href={place.directionsUrl} target="_blank" rel="noreferrer">
                    <Navigation className="mr-2 h-4 w-4" /> Itinéraire
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminCard>
  );
}
