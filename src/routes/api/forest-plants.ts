import { createFileRoute } from "@tanstack/react-router";

import { handleForestPlantsApiRequest } from "@/lib/forest-plants-api-route";

export const Route = createFileRoute("/api/forest-plants")({
  server: {
    handlers: {
      GET: async ({ request }) => handleForestPlantsApiRequest(request, {}, fetch),
    },
  },
});
