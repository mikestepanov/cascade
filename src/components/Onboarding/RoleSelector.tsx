import { Check, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

interface RoleSelectorProps {
  onSelect: (role: "team_lead" | "team_member") => void;
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function RoleCard({ icon, title, description, selected, disabled, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "relative p-8 rounded-3xl border-2 text-left transition-all duration-300 cursor-pointer overflow-hidden group w-full",
        "hover:shadow-2xl hover:-translate-y-1 active:scale-95",
        selected
          ? "border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/10"
          : "border-ui-border-primary bg-ui-bg-primary hover:border-brand-400/50",
        disabled && "opacity-50 cursor-wait",
      )}
    >
      {/* Background Glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-brand-500 to-accent-500",
          selected && "opacity-10",
        )}
      />

      <div
        className={cn(
          "absolute top-4 right-4 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center z-10",
          selected
            ? "bg-brand-600 border-brand-600 scale-110 shadow-lg shadow-brand-500/40"
            : "border-ui-border-secondary group-hover:border-brand-400",
        )}
      >
        <Check
          className={cn(
            "w-3.5 h-3.5 text-white transition-all duration-300",
            selected ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
        />
      </div>

      <Flex direction="column" align="center" gap="xl" className="text-center relative z-10">
        <div
          className={cn(
            "p-5 rounded-2xl transition-all duration-500",
            selected
              ? "bg-brand-600 text-white scale-110 shadow-xl shadow-brand-500/25 rotate-3"
              : "bg-ui-bg-tertiary text-ui-text-tertiary group-hover:scale-110 group-hover:bg-brand-500/10 group-hover:text-brand-600 group-hover:-rotate-3",
          )}
        >
          {icon}
        </div>

        <div className="space-y-3">
          <Typography
            variant="h3"
            className="text-xl font-bold text-ui-text-primary tracking-tight"
          >
            {title}
          </Typography>
          <Typography className="text-sm text-ui-text-secondary leading-relaxed max-w-56">
            {description}
          </Typography>
        </div>
      </Flex>
    </button>
  );
}

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [isPending, setIsPending] = useState(false);
  const [localSelected, setLocalSelected] = useState<"team_lead" | "team_member" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSelect = (role: "team_lead" | "team_member") => {
    setLocalSelected(role);
    setIsPending(true);

    // Small delay for visual feedback before transitioning
    timeoutRef.current = setTimeout(() => {
      onSelect(role);
    }, 400);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <RoleCard
        icon={<Users className="w-10 h-10" />}
        title="Team Lead"
        description="I'll be building new projects and inviting my team to join"
        selected={localSelected === "team_lead"}
        disabled={isPending}
        onClick={() => handleSelect("team_lead")}
      />
      <RoleCard
        icon={<User className="w-10 h-10" />}
        title="Team Member"
        description="I'm joining an existing workspace to collaborate on tasks"
        selected={localSelected === "team_member"}
        disabled={isPending}
        onClick={() => handleSelect("team_member")}
      />
    </div>
  );
}
