import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
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
      <Flex justify="center" align="center" className="py-12">
        <LoadingSpinner />
      </Flex>
    );
  }

  if (project === null) {
    return (
      <Flex justify="center" align="center" className="py-12">
        <Typography className="text-ui-text-secondary">Project not found</Typography>
      </Flex>
    );
  }

  return <TimeTrackingPage projectId={project._id} userRole={project.userRole} />;
}
