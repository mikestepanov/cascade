import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link, type LinkProps, useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { CreateTeamModal } from "@/components/CreateTeamModal";
import { SidebarTeamItem } from "@/components/sidebar/SidebarTeamItem";
import { ROUTE_PATTERNS } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  FolderKanban,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
import { Tooltip, TooltipProvider } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarState();

  // Get company from URL context
  const { companySlug, companyName, companyId } = useCompany();

  // All hooks must be called unconditionally
  const isAdmin = useQuery(api.users.isCompanyAdmin);
  const showTimeTracking = isAdmin === true;

  // Section expand states
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [createTeamWorkspace, setCreateTeamWorkspace] = useState<{
    id: Id<"workspaces">;
    slug: string;
  } | null>(null);

  // Data
  const documentsResult = useQuery(api.documents.list, { limit: 11 });
  const documents = documentsResult?.documents;
  const workspaces = useQuery(api.workspaces.list, { companyId });
  const teams = useQuery(api.teams.getCompanyTeams, { companyId });
  const myProjects = useQuery(api.dashboard.getMyProjects);
  const defaultProject = myProjects?.[0];

  // Mutations
  const createDocument = useMutation(api.documents.create);
  const createWorkspace = useMutation(api.workspaces.create);
  // const createProject = useMutation(api.projects.createProject); // TODO: Add project creation UI

  const isActive = (pathPart: string) => {
    return location.pathname.includes(pathPart);
  };

  const handleCreateDocument = async () => {
    try {
      const docId = await createDocument({
        title: "Untitled Document",
        isPublic: false,
      });
      navigate({
        to: ROUTE_PATTERNS.documents.detail,
        params: { companySlug, id: docId },
      });
      showSuccess("Document created");
      closeMobile();
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const slug = `workspace-${Date.now().toString(36)}`;
      await createWorkspace({
        name: "New Workspace",
        slug,
        companyId,
      });
      navigate({
        to: ROUTE_PATTERNS.workspaces.detail,
        params: { companySlug, workspaceSlug: slug },
      });
      showSuccess("Workspace created");
      closeMobile();
    } catch (error) {
      showError(error, "Failed to create workspace");
    }
  };

  const toggleWorkspace = (workspaceSlug: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceSlug)) {
        next.delete(workspaceSlug);
      } else {
        next.add(workspaceSlug);
      }
      return next;
    });
  };

  const toggleTeam = (teamSlug: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamSlug)) {
        next.delete(teamSlug);
      } else {
        next.add(teamSlug);
      }
      return next;
    });
  };

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay - clickable to close sidebar */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-ui-bg-overlay dark:bg-ui-bg-overlay-dark z-40 lg:hidden"
          onClick={closeMobile}
          onKeyDown={(e) => e.key === "Escape" && closeMobile()}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative z-50 lg:z-auto h-screen",
          "bg-ui-bg-primary dark:bg-ui-bg-primary-dark",
          "border-r border-ui-border-primary dark:border-ui-border-primary-dark",
          "transition-all duration-200 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Flex direction="column" className="h-full">
          {/* Header with company name and collapse toggle */}
          <Flex
            align="center"
            justify="between"
            className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark"
          >
            {!isCollapsed && (
              <Link to={ROUTE_PATTERNS.dashboard} params={{ companySlug }} onClick={handleNavClick}>
                <Typography variant="h3" className="text-lg font-bold truncate max-w-[160px]">
                  {companyName}
                </Typography>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={cn("h-9 w-9", isCollapsed && "mx-auto")}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>
          </Flex>

          {/* Navigation */}
          <Flex as="nav" direction="column" gap="xs" className="flex-1 overflow-y-auto p-2">
            {/* Dashboard */}
            <NavItem
              to={ROUTE_PATTERNS.dashboard}
              params={{ companySlug }}
              icon={Home}
              label="Dashboard"
              isActive={isActive("/dashboard")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
              data-tour="nav-dashboard"
            />
            {/* Calendar - Links to first project's calendar */}
            {defaultProject && (
              <NavItem
                to={ROUTE_PATTERNS.projects.calendar}
                params={{ companySlug, key: defaultProject.key }}
                icon={Calendar}
                label="Calendar"
                isActive={isActive("/calendar")}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
                data-tour="nav-calendar"
              />
            )}
            {/* Documents Section */}
            <CollapsibleSection
              icon={FileText}
              label="Documents"
              isExpanded={docsExpanded}
              onToggle={() => setDocsExpanded(!docsExpanded)}
              isActive={isActive("/documents")}
              isCollapsed={isCollapsed}
              onAdd={handleCreateDocument}
              to={ROUTE_PATTERNS.documents.list}
              params={{ companySlug }}
              onClick={handleNavClick}
              data-tour="nav-documents"
            >
              <NavSubItem
                to={ROUTE_PATTERNS.documents.templates}
                params={{ companySlug }}
                label="Templates"
                isActive={location.pathname.includes("/documents/templates")}
                onClick={handleNavClick}
                icon={Copy}
              />
              <div className="h-px bg-ui-border-primary dark:bg-ui-border-primary-dark my-1 mx-2" />
              {(documents?.documents ?? []).slice(0, 10).map((doc: Doc<"documents">) => (
                <NavSubItem
                  key={doc._id}
                  to={ROUTE_PATTERNS.documents.detail}
                  params={{ companySlug, id: doc._id }}
                  label={doc.title}
                  isActive={location.pathname.includes(`/documents/${doc._id}`)}
                  onClick={handleNavClick}
                />
              ))}
              {(documents?.documents?.length ?? 0) > 10 && (
                <Typography variant="p" color="tertiary" className="px-3 py-1 text-xs">
                  +{(documents?.documents?.length ?? 0) - 10} more
                </Typography>
              )}
            </CollapsibleSection>
            {/* Workspaces Section */}
            <CollapsibleSection
              icon={FolderKanban}
              label="Workspaces"
              isExpanded={workspacesExpanded}
              onToggle={() => setWorkspacesExpanded(!workspacesExpanded)}
              isActive={isActive("/workspaces")}
              isCollapsed={isCollapsed}
              onAdd={handleCreateWorkspace}
              to={ROUTE_PATTERNS.workspaces.list}
              params={{ companySlug }}
              onClick={handleNavClick}
              data-tour="nav-projects"
            >
              {workspaces?.map((workspace: Doc<"workspaces">) => {
                const workspaceTeams =
                  teams?.filter((t: Doc<"teams">) => t.workspaceId === workspace._id) || [];
                const isWorkspaceExpanded = expandedWorkspaces.has(workspace.slug);

                return (
                  <div key={workspace._id} className="ml-2 group">
                    {/* Workspace Item */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleWorkspace(workspace.slug)}
                        className="h-6 w-6 p-0.5"
                      >
                        {isWorkspaceExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <NavSubItem
                        to={ROUTE_PATTERNS.workspaces.detail}
                        params={{ companySlug, workspaceSlug: workspace.slug }}
                        label={workspace.name}
                        isActive={location.pathname.includes(`/workspaces/${workspace.slug}`)}
                        onClick={handleNavClick}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateTeamWorkspace({ id: workspace._id, slug: workspace.slug });
                        }}
                        className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Create new team"
                      >
                        <Plus className="w-4 h-4 text-ui-text-tertiary" />
                      </Button>
                    </div>

                    {/* Teams under workspace */}
                    {isWorkspaceExpanded &&
                      workspaceTeams.map((team: Doc<"teams">) => (
                        <SidebarTeamItem
                          key={team._id}
                          team={team}
                          workspaceSlug={workspace.slug}
                          companySlug={companySlug}
                          isExpanded={expandedTeams.has(team.slug)}
                          onToggle={toggleTeam}
                          onNavClick={handleNavClick}
                        />
                      ))}
                  </div>
                );
              })}
            </CollapsibleSection>
            {/* Time Tracking (admin only) */}
            {showTimeTracking && (
              <NavItem
                to={ROUTE_PATTERNS.timeTracking}
                params={{ companySlug }}
                icon={Clock}
                label="Time Tracking"
                isActive={isActive("/time-tracking")}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
                data-tour="nav-timesheet"
              />
            )}
          </Flex>

          {/* Bottom section - Settings */}
          <div className="p-2 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
            <NavItem
              to={ROUTE_PATTERNS.settings.profile}
              params={{ companySlug }}
              icon={Settings}
              label="Settings"
              isActive={isActive("/settings")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
              data-tour="nav-settings"
            />
          </div>
        </Flex>

        <CreateTeamModal
          isOpen={!!createTeamWorkspace}
          onClose={() => setCreateTeamWorkspace(null)}
          workspaceId={createTeamWorkspace?.id}
          workspaceSlug={createTeamWorkspace?.slug}
        />
      </aside>
    </TooltipProvider>
  );
}

// Nav Item Component
type NavItemProps = Omit<LinkProps<string>, "to"> & {
  to: string; // Explicitly passed
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  "data-tour"?: string;
  onClick?: (event: React.MouseEvent) => void;
};

function NavItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  "data-tour": dataTour,
  to,
  params,
  search,
  onClick,
  ...props
}: NavItemProps) {
  const content = (
    <Link
      to={to as any}
      params={params}
      search={search}
      onClick={onClick}
      {...props}
      data-tour={dataTour}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        "text-sm font-medium",
        isActive
          ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
          : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark",
        isCollapsed && "justify-center px-2",
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}

// Collapsible Section Component
// We use a union validation here: either it acts as a link (with valid to/params) or it doesn't.
// CollapsibleSection Component
type CollapsibleSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  isCollapsed: boolean;
  onAdd: () => void;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  "data-tour"?: string;
} & (
  | (Omit<LinkProps<string>, "to"> & { to: string }) // If 'to' is present, it must be a valid LinkProps
  | { to?: never; params?: never; search?: never } // If 'to' is absent, params/search/activeProps must be absent
);

