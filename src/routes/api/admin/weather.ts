import { createFileRoute } from "@tanstack/react-router";
import { fetchAdminWeatherSnapshot, getEmergencyWeather } from "@/lib/weather.functions";

const headers = {
  "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=21600",
  "Content-Type": "application/json; charset=utf-8",
};

export const Route = createFileRoute("/api/admin/weather")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await fetchAdminWeatherSnapshot(), { headers });
        } catch (error) {
          console.error("[weather-api] live forecast unavailable", error);
          return Response.json(getEmergencyWeather(), { headers });
        }
      },
    },
  },
});
