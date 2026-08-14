import { createServerFn } from "@tanstack/react-start";

export type AdminWeather = {
  location: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  fetchedAt: string;
};

export const getAdminWeather = createServerFn({ method: "GET" }).handler(async (): Promise<AdminWeather> => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", "44.89");
  url.searchParams.set("longitude", "1.22");
  url.searchParams.set("timezone", "Europe/Paris");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,sunrise,sunset");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error("Météo indisponible");

  const data = (await response.json()) as any;
  return {
    location: "Sarlat-la-Canéda",
    temperature: Math.round(data.current?.temperature_2m ?? 0),
    apparentTemperature: Math.round(data.current?.apparent_temperature ?? 0),
    weatherCode: Number(data.current?.weather_code ?? 0),
    windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
    humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
    high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
    low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
    sunrise: data.daily?.sunrise?.[0] ?? "",
    sunset: data.daily?.sunset?.[0] ?? "",
    fetchedAt: new Date().toISOString(),
  };
});
