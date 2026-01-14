import { api } from "@convex/_generated/api";
import FacePile from "@convex-dev/presence/facepile";
import usePresence from "@convex-dev/presence/react";
import { Flex } from "@/components/ui/Flex";

interface PresenceIndicatorProps {
  roomId: string;
  userId: string;
}

export function PresenceIndicator({ roomId, userId }: PresenceIndicatorProps) {
  const presenceState = usePresence(api.presence, roomId, userId);

  if (!presenceState) {
    return null;
  }

  return (
    <Flex align="center" className="space-x-2">
      <span className="text-sm text-ui-text-secondary">
        {presenceState.length} {presenceState.length === 1 ? "person" : "people"} editing
      </span>
      <FacePile presenceState={presenceState} />
    </Flex>
  );
}
