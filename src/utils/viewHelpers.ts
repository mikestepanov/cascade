export type AppView = "dashboard" | "documents" | "projects" | "timesheet" | "calendar" | "settings";

export function shouldShowSidebar(activeView: AppView): boolean {
  return activeView === "documents" || activeView === "projects";
}

export function isDocumentsOrProjectsView(activeView: AppView): activeView is "documents" | "projects" {
  return activeView === "documents" || activeView === "projects";
}
