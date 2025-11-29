import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { InviteAcceptPage } from "@/pages/InviteAcceptPage";

export const Route = createFileRoute("/invite/$token")({
  component: InviteRoute,
  ssr: false, // No SSR needed for invite page
});

function InviteRoute() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const handleAccepted = () => {
    // After accepting invite, go to onboarding
    navigate({ to: "/onboarding" });
  };

  return <InviteAcceptPage token={token} onAccepted={handleAccepted} />;
}
