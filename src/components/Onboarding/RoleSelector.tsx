import { Check, User, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";

interface RoleSelectorProps {
  onSelect: (role: "team_lead" | "team_member") => void;
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function RoleCard({ icon, title, description, selected, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-6 rounded-xl border-2 text-left transition-all duration-200",
        "hover:border-primary-500 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "dark:focus:ring-offset-ui-bg-primary-dark",
        selected
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
          : "border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-secondary-dark",
      )}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={cn(
            "p-4 rounded-full",
            selected
              ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600"
              : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark",
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
            {title}
          </h3>
          <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
            {description}
          </Typography>
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
        )}
      </div>
    </button>
  );
}

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [selected, setSelected] = useState<"team_lead" | "team_member" | null>(null);

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RoleCard
          icon={<Users className="w-8 h-8" />}
          title="Team Lead"
          description="I'll be managing projects and inviting team members"
          selected={selected === "team_lead"}
          onClick={() => setSelected("team_lead")}
        />
        <RoleCard
          icon={<User className="w-8 h-8" />}
          title="Team Member"
          description="I'll be joining a team and working on tasks"
          selected={selected === "team_member"}
          onClick={() => setSelected("team_member")}
        />
      </div>

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={!selected}
          className="min-w-[200px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
