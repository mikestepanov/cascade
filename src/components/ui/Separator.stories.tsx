import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./Separator";

const meta: Meta<typeof Separator> = {
	title: "UI/Separator",
	component: Separator,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		orientation: {
			control: "select",
			options: ["horizontal", "vertical"],
			description: "The orientation of the separator",
		},
		decorative: {
			control: "boolean",
			description:
				"Whether the separator is purely decorative. When true, it is hidden from screen readers.",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Orientation Stories
// ============================================================================

export const Horizontal: Story = {
	render: () => (
		<div className="w-64">
			<Separator />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Horizontal separator (default). Creates a visual divider spanning the full width.",
			},
		},
	},
};

export const Vertical: Story = {
	render: () => (
		<div className="flex h-12 items-center">
			<Separator orientation="vertical" />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Vertical separator. Creates a visual divider spanning the full height of its container.",
			},
		},
	},
};

// ============================================================================
// Usage Between Content Sections
// ============================================================================

export const BetweenTextSections: Story = {
	render: () => (
		<div className="flex w-80 flex-col gap-4">
			<div>
				<h3 className="font-semibold">Section One</h3>
				<p className="text-sm text-ui-text-secondary">
					This is the first section of content with some descriptive text.
				</p>
			</div>
			<Separator />
			<div>
				<h3 className="font-semibold">Section Two</h3>
				<p className="text-sm text-ui-text-secondary">
					This is the second section of content separated by a horizontal
					divider.
				</p>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Horizontal separator used to divide content sections.",
			},
		},
	},
};

export const BetweenInlineItems: Story = {
	render: () => (
		<div className="flex h-5 items-center gap-4 text-sm">
			<span>Dashboard</span>
			<Separator orientation="vertical" />
			<span>Projects</span>
			<Separator orientation="vertical" />
			<span>Settings</span>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Vertical separators used to divide inline items like navigation links or breadcrumbs.",
			},
		},
	},
};

export const InCard: Story = {
	render: () => (
		<div className="w-72 rounded-lg border border-ui-border bg-ui-bg-secondary p-4">
			<div className="flex flex-col gap-2">
				<h3 className="font-semibold">Card Title</h3>
				<p className="text-sm text-ui-text-secondary">
					Card description goes here.
				</p>
			</div>
			<Separator className="my-4" />
			<div className="flex justify-between text-sm">
				<span className="text-ui-text-secondary">Status</span>
				<span className="font-medium text-status-success">Active</span>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Separator used within a card to divide header and footer content.",
			},
		},
	},
};

export const InToolbar: Story = {
	render: () => (
		<div className="flex items-center gap-2 rounded-lg border border-ui-border bg-ui-bg-secondary p-2">
			<button
				type="button"
				className="rounded p-2 hover:bg-ui-bg-tertiary"
			>
				<span className="text-sm">Bold</span>
			</button>
			<button
				type="button"
				className="rounded p-2 hover:bg-ui-bg-tertiary"
			>
				<span className="text-sm">Italic</span>
			</button>
			<Separator orientation="vertical" className="h-6" />
			<button
				type="button"
				className="rounded p-2 hover:bg-ui-bg-tertiary"
			>
				<span className="text-sm">Left</span>
			</button>
			<button
				type="button"
				className="rounded p-2 hover:bg-ui-bg-tertiary"
			>
				<span className="text-sm">Center</span>
			</button>
			<button
				type="button"
				className="rounded p-2 hover:bg-ui-bg-tertiary"
			>
				<span className="text-sm">Right</span>
			</button>
			<Separator orientation="vertical" className="h-6" />
			<button
				type="button"
				className="rounded p-2 hover:bg-ui-bg-tertiary"
			>
				<span className="text-sm">Link</span>
			</button>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Vertical separators used in a toolbar to group related actions.",
			},
		},
	},
};

