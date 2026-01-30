import type { Doc } from "@convex/_generated/dataModel";

// Derive palette color type from the schema — single source of truth
export type EventColor = NonNullable<Doc<"calendarEvents">["color"]>;

export const PALETTE_COLORS: EventColor[] = [
  "blue",
  "red",
  "green",
  "amber",
  "orange",
  "purple",
  "pink",
  "teal",
  "indigo",
  "gray",
];

export const EVENT_TYPE_DEFAULT_COLOR: Record<string, EventColor> = {
  meeting: "blue",
  deadline: "red",
  timeblock: "green",
  personal: "purple",
};

/** Full event card styling: bg, hover, border, text */
export const EVENT_COLOR_CLASSES: Record<
  EventColor,
  { bg: string; hover: string; border: string; text: string }
> = {
  blue: {
    bg: "bg-palette-blue-bg",
    hover: "hover:bg-palette-blue/10",
    border: "border-palette-blue",
    text: "text-palette-blue-text",
  },
  red: {
    bg: "bg-palette-red-bg",
    hover: "hover:bg-palette-red/10",
    border: "border-palette-red",
    text: "text-palette-red-text",
  },
  green: {
    bg: "bg-palette-green-bg",
    hover: "hover:bg-palette-green/10",
    border: "border-palette-green",
    text: "text-palette-green-text",
  },
  amber: {
    bg: "bg-palette-amber-bg",
    hover: "hover:bg-palette-amber/10",
    border: "border-palette-amber",
    text: "text-palette-amber-text",
  },
  orange: {
    bg: "bg-palette-orange-bg",
    hover: "hover:bg-palette-orange/10",
    border: "border-palette-orange",
    text: "text-palette-orange-text",
  },
  purple: {
    bg: "bg-palette-purple-bg",
    hover: "hover:bg-palette-purple/10",
    border: "border-palette-purple",
    text: "text-palette-purple-text",
  },
  pink: {
    bg: "bg-palette-pink-bg",
    hover: "hover:bg-palette-pink/10",
    border: "border-palette-pink",
    text: "text-palette-pink-text",
  },
  teal: {
    bg: "bg-palette-teal-bg",
    hover: "hover:bg-palette-teal/10",
    border: "border-palette-teal",
    text: "text-palette-teal-text",
  },
  indigo: {
    bg: "bg-palette-indigo-bg",
    hover: "hover:bg-palette-indigo/10",
    border: "border-palette-indigo",
    text: "text-palette-indigo-text",
  },
  gray: {
    bg: "bg-palette-gray-bg",
    hover: "hover:bg-palette-gray/10",
    border: "border-palette-gray",
    text: "text-palette-gray-text",
  },
};

/** Badge styling: bg + text combined */
export const EVENT_COLOR_BADGE: Record<EventColor, string> = {
  blue: "bg-palette-blue-bg text-palette-blue-text",
  red: "bg-palette-red-bg text-palette-red-text",
  green: "bg-palette-green-bg text-palette-green-text",
  amber: "bg-palette-amber-bg text-palette-amber-text",
  orange: "bg-palette-orange-bg text-palette-orange-text",
  purple: "bg-palette-purple-bg text-palette-purple-text",
  pink: "bg-palette-pink-bg text-palette-pink-text",
  teal: "bg-palette-teal-bg text-palette-teal-text",
  indigo: "bg-palette-indigo-bg text-palette-indigo-text",
  gray: "bg-palette-gray-bg text-palette-gray-text",
};

/** Color picker styling: bg swatch + selection ring */
export const COLOR_PICKER_CLASSES: Record<EventColor, { bg: string; ring: string }> = {
  blue: { bg: "bg-palette-blue", ring: "ring-palette-blue" },
  red: { bg: "bg-palette-red", ring: "ring-palette-red" },
  green: { bg: "bg-palette-green", ring: "ring-palette-green" },
  amber: { bg: "bg-palette-amber", ring: "ring-palette-amber" },
  orange: { bg: "bg-palette-orange", ring: "ring-palette-orange" },
  purple: { bg: "bg-palette-purple", ring: "ring-palette-purple" },
  pink: { bg: "bg-palette-pink", ring: "ring-palette-pink" },
  teal: { bg: "bg-palette-teal", ring: "ring-palette-teal" },
  indigo: { bg: "bg-palette-indigo", ring: "ring-palette-indigo" },
  gray: { bg: "bg-palette-gray", ring: "ring-palette-gray" },
};

/** Dot indicator: solid bg color */
export const DOT_COLOR_CLASSES: Record<EventColor, string> = {
  blue: "bg-palette-blue",
  red: "bg-palette-red",
  green: "bg-palette-green",
  amber: "bg-palette-amber",
  orange: "bg-palette-orange",
  purple: "bg-palette-purple",
  pink: "bg-palette-pink",
  teal: "bg-palette-teal",
  indigo: "bg-palette-indigo",
  gray: "bg-palette-gray",
};

export function getEventColorClasses(color: string): {
  bg: string;
  hover: string;
  border: string;
  text: string;
} {
  return EVENT_COLOR_CLASSES[color as EventColor] ?? EVENT_COLOR_CLASSES.blue;
}

export function getEventBadgeClass(eventType: string, color?: string | null): string {
  const resolved = (color ?? EVENT_TYPE_DEFAULT_COLOR[eventType] ?? "blue") as EventColor;
  return EVENT_COLOR_BADGE[resolved] ?? EVENT_COLOR_BADGE.blue;
}
