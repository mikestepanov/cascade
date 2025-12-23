import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TimeTrackingPage } from "./TimeTrackingPage";

interface ProjectTimesheetProps {
  projectKey: string;
}

/**
 * Wrapper for TimeTrackingPage that resolves project key to ID
 */
export default function ProjectTimesheet({ projectKey }: ProjectTimesheetProps) {
  const project = useQuery(api.projects.getByKey, { key: projectKey });

  if (project === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-ui-text-secondary">Project not found</p>
      </div>
    );
  }

  return <TimeTrackingPage projectId={project._id} userRole={project.userRole} />;
}
