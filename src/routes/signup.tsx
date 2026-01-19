import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignUpForm } from "@/components/auth";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signup")({
  component: SignUpRoute,
  ssr: false,
});

function SignUpRoute() {
  return (
    <AuthRedirect>
      <AuthPageLayout title="Create an account" subtitle="Sign up to get started with Nixelo">
        <SignUpForm />
        <Typography variant="muted" className="text-center mt-4">
          Already have an account? <AuthLink to={ROUTES.signin.path}>Sign in</AuthLink>
        </Typography>
      </AuthPageLayout>
    </AuthRedirect>
  );
}
