import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Clapperboard,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  RefreshCw,
  Sparkles,
  Sun,
  Wind,
  Umbrella,
} from "lucide-react";
import type { AdminWeather } from "@/lib/weather.functions";
import { AIMemoryPanel } from "@/components/admin/AIMemoryPanel";

function WeatherIcon({ code, className = "" }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />;
  if ([1, 2, 3].includes(code)) return <Cloud className={className} />;
  if ([45, 48].includes(code)) return <CloudFog className={className} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle className={className} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={className} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}
function weatherLabel(code: number) {
  if (code === 0) return "Ciel dégagé";
  if ([1, 2].includes(code)) return "Éclaircies";
  if (code === 3) return "Couvert";
  if ([45, 48].includes(code)) return "Brouillard";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67].includes(code)) return "Pluie";
  if ([80, 81, 82].includes(code)) return "Averses";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neige";
  if ([95, 96, 99].includes(code)) return "Orage";
  return "Variable";
}
function formatUpdate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
}
function sourceLabel(source: "live" | "cache" | "fallback") {
  if (source === "live") return "données météo en direct";
  if (source === "cache") return "dernière météo enregistrée";
  return "prévision de secours";
}

export function PixelWidgets() {
  const weather = useQuery({
    queryKey: ["admin-weather-sarlat"],
    queryFn: async () => {
      const response = await fetch("/api/admin/weather", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Météo indisponible");
      return (await response.json()) as AdminWeather;
    },
    staleTime: 30 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(timer); }, []);
  const day = useMemo(() => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(now), [now]);
  const time = useMemo(() => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(now), [now]);

  return <>
    <div className="mb-5 grid min-w-0 gap-3 md:grid-cols-[1.05fr_1.45fr]">
      <section className="relative min-h-44 overflow-hidden rounded-[2rem] bg-[#d3e3fd] p-5 text-[#15233b] shadow-sm sm:p-6">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/35" />
        <div className="relative flex h-full flex-col justify-between"><div className="flex items-center gap-2 text-sm font-medium text-[#3f536f]"><CalendarDays className="h-4 w-4" /> Aujourd’hui</div><div><p className="text-5xl font-medium tracking-[-0.07em] sm:text-6xl">{time}</p><p className="mt-2 capitalize text-base font-medium text-[#3f536f]">{day}</p><p className="mt-1 text-sm text-[#5d6f88]">Angel OS · aperçu du jour</p></div></div>
      </section>
      <section className="min-h-44 overflow-hidden rounded-[2rem] bg-[#e8def8] p-5 text-[#2a1d38] shadow-sm sm:p-6">
        {weather.isLoading ? <div className="flex h-full min-h-32 items-center justify-center text-sm text-[#655872]">Chargement de la météo…</div> : weather.isError || !weather.data ? <div className="flex min-h-32 items-center justify-between gap-4"><div><p className="text-lg font-semibold">Météo indisponible</p><p className="mt-1 text-sm text-[#6c5d78]">Sarlat-la-Canéda</p></div><button type="button" onClick={() => void weather.refetch()} className="grid h-12 w-12 place-items-center rounded-full bg-[#d4c5e8]" aria-label="Réessayer"><RefreshCw className="h-5 w-5" /></button></div> : <div className="flex h-full flex-col justify-between"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#66566f]">{weather.data.location}</p><p className="mt-1 text-lg font-semibold">{weatherLabel(weather.data.weatherCode)}</p><p className="mt-1 text-sm text-[#75677e]">{weather.data.summary}</p></div><WeatherIcon code={weather.data.weatherCode} className="h-12 w-12 stroke-[1.4] text-[#554263]" /></div><div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-5xl font-medium tracking-[-0.07em]">{weather.data.high}°</p><p className="mt-1 text-sm text-[#75677e]">Mini {weather.data.low}° · maxi {weather.data.high}°</p></div><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-medium text-[#66566f]">{weather.data.precipitation !== null ? <span className="flex items-center gap-1.5"><Umbrella className="h-3.5 w-3.5" />{weather.data.precipitation} mm</span> : null}{weather.data.uvIndex !== null ? <span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5" />UV {weather.data.uvIndex}</span> : null}{weather.data.humidity > 0 ? <span className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" />{weather.data.humidity}%</span> : null}{weather.data.windSpeed > 0 ? <span className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5" />{weather.data.windSpeed} km/h</span> : null}</div></div>{weather.data.hourly?.length ? <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">{weather.data.hourly.map((slot) => <div key={slot.time} className="rounded-[1.25rem] bg-white/45 px-2 py-3 text-center"><p className="text-[11px] font-semibold text-[#66566f]">{slot.time}</p><WeatherIcon code={slot.weatherCode} className="mx-auto mt-2 h-5 w-5 stroke-[1.6] text-[#554263]" /><p className="mt-1 text-sm font-semibold text-[#2a1d38]">{slot.temperature === null ? "—" : `${slot.temperature}°`}</p>{slot.precipitationProbability !== null ? <p className="mt-0.5 text-[10px] text-[#75677e]">{slot.precipitationProbability}% pluie</p> : null}</div>)}</div> : null}<div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-medium text-[#7d7086]"><span>Mis à jour {formatUpdate(weather.data.fetchedAt)}</span><span className="text-right">{sourceLabel(weather.data.source)}</span></div></div>}
      </section>
    </div>

    <Link to="/admin-movix" className="group relative mb-5 flex min-h-28 items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-red-400/25 bg-gradient-to-br from-[#171014] via-[#0b0d10] to-[#13070a] p-5 text-white shadow-[0_20px_70px_rgba(120,0,20,.22)] transition hover:border-red-300/40 active:scale-[0.99] sm:p-6">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-red-500/10 blur-2xl" />
      <span className="relative flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-red-400/25 bg-red-500/15 text-red-200 shadow-inner"><Clapperboard className="h-7 w-7" /></span><span><span className="flex items-center gap-2"><span className="block text-xl font-semibold">Films & séries</span><Sparkles className="h-4 w-4 text-red-300" /></span><span className="mt-1 block max-w-md text-sm leading-5 text-white/50">Sélection personnalisée, 5 choix du jour et catalogue complet selon tes goûts.</span></span></span>
      <span className="relative rounded-full border border-red-300/20 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-100 transition group-hover:bg-red-500/25">Explorer</span>
    </Link>

    <AIMemoryPanel />
  </>;
}
