import type { Meta, StoryObj } from "@storybook/react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Flex } from "./Flex";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: "text",
      description: "Emoji or icon character to display",
    },
    title: {
      control: "text",
      description: "Main title text",
    },
    description: {
      control: "text",
      description: "Optional description text below the title",
    },
    variant: {
      control: "select",
      options: ["default", "info", "warning", "error"],
      description: "Visual variant for the icon color",
    },
    action: {
      description: "Optional action - can be a ReactNode or an object with label and onClick",
    },
    className: {
      control: "text",
      description: "Optional className for the container",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Stories - Individual Props
// ============================================================================

export const WithIcon: Story = {
  args: {
    icon: "📦",
    title: "Empty state with icon",
  },
};

export const WithTitle: Story = {
  args: {
    icon: "📄",
    title: "No documents found",
  },
};

export const WithDescription: Story = {
  args: {
    icon: "📁",
    title: "No files here",
    description: "This folder is empty. Upload files or create new ones to get started.",
  },
};

export const WithActionObject: Story = {
  args: {
    icon: "➕",
    title: "No items yet",
    description: "Create your first item to get started.",
    action: {
      label: "Create Item",
      onClick: () => alert("Create clicked!"),
    },
  },
};

export const WithActionNode: Story = {
  args: {
    icon: "🚀",
    title: "Ready to launch",
    description: "Start by creating your first project.",
    action: <Button leftIcon={<Plus className="h-4 w-4" />}>New Project</Button>,
  },
};

// ============================================================================
// Use Case Stories - No Data
// ============================================================================

export const NoDataProjects: Story = {
  args: {
    icon: "📋",
    title: "No projects yet",
    description: "Create a project to start organizing your work and collaborating with your team.",
    action: {
      label: "Create Project",
      onClick: () => alert("Create project clicked!"),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when a user has no projects.",
      },
    },
  },
};

export const NoDataDocuments: Story = {
  args: {
    icon: "📝",
    title: "No documents",
    description: "Documents you create will appear here. Start writing to capture your ideas.",
    action: {
      label: "New Document",
      onClick: () => alert("New document clicked!"),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when a user has no documents.",
      },
    },
  },
};

export const NoDataIssues: Story = {
  args: {
    icon: "✅",
    title: "No issues",
    description: "Great job! There are no open issues at the moment.",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when there are no issues to display.",
      },
    },
  },
};

export const NoDataTeamMembers: Story = {
  args: {
    icon: "👥",
    title: "No team members",
    description: "Invite colleagues to collaborate on this project.",
    action: {
      label: "Invite Members",
      onClick: () => alert("Invite clicked!"),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when a project has no team members.",
      },
    },
  },
};

// ============================================================================
// Use Case Stories - No Results
// ============================================================================

export const NoResultsSearch: Story = {
  args: {
    icon: "🔍",
    title: "No results found",
    description: "Try adjusting your search terms or filters to find what you're looking for.",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for search with no matching results.",
      },
    },
  },
};

export const NoResultsFilter: Story = {
  args: {
    icon: "🎯",
    title: "No matching items",
    description: "No items match your current filters. Try adjusting or clearing your filters.",
    action: {
      label: "Clear Filters",
      onClick: () => alert("Clear filters clicked!"),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for filtered view with no matching items.",
      },
    },
  },
};

export const NoResultsDateRange: Story = {
  args: {
    icon: "📅",
    title: "No events in this range",
    description: "There are no events scheduled for the selected date range.",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for calendar view with no events in selected range.",
      },
    },
  },
};

// ============================================================================
// Use Case Stories - Error States
// ============================================================================

export const ErrorLoadFailed: Story = {
  args: {
    icon: "⚠️",
    title: "Failed to load data",
    description: "Something went wrong while loading. Please try again.",
    variant: "error",
    action: (
      <Button
        variant="outline"
        leftIcon={<RefreshCw className="h-4 w-4" />}
        onClick={() => alert("Retry clicked!")}
      >
        Try Again
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when data fails to load. Uses error variant for red icon.",
      },
    },
  },
};

export const ErrorOffline: Story = {
  args: {
    icon: "📡",
    title: "You're offline",
    description: "Check your internet connection and try again.",
    variant: "warning",
    action: {
      label: "Retry",
      onClick: () => alert("Retry clicked!"),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when the user is offline. Uses warning variant.",
      },
    },
  },
};

export const ErrorPermission: Story = {
  args: {
    icon: "🔒",
    title: "Access denied",
    description:
      "You don't have permission to view this content. Contact your administrator for access.",
    variant: "error",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for when the user lacks permission. Uses error variant.",
      },
    },
  },
};

