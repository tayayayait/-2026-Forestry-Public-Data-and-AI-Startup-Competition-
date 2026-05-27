import { createFileRoute } from "@tanstack/react-router";

import { handleTraditionalVillageForestsApiRequest } from "@/lib/traditional-village-forest-api-route";

export const Route = createFileRoute("/api/traditional-village-forests")({
  server: {
    handlers: {
      GET: async ({ request }) => handleTraditionalVillageForestsApiRequest(request, {}, fetch),
    },
  },
});
