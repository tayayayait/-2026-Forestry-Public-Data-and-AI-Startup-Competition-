import { createFileRoute } from "@tanstack/react-router";

import { handleForestEducationProgramsApiRequest } from "@/lib/forest-education-api-route";

export const Route = createFileRoute("/api/forest-education-programs")({
  server: {
    handlers: {
      GET: async ({ request }) => handleForestEducationProgramsApiRequest(request, {}, fetch),
    },
  },
});
