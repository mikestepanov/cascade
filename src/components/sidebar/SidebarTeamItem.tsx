import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link, useLocation } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

interface SidebarTeamItemProps {
  team: Doc<"teams">;
  workspaceSlug: string;
  companySlug: string;
  isExpanded: boolean;
  onToggle: (slug: string) => void;
  onNavClick: () => void;
}

export function SidebarTeamItem({
  team,
  workspaceSlug,
  companySlug,
  isExpanded,
  onToggle,
  onNavClick,
}: SidebarTeamItemProps) {
  const location = useLocation();
  // Use regex to ensure we match /teams/slug exactly, or /teams/slug/...
  // but NOT /teams/slug-prefix... using word boundary or path separator check
  const isActive =
    location.pathname === `/teams/${team.slug}` ||
    location.pathname.startsWith(`/teams/${team.slug}/`);

  return (
    <div className="ml-4">
      {/* Team Header */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(team.slug)}
          className="h-6 w-6 p-0.5"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        <Link
          to={ROUTES.workspaces.teams.detail(companySlug, workspaceSlug, team.slug)}
          onClick={onNavClick}
          className={cn(
            "block px-3 py-1.5 rounded-md text-sm truncate transition-colors flex-1",
            isActive
              ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
              : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark",
          )}
        >
          {team.name}
        </Link>
      </div>

      {/* Lazy Loaded Projects */}
      {isExpanded && (
        <SidebarTeamProjects
          teamId={team._id}
          teamSlug={team.slug}
          workspaceSlug={workspaceSlug}
          companySlug={companySlug}
          onNavClick={onNavClick}
        />
      )}
    </div>
  );
}

function SidebarTeamProjects({
  teamId,
  teamSlug,
  workspaceSlug,
  companySlug,
  onNavClick,
}: {
  teamId: Id<"teams">;
  teamSlug: string;
  workspaceSlug: string;
  companySlug: string;
  onNavClick: () => void;
}) {
  const location = useLocation();
  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(api.projects.getTeamProjects, { teamId }, { initialNumItems: 10 });

  if (status === "LoadingFirstPage") {
    return <div className="ml-6 text-xs text-ui-text-tertiary px-3 py-1">Loading...</div>;
  }

  if (projects.length === 0) {
    return <div className="ml-6 text-xs text-ui-text-tertiary px-3 py-1">No projects</div>;
  }

  return (
    <div className="ml-6 border-l border-ui-border-primary dark:border-ui-border-primary-dark pl-1">
      {projects.map((project) => (
        <div key={project._id}>
          <Link
            to={ROUTES.workspaces.teams.projects.board(
              companySlug,
              workspaceSlug,
              teamSlug,
              project.key,
            )}
            onClick={onNavClick}
            className={cn(
              "block px-3 py-1.5 rounded-md text-sm truncate transition-colors",
              location.pathname === `/projects/${project.key}` ||
                location.pathname.startsWith(`/projects/${project.key}/`)
                ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark",
            )}
          >
            {project.key} - {project.name}
          </Link>
        </div>
      ))}

      {status === "CanLoadMore" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadMore(10)}
          className="ml-2 text-xs h-6 px-2 text-brand-600 dark:text-brand-400"
        >
          Load more...
        </Button>
      )}
    </div>
  );
}
