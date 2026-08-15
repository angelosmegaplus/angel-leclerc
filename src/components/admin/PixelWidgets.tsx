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
  if (source === "live") return "direct";
  if (source === "cache") return "cache récent";
  return "secours";
}

const cardClass = "relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090b0d]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,.28)] sm:rounded-[1.75rem] sm:p-6";

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
    <div className="mb-5 grid min-w-0 gap-3 md:grid-cols-[.85fr_1.55fr]">
      <section className={`${cardClass} min-h-40`}>
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-red-500/10 blur-2xl" />
        <div className="relative flex h-full min-h-32 flex-col justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-red-300"><CalendarDays className="h-4 w-4" /> Aujourd’hui</div>
          <div>
            <p className="text-5xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">{time}</p>
            <p className="mt-2 capitalize text-sm font-medium text-white/65 sm:text-base">{day}</p>
            <p className="mt-1 text-xs text-white/35">Angel OS · aperçu du jour</p>
          </div>
        </div>
      </section>

      <section className={`${cardClass} min-h-40`}>
        {weather.isLoading ? <div className="flex min-h-32 items-center justify-center text-sm text-white/45">Chargement de la météo…</div> : weather.isError || !weather.data ? <div className="flex min-h-32 items-center justify-between gap-4"><div><p className="text-lg font-semibold text-white">Météo indisponible</p><p className="mt-1 text-sm text-white/45">Sarlat-la-Canéda</p></div><button type="button" onClick={() => void weather.refetch()} className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-200" aria-label="Réessayer"><RefreshCw className="h-5 w-5" /></button></div> : <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-red-300">{weather.data.location}</p><p className="mt-2 text-lg font-semibold text-white">{weatherLabel(weather.data.weatherCode)}</p><p className="mt-1 max-w-xl text-sm text-white/45">{weather.data.summary}</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-red-200"><WeatherIcon code={weather.data.weatherCode} className="h-7 w-7 stroke-[1.5]" /></span></div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-5xl font-semibold tracking-[-0.07em] text-white">{weather.data.high}°</p><p className="mt-1 text-xs text-white/40">Mini {weather.data.low}° · maxi {weather.data.high}°</p></div><div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-medium text-white/55">{weather.data.precipitation !== null ? <span className="flex items-center gap-1.5"><Umbrella className="h-3.5 w-3.5 text-red-300" />{weather.data.precipitation} mm</span> : null}{weather.data.uvIndex !== null ? <span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5 text-red-300" />UV {weather.data.uvIndex}</span> : null}{weather.data.humidity > 0 ? <span className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-red-300" />{weather.data.humidity}%</span> : null}{weather.data.windSpeed > 0 ? <span className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-red-300" />{weather.data.windSpeed} km/h</span> : null}</div></div>
          {weather.data.hourly?.length ? <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">{weather.data.hourly.map((slot) => <div key={slot.time} className="rounded-xl border border-white/8 bg-white/[.025] px-2 py-2.5 text-center"><p className="text-[10px] font-semibold text-white/45">{slot.time}</p><WeatherIcon code={slot.weatherCode} className="mx-auto mt-1.5 h-4 w-4 stroke-[1.6] text-red-200" /><p className="mt-1 text-sm font-semibold text-white">{slot.temperature === null ? "—" : `${slot.temperature}°`}</p>{slot.precipitationProbability !== null ? <p className="mt-0.5 text-[9px] text-white/35">{slot.precipitationProbability}% pluie</p> : null}</div>)}</div> : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-white/30"><span>Mis à jour {formatUpdate(weather.data.fetchedAt)}</span><span>{sourceLabel(weather.data.source)}</span></div>
        </div>}
      </section>
    </div>

    <Link to="/admin-movix" className="group relative mb-5 flex min-h-28 items-center justify-between gap-4 overflow-hidden rounded-[1.5rem] border border-red-500/20 bg-gradient-to-br from-red-500/[.08] via-[#090b0d] to-[#090b0d] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.28)] transition hover:border-red-400/35 active:scale-[0.99] sm:rounded-[1.75rem] sm:p-6">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-red-500/10 blur-2xl" />
      <span className="relative flex min-w-0 items-center gap-3 sm:gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 sm:h-14 sm:w-14"><Clapperboard className="h-6 w-6 sm:h-7 sm:w-7" /></span><span className="min-w-0"><span className="flex items-center gap-2"><span className="block truncate text-lg font-semibold sm:text-xl">Films & séries</span><Sparkles className="h-4 w-4 shrink-0 text-red-300" /></span><span className="mt-1 hidden max-w-md text-sm leading-5 text-white/45 sm:block">Sélection personnalisée, choix du jour et catalogue selon tes goûts.</span></span></span>
      <span className="relative shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition group-hover:bg-red-500/15">Explorer</span>
    </Link>

    <AIMemoryPanel />
  </>;
}
