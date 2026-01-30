import { Columns2, Grid3X3, ListIcon } from "@/lib/icons";
import type { Mode } from "./calendar-types";

export const calendarModeIconMap: Record<Mode, React.ReactNode> = {
  day: <ListIcon />,
  week: <Columns2 />,
  month: <Grid3X3 />,
};
