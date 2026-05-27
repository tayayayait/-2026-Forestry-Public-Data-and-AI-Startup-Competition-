import { createFileRoute } from "@tanstack/react-router";

import { handleNaverGeocodeApiRequest } from "@/lib/naver-geocoding-api-route";

export const Route = createFileRoute("/api/geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => handleNaverGeocodeApiRequest(request, {}, fetch),
    },
  },
});
