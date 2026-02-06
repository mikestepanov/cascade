import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Badge } from "../ui/Badge";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface FocusTask {
  _id: string;
  key: string;
  title: string;
  priority: string;
  status: string;
  projectName: string;
  projectKey: string;
}

interface FocusZoneProps {
  task: FocusTask | null | undefined;
}

export function FocusZone({ task }: FocusZoneProps) {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();

  if (!task) return null;

  const handleClick = () => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: task.projectKey },
    });
  };

  return (
    <div className="mb-8">
      <Typography
        variant="small"
        color="tertiary"
        className="uppercase tracking-widest mb-2 font-bold"
      >
        Focus Item
      </Typography>
      <Card
        hoverable
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        tabIndex={0}
        role="button"
        aria-label={`Focus task: ${task.title}`}
        className="group relative overflow-hidden hover:shadow-card-hover transition-shadow"
      >
        {/* Brand left border accent */}
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <CardBody className="p-6 pl-7">
          <Flex direction="column" gap="md">
            <Flex justify="between" align="center">
              <Badge variant="primary">{task.priority.toUpperCase()}</Badge>
              <Typography variant="small" color="secondary" className="font-mono">
                {task.key}
              </Typography>
            </Flex>

            <div>
              <Typography variant="h3" className="text-xl sm:text-2xl font-bold">
                {task.title}
              </Typography>
              <Typography variant="muted" className="mt-1">
                In project: <span className="font-semibold text-ui-text">{task.projectName}</span>
              </Typography>
            </div>

            <Flex justify="end">
              <span className="text-sm font-medium text-brand">View Task →</span>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    </div>
  );
}
