import { createFileRoute } from "@tanstack/react-router";

import { handleHealingForestsApiRequest } from "@/lib/healing-forest-api-route";

export const Route = createFileRoute("/api/healing-forests")({
  server: {
    handlers: {
      GET: async ({ request }) => handleHealingForestsApiRequest(request, {}, fetch),
    },
  },
});
