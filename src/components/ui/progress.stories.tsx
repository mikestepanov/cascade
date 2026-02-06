import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "The progress value (0-100)",
    },
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "info"],
      description: "Color variant for the progress indicator",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the root element",
    },
    indicatorClassName: {
      control: "text",
      description: "Additional CSS classes for the indicator element",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Value Stories
// ============================================================================

export const Empty: Story = {
  args: {
    value: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar at 0% - empty state.",
      },
    },
  },
};

export const QuarterComplete: Story = {
  args: {
    value: 25,
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar at 25% completion.",
      },
    },
  },
};

export const HalfComplete: Story = {
  args: {
    value: 50,
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar at 50% completion.",
      },
    },
  },
};

export const ThreeQuartersComplete: Story = {
  args: {
    value: 75,
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar at 75% completion.",
      },
    },
  },
};

export const Complete: Story = {
  args: {
    value: 100,
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar at 100% - fully complete.",
      },
    },
  },
};

// ============================================================================
// All Values Overview
// ============================================================================

export const AllValues: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex items-center gap-4">
        <span className="w-12 text-sm text-ui-text-secondary text-right">0%</span>
        <Progress value={0} className="flex-1" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-sm text-ui-text-secondary text-right">25%</span>
        <Progress value={25} className="flex-1" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-sm text-ui-text-secondary text-right">50%</span>
        <Progress value={50} className="flex-1" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-sm text-ui-text-secondary text-right">75%</span>
        <Progress value={75} className="flex-1" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 text-sm text-ui-text-secondary text-right">100%</span>
        <Progress value={100} className="flex-1" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Overview of progress bars at different completion percentages.",
      },
    },
  },
};

// ============================================================================
// Custom Sizes
// ============================================================================

export const ThinProgress: Story = {
  args: {
    value: 60,
    className: "h-1",
  },
  parameters: {
    docs: {
      description: {
        story: "Thin progress bar (h-1) for subtle loading indicators.",
      },
    },
  },
};

export const ThickProgress: Story = {
  args: {
    value: 60,
    className: "h-4",
  },
  parameters: {
    docs: {
      description: {
        story: "Thick progress bar (h-4) for prominent progress displays.",
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Thin (h-1)</span>
        <Progress value={60} className="h-1" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Default (h-2)</span>
        <Progress value={60} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Medium (h-3)</span>
        <Progress value={60} className="h-3" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Thick (h-4)</span>
        <Progress value={60} className="h-4" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress bars at different heights/sizes.",
      },
    },
  },
};

// ============================================================================
// Custom Colors
// ============================================================================

export const SuccessVariant: Story = {
  args: {
    value: 100,
    variant: "success",
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar with success (green) variant.",
      },
    },
  },
};

export const WarningVariant: Story = {
  args: {
    value: 65,
    variant: "warning",
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar with warning (yellow/orange) variant.",
      },
    },
  },
};

export const ErrorVariant: Story = {
  args: {
    value: 30,
    variant: "error",
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar with error (red) variant.",
      },
    },
  },
};

export const InfoVariant: Story = {
  args: {
    value: 50,
    variant: "info",
  },
  parameters: {
    docs: {
      description: {
        story: "Progress bar with info (blue) variant.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ui-text-secondary">Default (brand)</span>
        <Progress value={70} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ui-text-secondary">Success</span>
        <Progress value={70} variant="success" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ui-text-secondary">Warning</span>
        <Progress value={70} variant="warning" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ui-text-secondary">Error</span>
        <Progress value={70} variant="error" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ui-text-secondary">Info</span>
        <Progress value={70} variant="info" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress bars with all semantic color variants.",
      },
    },
  },
};

// ============================================================================
// Animated Progress
// ============================================================================

function AnimatedProgress() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-80">
      <Progress value={value} />
      <span className="text-sm text-ui-text-secondary text-center">{value}%</span>
    </div>
  );
}

export const Animated: Story = {
  render: () => <AnimatedProgress />,
  parameters: {
    docs: {
      description: {
        story:
          "Animated progress bar that continuously fills and resets. Demonstrates the smooth transition animation.",
      },
    },
  },
};

function AnimatedLoadingProgress() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev >= 90) {
          return 90;
        }
        // Slow down as it approaches completion
        const increment = Math.max(1, Math.floor((90 - prev) / 10));
        return Math.min(90, prev + increment);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-80">
      <Progress value={value} />
      <span className="text-sm text-ui-text-secondary text-center">Loading... {value}%</span>
    </div>
  );
}

export const AnimatedLoading: Story = {
  render: () => <AnimatedLoadingProgress />,
  parameters: {
    docs: {
      description: {
        story:
          "Simulated loading progress that slows down as it approaches completion. Common UX pattern for indeterminate loading.",
      },
    },
  },
};

// ============================================================================
// Context Usage Stories
// ============================================================================

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <div className="flex justify-between text-sm">
        <span className="text-ui-text">Upload Progress</span>
        <span className="text-ui-text-secondary">67%</span>
      </div>
      <Progress value={67} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress bar with label and percentage display.",
      },
    },
  },
};

export const FileUpload: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80 p-4 border border-ui-border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-ui-bg-secondary rounded flex items-center justify-center text-ui-text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>File icon</title>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ui-text truncate">project-assets.zip</div>
          <div className="text-xs text-ui-text-secondary">2.4 MB of 8.2 MB</div>
        </div>
      </div>
      <Progress value={29} className="h-1" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress bar used in a file upload context with file details.",
      },
    },
  },
};

export const MultipleProgress: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span className="text-ui-text">Storage Used</span>
          <span className="text-ui-text-secondary">4.2 GB / 10 GB</span>
        </div>
        <Progress value={42} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span className="text-ui-text">Bandwidth</span>
          <span className="text-ui-text-secondary">87 GB / 100 GB</span>
        </div>
        <Progress value={87} variant="warning" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span className="text-ui-text">API Requests</span>
          <span className="text-ui-text-secondary">95k / 100k</span>
        </div>
        <Progress value={95} variant="error" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Multiple progress bars showing different usage metrics with semantic colors indicating severity.",
      },
    },
  },
};

export const StepProgress: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex justify-between text-sm text-ui-text-secondary">
        <span>Step 2 of 4</span>
        <span>50% complete</span>
      </div>
      <Progress value={50} className="h-1" />
      <div className="flex justify-between text-xs text-ui-text-tertiary">
        <span>Account</span>
        <span>Profile</span>
        <span>Settings</span>
        <span>Done</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress bar used as a step indicator in a multi-step form.",
      },
    },
  },
};
