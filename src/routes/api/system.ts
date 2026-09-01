import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PAYLOAD } from "@/lib/deco/api-contract";

export const Route = createFileRoute("/api/system")({
  server: {
    handlers: {
      GET: async () => Response.json(SYSTEM_PAYLOAD),
    },
  },
});
