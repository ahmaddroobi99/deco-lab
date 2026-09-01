import { createFileRoute } from "@tanstack/react-router";
import { HEALTH_PAYLOAD } from "@/lib/deco/api-contract";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => Response.json(HEALTH_PAYLOAD),
    },
  },
});
