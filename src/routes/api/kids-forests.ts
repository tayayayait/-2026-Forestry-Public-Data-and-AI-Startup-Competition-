import { createFileRoute } from "@tanstack/react-router";

import { handleKidsForestFacilitiesApiRequest } from "@/lib/kids-forest-api-route";

export const Route = createFileRoute("/api/kids-forests")({
  server: {
    handlers: {
      GET: async ({ request }) => handleKidsForestFacilitiesApiRequest(request, {}, fetch),
    },
  },
});
