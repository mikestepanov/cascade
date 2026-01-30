import { cn } from "@/lib/utils";

interface FilterCheckboxGroupProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  renderLabel?: (option: string) => React.ReactNode;
  maxHeight?: string;
}

export function FilterCheckboxGroup({
  label,
  options,
  selectedValues,
  onToggle,
  renderLabel,
  maxHeight,
}: FilterCheckboxGroupProps) {
  return (
    <div>
      <div className="block text-sm font-medium text-ui-text mb-2">{label}</div>
      <div className={cn("space-y-2", maxHeight)}>
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded"
            />
            <span className="text-sm capitalize">{renderLabel ? renderLabel(option) : option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
