import { createFileRoute } from "@tanstack/react-router";
import { NixeloLanding } from "@/components/NixeloLanding";

export const Route = createFileRoute("/")({
  component: LandingPage,
  // SSR enabled by default for SEO
});

function LandingPage() {
  return <NixeloLanding />;
}
