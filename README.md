# Cascade - Collaborative Project Management Platform

A modern Jira + Confluence clone built with React, TypeScript, and Convex for real-time collaboration.

## 🚀 Features

### 📝 Document Management (Confluence-like)
- **Real-time collaborative editing** - Multiple users can edit documents simultaneously
- **Live presence indicators** - See who's currently viewing/editing each document
- **Document organization** - Private and public documents with easy navigation
- **Full-text search** - Quickly find documents by title
- **Rich text editor** - Full-featured document editor with formatting options

### 📊 Project Management (Jira-like)
- **Kanban boards** - Drag-and-drop issue management
- **Issue tracking** - Create and manage tasks, bugs, stories, and epics
- **Sprint planning** - Organize work into sprints with start/end dates
- **Custom workflows** - Define your own workflow states
- **Activity tracking** - Complete history of all changes
- **Comments** - Collaborate on issues with threaded discussions
- **Analytics dashboard** - Sprint burndown, velocity tracking, team metrics

### 🔗 Integrations & API
- **REST API** - API keys with scope-based permissions for CLI/AI integration
- **Google Calendar** - Bi-directional calendar sync (OAuth)
- **Pumble** - Team chat notifications via webhooks
- **GitHub** - Link repos, track PRs and commits (OAuth)
- **Email notifications** - @mentions, assignments, digests

### 📱 Mobile & Offline
- **Responsive design** - Works on all devices (mobile, tablet, desktop)
- **Progressive Web App** - Installable as native app
- **Offline mode** - Full functionality offline with auto-sync
- **Onboarding flow** - Interactive tour for new users

### 🎨 Design
- Clean, minimal interface with lots of white space
- Neutral color palette for reduced eye strain
- Dark/light theme support
- Fast, real-time updates without page refreshes

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: [Convex](https://convex.dev) (real-time database)
- **Styling**: Tailwind CSS
- **Editor**: BlockNote (ProseMirror-based)
- **Auth**: Convex Auth
- **Real-time**: Convex Presence + ProseMirror Sync
- **Analytics**: [PostHog](https://posthog.com) (product analytics & session replay)

This project is connected to the Convex deployment named [`peaceful-salmon-964`](https://dashboard.convex.dev/d/peaceful-salmon-964).

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/cascade.git
cd cascade
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Set up environment variables (optional - for analytics):
\`\`\`bash
# Add to .env.local if you want analytics
VITE_PUBLIC_POSTHOG_KEY=your_posthog_key
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
\`\`\`

4. Start the development server:
\`\`\`bash
pnpm run dev
\`\`\`

The app will open automatically at http://localhost:5173

### First Time Setup

1. Sign up for an account using email/password
2. Create your first project with a unique project key (e.g., "PROJ")
3. Start creating documents and issues
4. Invite team members to collaborate

## 📁 Project Structure

\`\`\`
cascade/
├── src/                    # React application
│   ├── components/        # UI components
│   │   ├── Sidebar.tsx    # Document navigation
│   │   ├── DocumentEditor.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── IssueCard.tsx
│   │   └── ...
│   ├── App.tsx           # Main application
│   └── main.tsx          # Entry point
├── convex/               # Backend functions
│   ├── schema.ts        # Database schema
│   ├── documents.ts     # Document operations
│   ├── projects.ts      # Project management
│   ├── issues.ts        # Issue tracking
│   ├── sprints.ts       # Sprint planning
│   ├── auth.ts          # Authentication
│   └── router.ts        # HTTP API routes
└── package.json
\`\`\`

## 🔥 Key Features Explained

### Real-time Collaboration
All changes are synchronized in real-time using Convex's reactive database. When multiple users edit the same document or move issues on a Kanban board, everyone sees the changes instantly.

### Presence System
The presence system shows:
- Who's currently viewing each document (facepile)
- Live cursor positions in documents
- Active users in projects

### Document Linking
Documents can be linked to projects and issues, creating a knowledge base that's directly connected to your work items.

### Workflow Customization
Each project can have custom workflow states beyond the default (To Do → In Progress → Review → Done).

## 📜 Commands

\`\`\`bash
# Development
pnpm run dev              # Start dev server with hot reload

# Build
pnpm run build           # Build for production

# Lint/Type Check
pnpm run lint            # Run linter and type checker

# Convex
pnpm convex dev          # Start Convex in dev mode
pnpm convex deploy       # Deploy to production
\`\`\`

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure build settings:
   - Build Command: `npx convex deploy --cmd 'pnpm run build'`
   - Output Directory: `dist`
4. Set up environment variables:
   - `CONVEX_DEPLOY_KEY` - Get from Convex dashboard (Production only)
   - `VITE_PUBLIC_POSTHOG_KEY` - Your PostHog project key (optional)
   - `VITE_PUBLIC_POSTHOG_HOST` - PostHog host URL (optional)
5. Deploy

### Deploy Convex Backend

\`\`\`bash
pnpm convex deploy
\`\`\`

Check out the [Convex docs](https://docs.convex.dev/) for more information:
* [Overview](https://docs.convex.dev/understanding/) - Good starting point
* [Hosting and Deployment](https://docs.convex.dev/production/) - How to deploy your app
* [Best Practices](https://docs.convex.dev/understanding/best-practices/) - Tips for improvement

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📊 Analytics

This project includes PostHog analytics integration for:
- User behavior tracking
- Session recordings
- Feature usage metrics
- Performance monitoring

Analytics are privacy-focused and can be disabled by removing PostHog environment variables.

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev) for real-time sync
- UI components inspired by Notion and Jira
- BlockNote editor for rich text editing
- Tailwind CSS for styling
- [PostHog](https://posthog.com) for product analytics

---

Built with ❤️ using modern web technologies