export const ErrorNotFound: Story = {
  args: {
    icon: "🔎",
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
    variant: "warning",
    action: {
      label: "Go Home",
      onClick: () => alert("Go home clicked!"),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for 404 not found errors. Uses warning variant.",
      },
    },
  },
};

// ============================================================================
// Variant Stories
// ============================================================================

export const VariantDefault: Story = {
  args: {
    icon: "📦",
    title: "Default variant",
    description: "Standard empty state with tertiary icon color.",
    variant: "default",
  },
};

export const VariantInfo: Story = {
  args: {
    icon: "ℹ️",
    title: "Info variant",
    description: "Informational empty state with blue icon.",
    variant: "info",
  },
};

export const VariantWarning: Story = {
  args: {
    icon: "⚠️",
    title: "Warning variant",
    description: "Warning state with yellow/orange icon.",
    variant: "warning",
  },
};

export const VariantError: Story = {
  args: {
    icon: "❌",
    title: "Error variant",
    description: "Error state with red icon.",
    variant: "error",
  },
};

export const AllVariants: Story = {
  render: () => (
    <Flex gap="md" wrap className="max-w-4xl">
      <div className="w-56 border border-ui-border rounded-lg">
        <EmptyState icon="📦" title="Default" description="Tertiary color" variant="default" />
      </div>
      <div className="w-56 border border-ui-border rounded-lg">
        <EmptyState icon="ℹ️" title="Info" description="Blue color" variant="info" />
      </div>
      <div className="w-56 border border-ui-border rounded-lg">
        <EmptyState icon="⚠️" title="Warning" description="Yellow/orange" variant="warning" />
      </div>
      <div className="w-56 border border-ui-border rounded-lg">
        <EmptyState icon="❌" title="Error" description="Red color" variant="error" />
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available variants side by side.",
      },
    },
  },
};

// ============================================================================
// Complete Examples
// ============================================================================

export const CompleteWithAllProps: Story = {
  args: {
    icon: "🎉",
    title: "Welcome to Nixelo",
    description:
      "Get started by creating your first project. You can invite team members, track issues, and collaborate on documents all in one place.",
    action: {
      label: "Get Started",
      onClick: () => alert("Get started clicked!"),
    },
    className: "max-w-md",
  },
  parameters: {
    docs: {
      description: {
        story: "Complete example showing all props in use.",
      },
    },
  },
};

export const CompleteWithCustomAction: Story = {
  args: {
    icon: "💡",
    title: "Ready to collaborate?",
    description: "Choose how you'd like to get started with your new workspace.",
    action: (
      <Flex gap="sm">
        <Button variant="outline">Watch Tutorial</Button>
        <Button>Create Project</Button>
      </Flex>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Complete example with multiple action buttons using ReactNode.",
      },
    },
  },
};

export const CompleteMinimal: Story = {
  args: {
    icon: "📭",
    title: "Inbox zero",
  },
  parameters: {
    docs: {
      description: {
        story: "Minimal empty state with just icon and title.",
      },
    },
  },
};

// ============================================================================
// Grid Comparison
// ============================================================================

export const AllUseCases: Story = {
  render: () => (
    <Flex direction="column" gap="lg" className="max-w-4xl">
      <Flex gap="md" wrap>
        <div className="w-72 border border-ui-border rounded-lg">
          <EmptyState
            icon="📦"
            title="No data"
            description="Empty collection state"
            action={{ label: "Add Item", onClick: () => {} }}
          />
        </div>
        <div className="w-72 border border-ui-border rounded-lg">
          <EmptyState icon="🔍" title="No results" description="Search returned no matches" />
        </div>
        <div className="w-72 border border-ui-border rounded-lg">
          <EmptyState
            icon="⚠️"
            title="Error"
            description="Something went wrong"
            action={{ label: "Retry", onClick: () => {} }}
          />
        </div>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of the three main use cases: no data, no results, and error states.",
      },
    },
  },
};

export const IconVariations: Story = {
  render: () => (
    <Flex gap="md" wrap className="max-w-4xl">
      <div className="w-48 border border-ui-border rounded-lg">
        <EmptyState icon="📋" title="Projects" />
      </div>
      <div className="w-48 border border-ui-border rounded-lg">
        <EmptyState icon="📝" title="Documents" />
      </div>
      <div className="w-48 border border-ui-border rounded-lg">
        <EmptyState icon="🎯" title="Issues" />
      </div>
      <div className="w-48 border border-ui-border rounded-lg">
        <EmptyState icon="📅" title="Events" />
      </div>
      <div className="w-48 border border-ui-border rounded-lg">
        <EmptyState icon="👥" title="Team" />
      </div>
      <div className="w-48 border border-ui-border rounded-lg">
        <EmptyState icon="⏰" title="Time" />
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Various icon options for different content types.",
      },
    },
  },
};
