import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import FacePile from "@convex-dev/presence/facepile";

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
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">
        {presenceState.length} {presenceState.length === 1 ? "person" : "people"} editing
      </span>
      <FacePile presenceState={presenceState} />
    </div>
  );
}