function CollapsibleSection({
  icon: Icon,
  label,
  isExpanded,
  onToggle,
  isActive,
  isCollapsed,
  onAdd,
  children,
  "data-tour": dataTour,
  ...props
}: CollapsibleSectionProps) {
  // Safe type narrowing check
  const isLink = "to" in props && !!props.to;

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {isLink ? (
          <Link
            {...props}
            to={props.to as any}
            params={props.params}
            search={props.search}
            data-tour={dataTour}
            className={cn(
              "flex items-center justify-center px-2 py-2 rounded-md transition-colors",
              isActive
                ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark",
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        ) : (
          <div className="flex items-center justify-center px-2 py-2 rounded-md text-ui-text-secondary">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </Tooltip>
    );
  }

  return (
    <div>
      {/* Section header */}
      <Flex
        align="center"
        gap="sm"
        className={cn(
          "px-3 py-2 rounded-md transition-colors group",
          isActive
            ? "bg-brand-50 dark:bg-brand-900/30"
            : "hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-6 w-6 p-0.5"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-ui-text-tertiary" />
          )}
        </Button>
        {isLink ? (
          <Link
            {...props}
            to={props.to as any}
            className={cn(
              "flex-1 flex items-center gap-2 text-sm font-medium",
              isActive
                ? "text-brand-700 dark:text-brand-300"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark",
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ) : (
          <div className="flex-1 flex items-center gap-2 text-sm font-medium text-ui-text-secondary">
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Add new ${label.toLowerCase().slice(0, -1)}`}
        >
          <Plus className="w-4 h-4 text-ui-text-tertiary" />
        </Button>
      </Flex>

      {/* Section children */}
      {isExpanded && (
        <Flex direction="column" gap="none" className="ml-4 mt-1">
          {children}
        </Flex>
      )}
    </div>
  );
}

// Sub-item Component
type NavSubItemProps = Omit<LinkProps<string>, "to"> & {
  to: string;
  label: string;
  isActive: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: (event: React.MouseEvent) => void;
};

function NavSubItem({
  label,
  isActive,
  icon: Icon,
  to,
  params,
  onClick,
  ...props
}: NavSubItemProps) {
  return (
    <Link
      to={to as any}
      params={params}
      {...props}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm truncate transition-colors",
        isActive
          ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
          : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark",
      )}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">{label}</span>
    </Link>
  );
}
