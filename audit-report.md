# Style Audit Report

Generated on: 1/13/2026, 11:48:02 PM

Found 134 occurrences of hardcoded or non-semantic styles.

## Inline CSS Colors

| File | Line | Match | Context |
| :--- | :--- | :--- | :--- |
| src\components\AI\config.ts | 90 | `color: "b` | `color: "blue",` |
| src\components\AI\config.ts | 95 | `color: "y` | `color: "yellow",` |
| src\components\AI\config.ts | 100 | `color: "p` | `color: "purple",` |
| src\components\AI\config.ts | 105 | `color: "g` | `color: "green",` |
| src\components\AI\config.ts | 110 | `color: "i` | `color: "indigo",` |
| src\components\AI\config.ts | 115 | `color: "r` | `color: "red",` |
| src\components\AI\config.ts | 120 | `color: "a` | `color: "amber",` |
| src\components\Calendar\CalendarView.tsx | 403 | `color: "w` | `color: "white",` |
| src\components\CreateIssueModal.test.tsx | 60 | `color: "#` | `{ _id: "label-1" as Id<"labels">, name: "bug", color: "#ff0000" },` |
| src\components\CreateIssueModal.test.tsx | 61 | `color: "#` | `{ _id: "label-2" as Id<"labels">, name: "feature", color: "#00ff00" },` |
| src\components\IssueCard.test.tsx | 59 | `color: "#` | `{ name: "backend", color: "#3b82f6" },` |
| src\components\IssueCard.test.tsx | 60 | `color: "#` | `{ name: "urgent", color: "#ef4444" },` |
| src\components\IssueDetailModal.test.tsx | 99 | `color: "#` | `{ name: "backend", color: "#3B82F6" },` |
| src\components\IssueDetailModal.test.tsx | 100 | `color: "#` | `{ name: "urgent", color: "#EF4444" },` |
| src\components\landing\WhyChooseSection.tsx | 8 | `color: "c` | `{ value: 30, label: "Less time in meetings", color: "cyan" as const },` |
| src\components\landing\WhyChooseSection.tsx | 9 | `color: "t` | `{ value: 10, label: "Fewer tools to manage", color: "teal" as const },` |
| src\components\landing\WhyChooseSection.tsx | 10 | `color: "p` | `{ value: 95, label: "Actually use it daily", color: "purple" as const },` |
| src\components\landing\WhyChooseSection.tsx | 11 | `color: "e` | `{ value: 95, label: "Would recommend", color: "emerald" as const },` |
| src\components\landing\WhyChooseSection.tsx | 44 | `color: "c` | `color: "cyan" \| "teal" \| "purple" \| "emerald";` |
| src\components\TimeTracking\BurnRateDashboard.tsx | 243 | `color: "b` | `color: "blue" \| "green" \| "purple" \| "orange";` |

## Hardcoded Hex Colors

