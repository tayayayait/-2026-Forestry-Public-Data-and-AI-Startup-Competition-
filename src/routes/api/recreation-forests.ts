import { createFileRoute } from "@tanstack/react-router";

import { handleRecreationForestsApiRequest } from "@/lib/recreation-forest-api-route";

export const Route = createFileRoute("/api/recreation-forests")({
  server: {
    handlers: {
      GET: async ({ request }) => handleRecreationForestsApiRequest(request, {}, fetch),
    },
  },
});