export const InList: Story = {
	render: () => (
		<div className="w-64 rounded-lg border border-ui-border bg-ui-bg-secondary">
			<div className="flex items-center gap-3 p-3">
				<div className="h-8 w-8 rounded-full bg-brand" />
				<div className="flex flex-col">
					<span className="text-sm font-medium">John Doe</span>
					<span className="text-xs text-ui-text-secondary">Admin</span>
				</div>
			</div>
			<Separator />
			<div className="flex items-center gap-3 p-3">
				<div className="h-8 w-8 rounded-full bg-accent" />
				<div className="flex flex-col">
					<span className="text-sm font-medium">Jane Smith</span>
					<span className="text-xs text-ui-text-secondary">Editor</span>
				</div>
			</div>
			<Separator />
			<div className="flex items-center gap-3 p-3">
				<div className="h-8 w-8 rounded-full bg-status-info" />
				<div className="flex flex-col">
					<span className="text-sm font-medium">Bob Wilson</span>
					<span className="text-xs text-ui-text-secondary">Viewer</span>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Horizontal separators used to divide list items.",
			},
		},
	},
};

export const InDropdownMenu: Story = {
	render: () => (
		<div className="w-48 rounded-lg border border-ui-border bg-ui-bg-secondary py-1 shadow-lg">
			<button
				type="button"
				className="w-full px-3 py-2 text-left text-sm hover:bg-ui-bg-tertiary"
			>
				Profile
			</button>
			<button
				type="button"
				className="w-full px-3 py-2 text-left text-sm hover:bg-ui-bg-tertiary"
			>
				Settings
			</button>
			<Separator className="my-1" />
			<button
				type="button"
				className="w-full px-3 py-2 text-left text-sm hover:bg-ui-bg-tertiary"
			>
				Help
			</button>
			<button
				type="button"
				className="w-full px-3 py-2 text-left text-sm hover:bg-ui-bg-tertiary"
			>
				Feedback
			</button>
			<Separator className="my-1" />
			<button
				type="button"
				className="w-full px-3 py-2 text-left text-sm text-status-error hover:bg-ui-bg-tertiary"
			>
				Log out
			</button>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Separators used in a dropdown menu to group related actions.",
			},
		},
	},
};

// ============================================================================
// Decorative vs Semantic
// ============================================================================

export const Decorative: Story = {
	args: {
		decorative: true,
	},
	render: (args) => (
		<div className="w-64">
			<p className="mb-2 text-sm text-ui-text-secondary">
				Decorative separator (hidden from screen readers):
			</p>
			<Separator {...args} />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"A decorative separator is hidden from screen readers. Use this when the separator is purely visual and does not convey meaning.",
			},
		},
	},
};

export const Semantic: Story = {
	args: {
		decorative: false,
	},
	render: (args) => (
		<div className="w-64">
			<p className="mb-2 text-sm text-ui-text-secondary">
				Semantic separator (accessible to screen readers):
			</p>
			<Separator {...args} />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"A semantic separator is accessible to screen readers. Use this when the separator conveys meaningful content grouping.",
			},
		},
	},
};

// ============================================================================
// With Custom Styling
// ============================================================================

export const CustomWidth: Story = {
	render: () => (
		<div className="flex w-64 flex-col items-center gap-4">
			<span className="text-sm text-ui-text-secondary">Partial width separator:</span>
			<Separator className="w-1/2" />
			<span className="text-sm text-ui-text-secondary">Above and below</span>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Separator with custom width for a more subtle divider effect.",
			},
		},
	},
};

export const CustomHeight: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<span className="text-sm">Short</span>
			<Separator orientation="vertical" className="h-4" />
			<span className="text-sm">Medium</span>
			<Separator orientation="vertical" className="h-8" />
			<span className="text-sm">Tall</span>
			<Separator orientation="vertical" className="h-12" />
			<span className="text-sm">End</span>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Vertical separators with varying heights.",
			},
		},
	},
};
