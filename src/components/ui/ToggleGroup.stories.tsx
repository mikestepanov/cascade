import type { Meta, StoryObj } from "@storybook/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Calendar,
  Grid3X3,
  Italic,
  Kanban,
  LayoutGrid,
  List,
  Table,
  Underline,
} from "lucide-react";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

const meta: Meta<typeof ToggleGroup> = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Whether a single or multiple items can be selected",
    },
    variant: {
      control: "select",
      options: ["default", "brand", "error", "success", "accent", "outline"],
      description: "The visual style variant of the toggle items",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the toggle group and items",
    },
    disabled: {
      control: "boolean",
      description: "Whether the toggle group is disabled",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

// ============================================================================
// Selection Type Stories
// ============================================================================

export const SingleSelection: Story = {
  args: {
    type: "single",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const MultipleSelection: Story = {
  args: {
    type: "multiple",
    defaultValue: ["bold", "italic"],
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ============================================================================
// Variant Stories
// ============================================================================

export const Default: Story = {
  args: {
    type: "single",
    variant: "default",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Brand: Story = {
  args: {
    type: "single",
    variant: "brand",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Success: Story = {
  args: {
    type: "single",
    variant: "success",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const ErrorVariant: Story = {
  args: {
    type: "single",
    variant: "error",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Accent: Story = {
  args: {
    type: "single",
    variant: "accent",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  args: {
    type: "single",
    variant: "outline",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ============================================================================
// Size Stories
// ============================================================================

export const Small: Story = {
  args: {
    type: "single",
    size: "sm",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Medium: Story = {
  args: {
    type: "single",
    size: "md",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Large: Story = {
  args: {
    type: "single",
    size: "lg",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-5 w-5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-5 w-5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-5 w-5" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ============================================================================
// State Stories
// ============================================================================

export const Disabled: Story = {
  args: {
    type: "single",
    disabled: true,
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const DisabledItem: Story = {
  args: {
    type: "single",
    defaultValue: "center",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right" disabled>
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="justify" aria-label="Justify" disabled>
        <AlignJustify className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ============================================================================
// With Text Stories
// ============================================================================

export const WithText: Story = {
  args: {
    type: "single",
    defaultValue: "grid",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="mr-2 h-4 w-4" />
        Grid
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="mr-2 h-4 w-4" />
        List
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const TextOnly: Story = {
  args: {
    type: "single",
    defaultValue: "week",
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
      <ToggleGroupItem value="year">Year</ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ============================================================================
// Use Case Stories
// ============================================================================

export const ViewSwitcher: Story = {
  render: function ViewSwitcherExample() {
    const [view, setView] = useState("board");

    return (
      <div className="flex flex-col gap-4 items-center">
        <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value)}>
          <ToggleGroupItem value="board" aria-label="Board view">
            <Kanban className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <Table className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <Calendar className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-ui-text-secondary">Selected view: {view}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Common use case for switching between different view modes in a project management application.",
      },
    },
  },
};

export const AlignmentToolbar: Story = {
  render: function AlignmentToolbarExample() {
    const [alignment, setAlignment] = useState("left");

    return (
      <div className="flex flex-col gap-4 items-center">
        <ToggleGroup
          type="single"
          value={alignment}
          onValueChange={(value) => value && setAlignment(value)}
          variant="outline"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justify">
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-ui-text-secondary">Text alignment: {alignment}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Text alignment toolbar commonly found in rich text editors.",
      },
    },
  },
};

export const TextFormattingToolbar: Story = {
  render: function TextFormattingExample() {
    const [formatting, setFormatting] = useState<string[]>(["bold"]);

    return (
      <div className="flex flex-col gap-4 items-center">
        <ToggleGroup
          type="multiple"
          value={formatting}
          onValueChange={setFormatting}
          variant="brand"
        >
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-ui-text-secondary">
          Active formatting: {formatting.length > 0 ? formatting.join(", ") : "none"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Text formatting toolbar with multiple selection for applying text styles.",
      },
    },
  },
};

export const CalendarViewSelector: Story = {
  render: function CalendarViewExample() {
    const [view, setView] = useState("month");

    return (
      <div className="flex flex-col gap-4 items-center">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => value && setView(value)}
          size="sm"
        >
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-ui-text-secondary">Calendar view: {view}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Calendar view selector with text-only toggle items.",
      },
    },
  },
};

// ============================================================================
// Grid Stories - All Variants
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["default", "brand", "success", "error", "accent", "outline"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          <span className="w-20 text-sm font-medium capitalize text-ui-text">{variant}</span>
          <ToggleGroup type="single" defaultValue="center" variant={variant}>
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All toggle group variants displayed together for comparison.",
      },
    },
  },
};

// ============================================================================
// Grid Stories - All Sizes
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-20 text-sm font-medium capitalize text-ui-text">{size}</span>
          <ToggleGroup type="single" defaultValue="center" size={size}>
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft
                className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}
              />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter
                className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}
              />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight
                className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}
              />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All toggle group sizes displayed together for comparison.",
      },
    },
  },
};

// ============================================================================
// Grid Stories - Variant Size Matrix
// ============================================================================

const ICON_SIZE_CLASSES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

function SizeRow({
  size,
  variant,
}: {
  size: "sm" | "md" | "lg";
  variant: "default" | "brand" | "outline";
}) {
  const iconClass = ICON_SIZE_CLASSES[size];
  return (
    <div className="flex items-center gap-4">
      <span className="w-12 text-xs text-ui-text-secondary">{size}</span>
      <ToggleGroup type="single" defaultValue="center" variant={variant} size={size}>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft className={iconClass} />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter className={iconClass} />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight className={iconClass} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export const VariantSizeMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(["default", "brand", "outline"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-4">
          <span className="text-sm font-semibold capitalize text-ui-text">{variant}</span>
          <div className="flex flex-col gap-3">
            <SizeRow size="sm" variant={variant} />
            <SizeRow size="md" variant={variant} />
            <SizeRow size="lg" variant={variant} />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Matrix showing common variants across all sizes.",
      },
    },
  },
};
