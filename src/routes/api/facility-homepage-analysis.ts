import { createFileRoute } from "@tanstack/react-router";

import { handleFacilityHomepageAnalysisApiRequest } from "@/lib/facility-homepage-analysis-api-route";

export const Route = createFileRoute("/api/facility-homepage-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => handleFacilityHomepageAnalysisApiRequest(request, {}, fetch),
    },
  },
});
