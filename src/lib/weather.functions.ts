import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminWeatherHour = {
  time: string;
  temperature: number | null;
  weatherCode: number;
  precipitationProbability: number | null;
};

export type AdminWeather = {
  location: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  high: number;
  low: number;
  precipitation: number | null;
  uvIndex: number | null;
  sunrise: string;
  sunset: string;
  summary: string;
  hourly: AdminWeatherHour[];
  source: "live" | "fallback" | "cache";
  fetchedAt: string;
};

const WEATHER_CACHE_KEY = "weather_sarlat";

const EMERGENCY_FALLBACK: AdminWeather = {
  location: "Sarlat-la-Canéda",
  temperature: 25,
  apparentTemperature: 25,
  weatherCode: 2,
  windSpeed: 0,
  humidity: 0,
  high: 40,
  low: 21,
  precipitation: null,
  uvIndex: null,
  sunrise: "",
  sunset: "",
  summary: "Dernière prévision de secours disponible",
  hourly: [
    { time: "12:00", temperature: 34, weatherCode: 1, precipitationProbability: null },
    { time: "15:00", temperature: 39, weatherCode: 1, precipitationProbability: null },
    { time: "18:00", temperature: 39, weatherCode: 2, precipitationProbability: null },
    { time: "21:00", temperature: 34, weatherCode: 3, precipitationProbability: null },
  ],
  source: "fallback",
  fetchedAt: new Date().toISOString(),
};

async function assertAdmin(context: { supabase: { from: (table: string) => any }; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

function buildHourly(data: any): AdminWeatherHour[] {
  const times: string[] = data.hourly?.time ?? [];
  const temperatures: number[] = data.hourly?.temperature_2m ?? [];
  const weatherCodes: number[] = data.hourly?.weather_code ?? [];
  const rain: number[] = data.hourly?.precipitation_probability ?? [];
  const preferredHours = new Set([6, 9, 12, 15, 18, 21]);

  return times.flatMap((value, index) => {
    const hour = Number(value.slice(11, 13));
    if (!preferredHours.has(hour)) return [];
    return [{
      time: `${String(hour).padStart(2, "0")}:00`,
      temperature: typeof temperatures[index] === "number" ? Math.round(temperatures[index]) : null,
      weatherCode: Number(weatherCodes[index] ?? 0),
      precipitationProbability: typeof rain[index] === "number" ? Math.round(rain[index]) : null,
    }];
  });
}

async function readCache(context: any): Promise<AdminWeather | null> {
  const { data } = await context.supabase
    .from("angel_os_cache")
    .select("payload, updated_at")
    .eq("key", WEATHER_CACHE_KEY)
    .maybeSingle();
  if (!data?.payload) return null;
  return {
    ...(data.payload as AdminWeather),
    source: "cache",
    fetchedAt: (data.payload as AdminWeather).fetchedAt || data.updated_at,
  };
}

async function writeCache(context: any, payload: AdminWeather) {
  await context.supabase
    .from("angel_os_cache")
    .upsert({ key: WEATHER_CACHE_KEY, payload, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export const getAdminWeather = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminWeather> => {
    await assertAdmin(context);

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", "44.89");
    url.searchParams.set("longitude", "1.22");
    url.searchParams.set("timezone", "Europe/Paris");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m");
    url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset,weather_code");

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error("Météo indisponible");

      const data = (await response.json()) as any;
      const code = Number(data.daily?.weather_code?.[0] ?? data.current?.weather_code ?? 0);
      const payload: AdminWeather = {
        location: "Sarlat-la-Canéda",
        temperature: Math.round(data.current?.temperature_2m ?? data.daily?.temperature_2m_max?.[0] ?? 0),
        apparentTemperature: Math.round(data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 0),
        weatherCode: code,
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
        high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
        low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
        precipitation: typeof data.daily?.precipitation_sum?.[0] === "number" ? data.daily.precipitation_sum[0] : null,
        uvIndex: typeof data.daily?.uv_index_max?.[0] === "number" ? data.daily.uv_index_max[0] : null,
        sunrise: data.daily?.sunrise?.[0] ?? "",
        sunset: data.daily?.sunset?.[0] ?? "",
        summary: "Prévisions de la journée",
        hourly: buildHourly(data),
        source: "live",
        fetchedAt: new Date().toISOString(),
      };

      await writeCache(context, payload);
      return payload;
    } catch {
      const cached = await readCache(context);
      if (cached) return cached;
      return { ...EMERGENCY_FALLBACK, fetchedAt: new Date().toISOString() };
    }
  });
