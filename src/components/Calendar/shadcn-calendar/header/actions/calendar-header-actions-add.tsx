import { Button } from "@/components/ui/Button";
import { Plus } from "@/lib/icons";
import { useCalendarContext } from "../../calendar-context";

export function CalendarHeaderActionsAdd(): React.ReactElement {
  const { onAddEvent } = useCalendarContext();
  return (
    <Button
      className="flex items-center gap-1 bg-primary text-background"
      onClick={() => onAddEvent()}
    >
      <Plus />
      Add Event
    </Button>
  );
}
