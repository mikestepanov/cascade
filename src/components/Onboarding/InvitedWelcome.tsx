import { PartyPopper } from "lucide-react";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface InvitedWelcomeProps {
  inviterName: string;
  onStartTour: () => void;
  onSkip: () => void;
}

export function InvitedWelcome({ inviterName, onStartTour, onSkip }: InvitedWelcomeProps) {
  return (
    <div className="text-center space-y-8">
      {/* Icon */}
      <Flex justify="center">
        <div className="p-6 rounded-full bg-primary-100 dark:bg-primary-900/30">
          <PartyPopper className="w-16 h-16 text-primary-600" />
        </div>
      </Flex>

      {/* Welcome Message */}
      <div className="space-y-3">
        <Typography variant="h1" className="text-3xl font-bold text-ui-text-primary">
          Welcome to Nixelo!
        </Typography>
        <Typography className="text-lg text-ui-text-secondary">
          <span className="font-medium text-ui-text-primary">{inviterName}</span> invited you to
          collaborate
        </Typography>
      </div>

      {/* Brief Description */}
      <div className="bg-ui-bg-primary rounded-xl p-6 text-left">
        <Typography variant="h3" className="font-medium text-ui-text-primary mb-3">
          What you can do in Nixelo:
        </Typography>
        <ul className="space-y-2 text-ui-text-secondary">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            View and work on project issues assigned to you
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            Collaborate on documents in real-time
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            Track time and participate in sprints
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            Get notifications for mentions and updates
          </li>
        </ul>
      </div>

      {/* Actions */}
      <Flex gap="md" justify="center">
        <Button variant="primary" size="lg" onClick={onStartTour}>
          Take a quick tour
        </Button>
        <Button variant="secondary" size="lg" onClick={onSkip}>
          Skip to dashboard
        </Button>
      </Flex>

      {/* Note */}
      <Typography className="text-sm text-ui-text-tertiary">
        Your team lead will add you to projects. You'll see them on your dashboard.
      </Typography>
    </div>
  );
}