| File | Line | Match | Context |
| :--- | :--- | :--- | :--- |
| src\components\auth\AppSplashScreen.tsx | 6 | `#0a0e17` | `<div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0e17] z-[9999]">` |
| src\components\auth\GoogleAuthButton.tsx | 19 | `#4285F4` | `fill="#4285F4"` |
| src\components\auth\GoogleAuthButton.tsx | 23 | `#34A853` | `fill="#34A853"` |
| src\components\auth\GoogleAuthButton.tsx | 27 | `#FBBC05` | `fill="#FBBC05"` |
| src\components\auth\GoogleAuthButton.tsx | 31 | `#EA4335` | `fill="#EA4335"` |
| src\components\CreateIssueModal.test.tsx | 60 | `#ff0000` | `{ _id: "label-1" as Id<"labels">, name: "bug", color: "#ff0000" },` |
| src\components\CreateIssueModal.test.tsx | 61 | `#00ff00` | `{ _id: "label-2" as Id<"labels">, name: "feature", color: "#00ff00" },` |
| src\components\IssueCard.test.tsx | 59 | `#3b82f6` | `{ name: "backend", color: "#3b82f6" },` |
| src\components\IssueCard.test.tsx | 60 | `#ef4444` | `{ name: "urgent", color: "#ef4444" },` |
| src\components\IssueDetailModal.test.tsx | 99 | `#3B82F6` | `{ name: "backend", color: "#3B82F6" },` |
| src\components\IssueDetailModal.test.tsx | 100 | `#EF4444` | `{ name: "urgent", color: "#EF4444" },` |
| src\components\KanbanBoard.tsx | 139 | `#94a3b8` | `s.category === "todo" ? "#94a3b8" : s.category === "inprogress" ? "#3b82f6" : "#22c55e",` |
| src\components\KanbanBoard.tsx | 139 | `#3b82f6` | `s.category === "todo" ? "#94a3b8" : s.category === "inprogress" ? "#3b82f6" : "#22c55e",` |
| src\components\KanbanBoard.tsx | 139 | `#22c55e` | `s.category === "todo" ? "#94a3b8" : s.category === "inprogress" ? "#3b82f6" : "#22c55e",` |
| src\components\LabelsManager.tsx | 29 | `#6366F1` | `const DEFAULT_LABEL_COLOR = "#6366F1";` |
| src\components\landing\icons.tsx | 13 | `#22d3ee` | `<stop offset="0%" stopColor="#22d3ee" />` |
| src\components\landing\icons.tsx | 14 | `#a855f7` | `<stop offset="100%" stopColor="#a855f7" />` |
| src\components\landing\icons.tsx | 40 | `#06b6d4` | `stroke="#06b6d4"` |
| src\components\landing\icons.tsx | 58 | `#00E5FF` | `<circle cx="19" cy="5" r="1.5" stroke="none" fill="#00E5FF" />` |
| src\components\landing\icons.tsx | 65 | `#14b8a6` | `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5">` |
| src\components\landing\icons.tsx | 80 | `#14b8a6` | `stroke="#14b8a6"` |
| src\components\landing\icons.tsx | 91 | `#14b8a6` | `<circle cx="19" cy="5" r="1.5" stroke="none" fill="#14b8a6" />` |
| src\components\landing\icons.tsx | 98 | `#a855f7` | `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">` |
| src\components\Settings\DevToolsTab.tsx | 37 | `#128736` | `&#128736;` |
| src\components\ui\ColorPicker.test.tsx | 7 | `#EF4444` | `"#EF4444", // red` |
| src\components\ui\ColorPicker.test.tsx | 8 | `#F59E0B` | `"#F59E0B", // amber` |
| src\components\ui\ColorPicker.test.tsx | 9 | `#10B981` | `"#10B981", // emerald` |
| src\components\ui\ColorPicker.test.tsx | 10 | `#3B82F6` | `"#3B82F6", // blue` |
| src\components\ui\ColorPicker.test.tsx | 11 | `#8B5CF6` | `"#8B5CF6", // violet` |
| src\components\ui\ColorPicker.test.tsx | 12 | `#EC4899` | `"#EC4899", // pink` |
| src\components\ui\ColorPicker.test.tsx | 13 | `#6B7280` | `"#6B7280", // gray` |
| src\components\ui\ColorPicker.test.tsx | 14 | `#14B8A6` | `"#14B8A6", // teal` |
| src\components\ui\ColorPicker.test.tsx | 20 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 26 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} label="Choose Color" />);` |
| src\components\ui\ColorPicker.test.tsx | 32 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 40 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 48 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 56 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 65 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 74 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 83 | `#000000` | `const customColors = ["#000000", "#FFFFFF", "#FF0000"];` |
| src\components\ui\ColorPicker.test.tsx | 83 | `#FFFFFF` | `const customColors = ["#000000", "#FFFFFF", "#FF0000"];` |
| src\components\ui\ColorPicker.test.tsx | 83 | `#FF0000` | `const customColors = ["#000000", "#FFFFFF", "#FF0000"];` |
| src\components\ui\ColorPicker.test.tsx | 84 | `#000000` | `render(<ColorPicker value="#000000" onChange={vi.fn()} presetColors={customColors} />);` |
| src\components\ui\ColorPicker.test.tsx | 91 | `#EF4444` | `expect(screen.queryByLabelText("Select color #EF4444")).not.toBeInTheDocument();` |
| src\components\ui\ColorPicker.test.tsx | 95 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} presetColors={[]} />);` |
| src\components\ui\ColorPicker.test.tsx | 108 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 110 | `#EF4444` | `const selectedButton = screen.getByLabelText("Select color #EF4444");` |
| src\components\ui\ColorPicker.test.tsx | 117 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 119 | `#F59E0B` | `const nonSelectedButton = screen.getByLabelText("Select color #F59E0B");` |
| src\components\ui\ColorPicker.test.tsx | 125 | `#EF4444` | `const { rerender } = render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 127 | `#EF4444` | `const selectedButton = screen.getByLabelText("Select color #EF4444");` |
| src\components\ui\ColorPicker.test.tsx | 131 | `#F59E0B` | `rerender(<ColorPicker value="#F59E0B" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 134 | `#F59E0B` | `const newButton = screen.getByLabelText("Select color #F59E0B");` |
| src\components\ui\ColorPicker.test.tsx | 145 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={onChange} />);` |
| src\components\ui\ColorPicker.test.tsx | 147 | `#F59E0B` | `const button = screen.getByLabelText("Select color #F59E0B");` |
| src\components\ui\ColorPicker.test.tsx | 150 | `#F59E0B` | `expect(onChange).toHaveBeenCalledWith("#F59E0B");` |
| src\components\ui\ColorPicker.test.tsx | 157 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={onChange} />);` |
| src\components\ui\ColorPicker.test.tsx | 172 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={onChange} />);` |
| src\components\ui\ColorPicker.test.tsx | 174 | `#EF4444` | `const button = screen.getByLabelText("Select color #EF4444");` |
| src\components\ui\ColorPicker.test.tsx | 177 | `#EF4444` | `expect(onChange).toHaveBeenCalledWith("#EF4444");` |
| src\components\ui\ColorPicker.test.tsx | 181 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 192 | `#ab12cd` | `render(<ColorPicker value="#ab12cd" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 196 | `#ab12cd` | `expect(colorInput).toHaveValue("#ab12cd");` |
| src\components\ui\ColorPicker.test.tsx | 202 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={onChange} />);` |
| src\components\ui\ColorPicker.test.tsx | 207 | `#123456` | `const newColor = "#123456";` |
| src\components\ui\ColorPicker.test.tsx | 214 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 222 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 234 | `#EF4444` | `const { container } = render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 243 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 252 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 254 | `#EF4444` | `const button = screen.getByLabelText("Select color #EF4444");` |
| src\components\ui\ColorPicker.test.tsx | 261 | `#EF4444` | `const { container } = render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 272 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 281 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 287 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 298 | `#ABCDEF` | `render(<ColorPicker value="#ABCDEF" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 302 | `#abcdef` | `expect(colorInput).toHaveValue("#abcdef");` |
| src\components\ui\ColorPicker.test.tsx | 306 | `#abcdef` | `render(<ColorPicker value="#abcdef" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 309 | `#abcdef` | `expect(colorInput).toHaveValue("#abcdef");` |
| src\components\ui\ColorPicker.test.tsx | 313 | `#999999` | `render(<ColorPicker value="#999999" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 316 | `#999999` | `expect(colorInput).toHaveValue("#999999");` |
| src\components\ui\ColorPicker.test.tsx | 333 | `#FF0000` | `render(<ColorPicker value="#FF0000" onChange={onChange} presetColors={["#FF0000"]} />);` |
| src\components\ui\ColorPicker.test.tsx | 333 | `#FF0000` | `render(<ColorPicker value="#FF0000" onChange={onChange} presetColors={["#FF0000"]} />);` |
| src\components\ui\ColorPicker.test.tsx | 345 | `#000000` | `render(<ColorPicker value="#000000" onChange={vi.fn()} presetColors={manyColors} />);` |
| src\components\ui\ColorPicker.test.tsx | 354 | `#EF4444` | `render(<ColorPicker value="#EF4444" onChange={vi.fn()} />);` |
| src\components\ui\ColorPicker.test.tsx | 361 | `#000000` | `const customColors = ["#000000", "#FFFFFF"];` |
| src\components\ui\ColorPicker.test.tsx | 361 | `#FFFFFF` | `const customColors = ["#000000", "#FFFFFF"];` |
| src\components\ui\ColorPicker.test.tsx | 364 | `#000000` | `value="#000000"` |
| src\components\ui\ColorPicker.test.tsx | 379 | `#EF4444` | `let selectedColor = "#EF4444";` |
| src\components\ui\ColorPicker.test.tsx | 389 | `#3B82F6` | `await user.click(screen.getByLabelText("Select color #3B82F6"));` |
| src\components\ui\ColorPicker.test.tsx | 390 | `#3B82F6` | `expect(onChange).toHaveBeenCalledWith("#3B82F6");` |
| src\components\ui\ColorPicker.test.tsx | 393 | `#3B82F6` | `rerender(<ColorPicker value="#3B82F6" onChange={onChange} label="Theme Color" />);` |
| src\components\ui\ColorPicker.test.tsx | 397 | `#3B82F6` | `const selectedButton = screen.getByLabelText("Select color #3B82F6");` |
| src\components\ui\ColorPicker.test.tsx | 403 | `#FF0000` | `const brandColors = ["#FF0000", "#00FF00", "#0000FF"];` |
| src\components\ui\ColorPicker.test.tsx | 403 | `#00FF00` | `const brandColors = ["#FF0000", "#00FF00", "#0000FF"];` |
| src\components\ui\ColorPicker.test.tsx | 403 | `#0000FF` | `const brandColors = ["#FF0000", "#00FF00", "#0000FF"];` |
| src\components\ui\ColorPicker.test.tsx | 406 | `#FF0000` | `value="#FF0000"` |
| src\components\ui\ColorPicker.tsx | 13 | `#EF4444` | `"#EF4444", // red` |
| src\components\ui\ColorPicker.tsx | 14 | `#F59E0B` | `"#F59E0B", // amber` |
| src\components\ui\ColorPicker.tsx | 15 | `#10B981` | `"#10B981", // emerald` |
| src\components\ui\ColorPicker.tsx | 16 | `#3B82F6` | `"#3B82F6", // blue` |
| src\components\ui\ColorPicker.tsx | 17 | `#8B5CF6` | `"#8B5CF6", // violet` |
| src\components\ui\ColorPicker.tsx | 18 | `#EC4899` | `"#EC4899", // pink` |
| src\components\ui\ColorPicker.tsx | 19 | `#6B7280` | `"#6B7280", // gray` |
| src\components\ui\ColorPicker.tsx | 20 | `#14B8A6` | `"#14B8A6", // teal` |
| src\lib\serviceWorker.ts | 82 | `#3b82f6` | `background: #3b82f6;` |
| src\lib\serviceWorker.ts | 99 | `#3b82f6` | `color: #3b82f6;` |
| src\lib\serviceWorker.ts | 184 | `#1f2937` | `color: #1f2937;` |
| src\lib\serviceWorker.ts | 194 | `#3b82f6` | `border: 2px solid #3b82f6;` |
| src\lib\serviceWorker.ts | 200 | `#3b82f6` | `background: #3b82f6;` |
| src\lib\serviceWorker.ts | 210 | `#3b82f6` | `color: #3b82f6;` |
| src\lib\serviceWorker.ts | 211 | `#3b82f6` | `border: 1px solid #3b82f6;` |
| src\routes\index.tsx | 17 | `#0a0e17` | `<div className="min-h-screen w-full bg-[#0a0e17] text-white overflow-x-hidden">` |

