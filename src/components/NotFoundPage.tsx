import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export function NotFoundPage() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="min-h-screen bg-ui-bg animate-fade-in"
    >
      <Flex direction="column" align="center" className="max-w-md text-center px-6">
        {/* Subtle icon */}
        <Flex align="center" justify="center" className="mb-8 h-20 w-20 rounded-full bg-ui-bg-soft">
          <FileQuestion className="h-10 w-10 text-ui-text-tertiary" />
        </Flex>

        {/* Large error code with tight tracking */}
        <Typography variant="h1" className="text-8xl font-bold tracking-tightest text-ui-text">
          404
        </Typography>

        {/* Message with secondary text styling */}
        <Typography className="mt-4 text-lg text-ui-text-secondary">Page not found</Typography>
        <Typography className="mt-2 text-ui-text-tertiary">
          The page you are looking for does not exist or has been moved.
        </Typography>

        {/* Return home button using Button component */}
        <Button asChild size="lg" className="mt-8">
          <Link to={ROUTES.home.path}>Return home</Link>
        </Button>
      </Flex>
    </Flex>
  );
}
