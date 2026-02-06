import type { Meta, StoryObj } from "@storybook/react";
import { LoadingOverlay, LoadingSpinner } from "./LoadingSpinner";

const meta: Meta<typeof LoadingSpinner> = {
  title: "UI/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "The size of the spinner",
    },
    variant: {
      control: "select",
      options: ["brand", "secondary", "inherit"],
      description: "The color variant of the spinner",
    },
    animation: {
      control: "select",
      options: ["spin", "pulse"],
      description: "The animation style of the spinner",
    },
    message: {
      control: "text",
      description: "Optional loading message displayed below the spinner",
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Size Stories
// ============================================================================

export const ExtraSmall: Story = {
  args: {
    size: "xs",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

// ============================================================================
// Variant Stories
// ============================================================================

export const Brand: Story = {
  args: {
    variant: "brand",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "Brand variant uses the primary brand color (indigo). Good for primary actions.",
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "Secondary variant uses the text-secondary color. Subtle and blends with content.",
      },
    },
  },
};

export const Inherit: Story = {
  args: {
    variant: "inherit",
    size: "md",
  },
  render: (args) => (
    <div className="text-status-success">
      <LoadingSpinner {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Inherit variant uses the current text color. Adapts to parent context.",
      },
    },
  },
};

// ============================================================================
// Animation Stories
// ============================================================================

export const SpinAnimation: Story = {
  args: {
    animation: "spin",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "Standard spinning animation (default).",
      },
    },
  },
};

export const PulseAnimation: Story = {
  args: {
    animation: "pulse",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "Subtle pulse animation for softer loading states.",
      },
    },
  },
};

// ============================================================================
// With Message Stories
// ============================================================================

export const WithMessage: Story = {
  args: {
    size: "md",
    message: "Loading...",
  },
};

export const WithLongMessage: Story = {
  args: {
    size: "lg",
    message: "Please wait while we fetch your data...",
  },
};

// ============================================================================
// Grid Stories - All Sizes
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="xs" />
        <span className="text-sm text-ui-text-secondary">xs</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-ui-text-secondary">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <span className="text-sm text-ui-text-secondary">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        <span className="text-sm text-ui-text-secondary">lg</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All spinner sizes from extra small to large.",
      },
    },
  },
};

// ============================================================================
// Grid Stories - All Variants
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner variant="brand" size="md" />
        <span className="text-sm text-ui-text-secondary">brand</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner variant="secondary" size="md" />
        <span className="text-sm text-ui-text-secondary">secondary</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-status-error">
        <LoadingSpinner variant="inherit" size="md" />
        <span className="text-sm text-ui-text-secondary">inherit (error)</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-status-success">
        <LoadingSpinner variant="inherit" size="md" />
        <span className="text-sm text-ui-text-secondary">inherit (success)</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All color variants. The inherit variant adapts to the parent text color.",
      },
    },
  },
};

// ============================================================================
// Context Usage Stories
// ============================================================================

export const InlineUsage: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="xs" variant="inherit" />
      <span className="text-sm">Processing your request...</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Inline spinner next to text for subtle loading indication.",
      },
    },
  },
};

export const CenteredInContainer: Story = {
  render: () => (
    <div className="h-48 w-80 border border-ui-border rounded-lg flex items-center justify-center">
      <LoadingSpinner size="lg" message="Loading content..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Centered spinner within a container, useful for loading states in cards or panels.",
      },
    },
  },
};

export const ButtonLoading: Story = {
  render: () => (
    <button
      type="button"
      disabled
      className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-md opacity-75 cursor-not-allowed"
    >
      <LoadingSpinner size="xs" variant="inherit" />
      <span>Saving...</span>
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Extra small spinner used inside a button during a loading state.",
      },
    },
  },
};

// ============================================================================
// LoadingOverlay Stories
// ============================================================================

export const Overlay: Story = {
  render: () => (
    <div className="relative h-48 w-80 border border-ui-border rounded-lg p-4">
      <div className="space-y-2">
        <div className="h-4 bg-ui-bg-secondary rounded w-3/4" />
        <div className="h-4 bg-ui-bg-secondary rounded w-1/2" />
        <div className="h-4 bg-ui-bg-secondary rounded w-5/6" />
      </div>
      <LoadingOverlay />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Full overlay spinner that covers the parent container. Useful for blocking interactions during async operations.",
      },
    },
  },
};

export const OverlayWithMessage: Story = {
  render: () => (
    <div className="relative h-48 w-80 border border-ui-border rounded-lg p-4">
      <div className="space-y-2">
        <div className="h-4 bg-ui-bg-secondary rounded w-3/4" />
        <div className="h-4 bg-ui-bg-secondary rounded w-1/2" />
        <div className="h-4 bg-ui-bg-secondary rounded w-5/6" />
      </div>
      <LoadingOverlay message="Saving changes..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading overlay with a descriptive message.",
      },
    },
  },
};

// ============================================================================
// Complete Matrix Story
// ============================================================================

export const SizeVariantMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["brand", "secondary"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-6">
          <span className="w-24 text-sm font-medium capitalize">{variant}</span>
          <LoadingSpinner variant={variant} size="xs" />
          <LoadingSpinner variant={variant} size="sm" />
          <LoadingSpinner variant={variant} size="md" />
          <LoadingSpinner variant={variant} size="lg" />
        </div>
      ))}
      <div className="flex items-center gap-6 text-status-warning">
        <span className="w-24 text-sm font-medium text-ui-text">inherit</span>
        <LoadingSpinner variant="inherit" size="xs" />
        <LoadingSpinner variant="inherit" size="sm" />
        <LoadingSpinner variant="inherit" size="md" />
        <LoadingSpinner variant="inherit" size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Complete matrix showing all variants across all sizes.",
      },
    },
  },
};

// ============================================================================
// Animation Comparison Story
// ============================================================================

export const AnimationComparison: Story = {
  render: () => (
    <div className="flex items-center gap-12">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" animation="spin" />
        <span className="text-sm text-ui-text-secondary">spin</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" animation="pulse" />
        <span className="text-sm text-ui-text-secondary">pulse</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Side-by-side comparison of spin and pulse animations.",
      },
    },
  },
};
