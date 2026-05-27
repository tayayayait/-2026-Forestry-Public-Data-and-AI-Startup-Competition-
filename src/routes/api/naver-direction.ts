import { createFileRoute } from "@tanstack/react-router";

import { handleNaverDirectionApiRequest } from "@/lib/naver-direction-api-route";

export const Route = createFileRoute("/api/naver-direction")({
  server: {
    handlers: {
      GET: async ({ request }) => handleNaverDirectionApiRequest(request, {}, fetch),
    },
  },
});
