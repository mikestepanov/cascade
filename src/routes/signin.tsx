import { createFileRoute } from "@tanstack/react-router";
import { AuthLink, AuthPageLayout, AuthRedirect, SignInForm } from "@/components/auth";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
  ssr: false,
});

function SignInRoute() {
  return (
    <AuthRedirect>
      <AuthPageLayout title="Welcome back" subtitle="Sign in to your account to continue">
        <SignInForm />
        <Typography variant="muted" className="text-center mt-4">
          Don't have an account? <AuthLink to={ROUTES.signup.path}>Sign up</AuthLink>
        </Typography>
      </AuthPageLayout>
    </AuthRedirect>
  );
}
