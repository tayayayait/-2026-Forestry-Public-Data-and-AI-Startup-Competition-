import { createFileRoute } from "@tanstack/react-router";

import { handleBarrierFreeTourismApiRequest } from "@/lib/barrier-free-tourism-api-route";

export const Route = createFileRoute("/api/barrier-free-tourism")({
  server: {
    handlers: {
      GET: async ({ request }) => handleBarrierFreeTourismApiRequest(request, {}, fetch),
    },
  },
});
