import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
  "#14B8A6", // teal
];

export function ColorPicker({
  value,
  onChange,
  label = "Color",
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorPickerProps) {
  return (
    <div>
      <Typography
        as="div"
        variant="small"
        className="block font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2"
      >
        {label}
      </Typography>
      <Flex gap="sm" wrap align="center">
        {presetColors.map((presetColor) => (
          <button
            key={presetColor}
            type="button"
            onClick={() => onChange(presetColor)}
            className={cn(
              "w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ui-border-primary dark:focus:ring-ui-border-primary-dark",
              value === presetColor &&
                "ring-2 ring-offset-2 ring-ui-border-primary dark:ring-ui-border-primary-dark scale-110",
            )}
            style={{ backgroundColor: presetColor }}
            title={presetColor}
            aria-label={`Select color ${presetColor}`}
          />
        ))}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-ui-border-primary dark:border-ui-border-primary-dark"
            title="Custom color"
            aria-label="Custom color picker"
          />
          <span className="absolute -bottom-5 left-0 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark whitespace-nowrap">
            Custom
          </span>
        </div>
      </Flex>
    </div>
  );
}
