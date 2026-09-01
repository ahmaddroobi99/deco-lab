import { createFileRoute } from "@tanstack/react-router";
import { LabShell } from "@/components/lab/LabShell";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <LabShell />;
}
