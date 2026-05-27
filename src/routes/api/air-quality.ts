import { createFileRoute } from "@tanstack/react-router";

import { handleAirQualityApiRequest } from "@/lib/air-quality-api-route";

export const Route = createFileRoute("/api/air-quality")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAirQualityApiRequest(request, {}, fetch),
    },
  },
});
