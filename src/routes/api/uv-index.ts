import { createFileRoute } from "@tanstack/react-router";

import { handleUvIndexApiRequest } from "@/lib/uv-index-api-route";

export const Route = createFileRoute("/api/uv-index")({
  server: {
    handlers: {
      GET: async ({ request }) => handleUvIndexApiRequest(request, {}, fetch),
    },
  },
});
