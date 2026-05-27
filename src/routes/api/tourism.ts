import { createFileRoute } from "@tanstack/react-router";

import { handleTourismApiRequest } from "@/lib/tourapi-api-route";

export const Route = createFileRoute("/api/tourism")({
  server: {
    handlers: {
      GET: async ({ request }) => handleTourismApiRequest(request, {}, fetch),
    },
  },
});
