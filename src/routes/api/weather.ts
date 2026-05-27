import { createFileRoute } from "@tanstack/react-router";

import { handleWeatherApiRequest } from "@/lib/weather-api-route";

export const Route = createFileRoute("/api/weather")({
  server: {
    handlers: {
      GET: async ({ request }) => handleWeatherApiRequest(request, {}, fetch),
    },
  },
});
