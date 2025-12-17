import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { useCompany } from "@/hooks/useCompanyContext";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
  ChevronDown,
  ChevronRight,
  Clock,
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
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarState();

  // Get company from URL context
  const { companySlug, companyName } = useCompany();

  // All hooks must be called unconditionally
  const isAdmin = useQuery(api.users.isCompanyAdmin);
  const showTimeTracking = isAdmin === true;

  // Section expand states
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  // Data
  const documentsResult = useQuery(api.documents.list, { limit: 11 });
  const documents = documentsResult?.documents;
  const projects = useQuery(api.projects.list);

  // Mutations
  const createDocument = useMutation(api.documents.create);
  const createProject = useMutation(api.projects.create);

  const isActive = (pathPart: string) => {
    return location.pathname.includes(pathPart);
  };

  const handleCreateDocument = async () => {
    try {
      const docId = await createDocument({
        title: "Untitled Document",
        isPublic: false,
      });
      navigate({ to: ROUTES.documents.detail(companySlug, docId) });
      showSuccess("Document created");
      closeMobile();
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  const handleCreateProject = async () => {
    const key = `PROJ${Date.now().toString(36).toUpperCase().slice(-4)}`;
    try {
      await createProject({
        name: "New Project",
        key,
        isPublic: false,
        boardType: "kanban",
      });
      navigate({ to: ROUTES.projects.board(companySlug, key) });
      showSuccess("Project created");
      closeMobile();
    } catch (error) {
      showError(error, "Failed to create project");
    }
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
              <Link to={ROUTES.dashboard(companySlug)} onClick={handleNavClick}>
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
              to={ROUTES.dashboard(companySlug)}
              icon={Home}
              label="Dashboard"
              isActive={isActive("/dashboard")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />

            {/* Documents Section */}
            <CollapsibleSection
              icon={FileText}
              label="Documents"
              isExpanded={docsExpanded}
              onToggle={() => setDocsExpanded(!docsExpanded)}
              isActive={isActive("/documents")}
              isCollapsed={isCollapsed}
              onAdd={handleCreateDocument}
              navigateTo={ROUTES.documents.list(companySlug)}
              onClick={handleNavClick}
            >
              {documents?.slice(0, 10).map((doc) => (
                <NavSubItem
                  key={doc._id}
                  to={ROUTES.documents.detail(companySlug, doc._id)}
                  label={doc.title}
                  isActive={location.pathname.includes(`/documents/${doc._id}`)}
                  onClick={handleNavClick}
                />
              ))}
              {documents && documents.length > 10 && (
                <Typography variant="p" color="tertiary" className="px-3 py-1 text-xs">
                  +{documents.length - 10} more
                </Typography>
              )}
            </CollapsibleSection>

            {/* Workspaces Section */}
            <CollapsibleSection
              icon={FolderKanban}
              label="Workspaces"
              isExpanded={projectsExpanded}
              onToggle={() => setProjectsExpanded(!projectsExpanded)}
              isActive={isActive("/projects")}
              isCollapsed={isCollapsed}
              onAdd={handleCreateProject}
              navigateTo={ROUTES.projects.list(companySlug)}
              onClick={handleNavClick}
            >
              {projects?.slice(0, 10).map((project) => (
                <NavSubItem
                  key={project._id}
                  to={ROUTES.projects.board(companySlug, project.key)}
                  label={`${project.key} - ${project.name}`}
                  isActive={location.pathname.includes(`/projects/${project.key}`)}
                  onClick={handleNavClick}
                />
              ))}
              {projects && projects.length > 10 && (
                <Typography variant="p" color="tertiary" className="px-3 py-1 text-xs">
                  +{projects.length - 10} more
                </Typography>
              )}
            </CollapsibleSection>

            {/* Time Tracking (admin only) */}
            {showTimeTracking && (
              <NavItem
                to={ROUTES.timeTracking(companySlug)}
                icon={Clock}
                label="Time Tracking"
                isActive={isActive("/time-tracking")}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
            )}
          </Flex>

          {/* Bottom section - Settings */}
          <div className="p-2 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
            <NavItem
              to={ROUTES.settings.profile(companySlug)}
              icon={Settings}
              label="Settings"
              isActive={isActive("/settings")}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
          </div>
        </Flex>
      </aside>
    </TooltipProvider>
  );
}

// Nav Item Component
interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon: Icon, label, isActive, isCollapsed, onClick }: NavItemProps) {
  const content = (
    <Link
      to={to}
      onClick={onClick}
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
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  isCollapsed: boolean;
  onAdd: () => void;
  navigateTo: string;
  onClick?: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  icon: Icon,
  label,
  isExpanded,
  onToggle,
  isActive,
  isCollapsed,
  onAdd,
  navigateTo,
  onClick,
  children,
}: CollapsibleSectionProps) {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={navigateTo}
            onClick={onClick}
            className={cn(
              "flex items-center justify-center px-2 py-2 rounded-md transition-colors",
              isActive
                ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark",
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
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
        <Link
          to={navigateTo}
          onClick={onClick}
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
interface NavSubItemProps {
  to: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavSubItem({ to, label, isActive, onClick }: NavSubItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "block px-3 py-1.5 rounded-md text-sm truncate transition-colors",
        isActive
          ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
          : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark",
      )}
    >
      {label}
    </Link>
  );
}
