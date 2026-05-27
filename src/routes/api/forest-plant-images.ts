import { createFileRoute } from "@tanstack/react-router";

import { handleForestPlantImagesApiRequest } from "@/lib/forest-plants-api-route";

export const Route = createFileRoute("/api/forest-plant-images")({
  server: {
    handlers: {
      GET: async ({ request }) => handleForestPlantImagesApiRequest(request, {}, fetch),
    },
  },
});
