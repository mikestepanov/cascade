import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { FileAttachments } from "@/components/FileAttachments";
import { IssueDependencies } from "@/components/IssueDependencies";
import { IssueMetadataSection } from "@/components/IssueDetail/IssueMetadataSection";
import { IssueWatchers } from "@/components/IssueWatchers";
import { TimeTracker } from "@/components/TimeTracker";
import { Typography } from "@/components/ui/Typography";
import type { LabelInfo } from "../../../convex/lib/issueHelpers";

interface IssueDetailSidebarProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
  status: string;
  type: string;
  assignee?: { _id: string; name: string; image?: string } | null;
  reporter?: { _id: string; name: string; image?: string } | null;
  storyPoints?: number;
  labels: LabelInfo[];
  estimatedHours?: number;
  billingEnabled: boolean;
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section>
      <Typography
        variant="h4"
        className="text-xs font-bold uppercase tracking-widest text-ui-text-tertiary mb-4"
      >
        {title}
      </Typography>
      {children}
    </section>
  );
}

export function IssueDetailSidebar({
  issueId,
  projectId,
  status,
  type,
  assignee,
  reporter,
  storyPoints,
  labels,
  estimatedHours,
  billingEnabled,
}: IssueDetailSidebarProps): ReactNode {
  return (
    <div className="w-full md:w-80 lg:w-96 p-6 space-y-8 bg-ui-bg-secondary/30">
      <SidebarSection title="Properties">
        <IssueMetadataSection
          status={status}
          type={type}
          assignee={assignee}
          reporter={reporter}
          storyPoints={storyPoints}
          labels={labels}
        />
      </SidebarSection>

      <SidebarSection title="Time Tracking">
        <TimeTracker
          issueId={issueId}
          projectId={projectId}
          estimatedHours={estimatedHours}
          billingEnabled={billingEnabled}
        />
      </SidebarSection>

      <SidebarSection title="Attachments">
        <FileAttachments issueId={issueId} />
      </SidebarSection>

      <section className="space-y-6">
        <SidebarSection title="Watchers">
          <IssueWatchers issueId={issueId} />
        </SidebarSection>
        <SidebarSection title="Dependencies">
          <IssueDependencies issueId={issueId} projectId={projectId} />
        </SidebarSection>
      </section>
    </div>
  );
}
