import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LogOut, Settings } from "lucide-react";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import { Avatar } from "./ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Typography } from "./ui/Typography";

export function UserMenu() {
  const user = useQuery(api.users.getCurrent);
  const { signOut } = useAuthActions();
  const { companySlug } = useCompany();

  // Don't render menu if user data isn't ready
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label="User menu"
        >
          <Avatar name={user.name} email={user.email} src={user.image} size="md" variant="brand" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <Typography className="text-sm font-medium leading-none">
              {user.name || "User"}
            </Typography>
            <Typography className="text-xs leading-none text-ui-text-secondary dark:text-ui-text-secondary-dark truncate">
              {user.email}
            </Typography>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              to={ROUTE_PATTERNS.settings.profile}
              params={{ companySlug }}
              className="cursor-pointer w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="cursor-pointer text-status-error dark:text-status-error-dark focus:text-status-error dark:focus:text-status-error-dark"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
