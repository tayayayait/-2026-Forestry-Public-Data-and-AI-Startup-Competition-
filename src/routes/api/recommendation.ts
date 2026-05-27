import { createFileRoute } from "@tanstack/react-router";

import { handleRecommendationApiRequest } from "@/lib/gemini-recommendation-api-route";

export const Route = createFileRoute("/api/recommendation")({
  server: {
    handlers: {
      POST: async ({ request }) => handleRecommendationApiRequest(request, {}, fetch),
    },
  },
});
