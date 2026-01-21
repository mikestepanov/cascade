# Cal.com - Comprehensive Analysis

> **Project Type:** Scheduling Infrastructure / Calendly Alternative
> **License:** AGPLv3 (core) + Commercial (enterprise features)
> **GitHub:** https://github.com/calcom/cal.com
> **Company:** Cal.com, Inc.
> **GitHub Stars:** 36,000+
> **Contributors:** 772+
> **Status:** Actively maintained
> **Business Model:** Open Core

---

## 📋 What is Cal.com?

Cal.com is **scheduling infrastructure for absolutely everyone** - an open-source Calendly alternative that lets you control your own meetings, data, and workflows. It's designed for individuals, teams, and organizations who need flexible scheduling without vendor lock-in.

**Tagline:** "The open source Calendly successor"

**Target Users:**
- Freelancers and consultants
- Sales teams
- Recruiters and HR
- Customer success teams
- Support teams
- Small to enterprise businesses
- Anyone who schedules meetings

**Market Position:**
- Leading open-source scheduling platform
- Fastest-growing scheduling tool (36k+ GitHub stars)
- Privacy-first alternative to Calendly, Chili Piper
- White-label and self-hosting capabilities

---

## 🎯 Core Features

### Booking & Scheduling
- **One-on-one Meetings** - Personal booking links
- **Group Events** - Multiple attendees
- **Round Robin** - Distribute meetings across team members
- **Collective** - All team members must attend
- **Managed Events** - Assign meetings to specific team members
- **Routing Forms** - Route bookers to different event types
- **Sequential Events** - Chain multiple meetings
- **Dynamic Group Links** - Flexible participant count

### Calendar Integration
- **Google Calendar** - Full sync and availability checking
- **Outlook Calendar** - Office 365 and Outlook.com
- **Exchange Calendar** - Microsoft Exchange
- **CalDAV** - iCloud, Fastmail, and other CalDAV providers
- **Multi-calendar Check** - Check availability across multiple calendars
- **Two-way Sync** - Events sync both directions

### Customization & Branding
- **White Labeling** - Remove Cal.com branding
- **Custom Domain** - Use your own domain (e.g., cal.yourcompany.com)
- **Embeddable Widgets** - Inline, popup, and floating button embeds
- **Custom Booking Page** - Customize colors, logos, and layout
- **Custom Email Templates** - Branded email notifications
- **Custom Questions** - Add custom fields to booking forms

### Video Conferencing
- **Daily.co** - Built-in video (default)
- **Zoom** - Integration
- **Google Meet** - Integration
- **Microsoft Teams** - Integration
- **Jitsi** - Self-hosted option
- **Whereby** - Integration
- **Around** - Integration
- **Tandem** - Integration

### Workflow Automation
- **Webhooks** - Real-time event notifications
- **Zapier Integration** - Connect to 5,000+ apps
- **API** - Comprehensive REST API
- **Email Notifications** - Booking confirmations and reminders
- **SMS Notifications** - Via Twilio integration
- **Calendar Event Creation** - Auto-create calendar events
- **Salesforce** - CRM integration
- **HubSpot** - CRM integration
- **Stripe** - Payment processing for paid bookings

### Team Features
- **Team Pages** - Collective team booking page
- **Round Robin Scheduling** - Even distribution
- **Team Routing** - Route to available team members
- **Team Analytics** - Team-wide booking insights
- **Permission Management** - Role-based access
- **Team Event Types** - Shared event configurations

### Analytics & Insights
- **Booking Analytics** - Track booking trends
- **Performance Metrics** - Conversion rates, no-shows
- **User Insights** - Individual performance
- **Team Insights** - Team-wide metrics
- **Export Data** - CSV exports

### Advanced Features
- **Recurring Events** - Repeating bookings
- **Buffer Time** - Pre/post meeting buffers
- **Working Hours** - Configurable availability
- **Date Overrides** - Custom availability for specific dates
- **Minimum Notice** - Require advance booking
- **Maximum Future Booking** - Limit how far in advance
- **Booking Limits** - Daily/weekly booking caps
- **Secret Event Types** - Unlisted bookings
- **Requires Confirmation** - Manual approval for bookings
- **Time Zones** - Automatic time zone detection
- **Payment Integration** - Stripe for paid bookings
- **Multi-language** - 30+ languages supported

### Enterprise Features (Commercial License)
- **SAML SSO** - Enterprise authentication
- **SCIM** - User provisioning
- **Advanced Admin Panel** - Organization management
- **Audit Logs** - Compliance and security
- **SLA Support** - Enterprise support
- **Advanced Permissions** - Granular access control
- **White Glove Onboarding** - Dedicated support

---

## 💻 Tech Stack

### Backend
**Language:** TypeScript (Node.js)
**Framework:** Next.js 14+ (App Router)
**API Layer:** tRPC (type-safe RPC)
**ORM:** Prisma 5+
**Validation:** Zod (TypeScript-first schema validation)
**Background Jobs:** BullMQ, Inngest
**Cache:** Redis

### Frontend
**Framework:** Next.js 14+ (React 18+)
**Styling:** Tailwind CSS 3+
**UI Components:** Radix UI (headless components)
**Forms:** React Hook Form
**State Management:** Zustand, React Query (TanStack Query)
**Icons:** Lucide React
**Date/Time:** Day.js

### Database
**Primary:** PostgreSQL 13+
**ORM:** Prisma
**Migrations:** Prisma Migrate
**Schema:** Strongly typed with Prisma schema

### Infrastructure
**Deployment:** Vercel (recommended), Docker, Kubernetes
**Storage:** S3-compatible (file uploads)
**Email:** SendGrid, AWS SES, Postmark, SMTP
**SMS:** Twilio
**Video:** Daily.co SDK
**Monitoring:** Sentry (errors), LogRocket (session replay)

### Testing
**Unit Tests:** Vitest
**E2E Tests:** Playwright
**Type Checking:** TypeScript strict mode
**Linting:** ESLint
**Formatting:** Prettier

---

## 📦 Key Dependencies & Packages

### Core Dependencies
```json
{
  "dependencies": {
    // Framework
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",

    // API & Data
    "@trpc/server": "^10.x",
    "@trpc/client": "^10.x",
    "@trpc/react-query": "^10.x",
    "@tanstack/react-query": "^5.x",
    "@prisma/client": "^5.x",
    "zod": "^3.x",

    // UI
    "tailwindcss": "^3.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-select": "^2.x",
    "lucide-react": "^0.x",
    "react-hook-form": "^7.x",

    // Date/Time
    "dayjs": "^1.x",
    "date-fns": "^2.x",
    "@calcom/dayjs": "*",

    // Video
    "@daily-co/daily-js": "^0.x",

    // Email
    "@sendgrid/mail": "^7.x",
    "nodemailer": "^6.x",

    // Payments
    "stripe": "^14.x",

    // i18n
    "next-i18next": "^15.x",
    "i18next": "^23.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^1.x",
    "@playwright/test": "^1.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "prisma": "^5.x"
  }
}
```

### Monorepo Packages
```
apps/
  web/              # Main web application
  api/              # Standalone API (optional)

packages/
  @calcom/prisma/   # Database schema and client
  @calcom/trpc/     # tRPC routers and procedures
  @calcom/ui/       # Shared UI components
  @calcom/lib/      # Shared utilities
  @calcom/emails/   # Email templates
  @calcom/features/ # Feature modules
  @calcom/app-store/# Integration marketplace
```

---

## 🏗️ Architecture

### Monorepo Structure
Cal.com uses **Yarn Workspaces** for monorepo management:
- `apps/` - Applications (web, API)
- `packages/` - Shared packages
- Shared TypeScript configuration
- Shared ESLint and Prettier configs

### Full-Stack TypeScript
**End-to-end type safety:**
- Frontend to backend type sharing
- tRPC for type-safe API calls
- Prisma for type-safe database queries
- Zod for runtime validation

### Directory Structure
```
cal.com/
├── apps/
│   └── web/
│       ├── pages/          # Next.js pages (API routes)
│       ├── app/            # Next.js App Router
│       ├── components/     # React components
│       └── public/         # Static assets
├── packages/
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── trpc/
│   │   └── server/
│   │       └── routers/    # API routers
│   ├── ui/
│   │   └── components/     # Shared components
│   ├── lib/                # Utilities
│   ├── features/           # Feature modules
│   │   ├── bookings/
│   │   ├── calendars/
│   │   ├── teams/
│   │   └── ...
│   └── app-store/          # Integrations
│       ├── zoom/
│       ├── googlemeet/
│       ├── stripe/
│       └── ...
├── playwright/             # E2E tests
└── docker/                 # Docker configurations
```

### Key Architectural Patterns
- **Feature-based architecture** - Features organized as packages
- **API Gateway** - tRPC for unified API layer
- **Repository Pattern** - Prisma as data access layer
- **Service Layer** - Business logic in feature packages
- **Event-driven** - Webhooks for external integrations

### Database Schema Highlights
**Core Tables:**
- `users` - User accounts
- `teams` - Organizations and teams
- `eventTypes` - Booking configurations
- `bookings` - Scheduled meetings
- `availability` - User availability schedules
- `calendars` - Connected calendar accounts
- `credentials` - OAuth tokens for integrations
- `workflows` - Automation rules
- `webhooks` - Webhook subscriptions

**Relationships:**
- Users → Event Types (one-to-many)
- Event Types → Bookings (one-to-many)
- Users → Teams (many-to-many via membership)
- Event Types → Teams (for team events)

---

## 🚀 Deployment & Scaling

### Deployment Options
1. **Vercel** (Recommended) - Zero-config deployment
2. **Docker** - Self-hosted with docker-compose
3. **Kubernetes** - Enterprise deployments
4. **Railway** - Alternative PaaS
5. **Render** - Alternative PaaS
6. **Self-hosted VM** - Traditional server deployment

### System Requirements
**Minimum:**
- **RAM:** 2GB
- **CPU:** 2 cores
- **Storage:** 10GB
- **Node.js:** 18+
- **PostgreSQL:** 13+

**Recommended (Production):**
- **RAM:** 4GB+
- **CPU:** 4+ cores
- **Storage:** 50GB+ SSD
- **Database:** PostgreSQL 15+ (managed service)
- **Redis:** For caching and queues

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DATABASE_DIRECT_URL="postgresql://..." # For migrations

# NextAuth
NEXTAUTH_SECRET="random-secret"
NEXTAUTH_URL="https://yourdomain.com"

# Email
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-key"

# Cal.com specific
NEXT_PUBLIC_WEBAPP_URL="https://yourdomain.com"
NEXT_PUBLIC_WEBSITE_URL="https://yourdomain.com"

# Optional: Video
DAILY_API_KEY="your-daily-key"

# Optional: Payments
STRIPE_CLIENT_ID="your-stripe-client-id"
STRIPE_PRIVATE_KEY="your-stripe-key"

# Optional: OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Scalability Features
- **Horizontal Scaling** - Multiple Next.js instances
- **Database Connection Pooling** - Prisma Accelerate
- **CDN** - Static asset distribution
- **Caching** - Redis for session and data caching
- **Background Jobs** - BullMQ for async processing
- **Read Replicas** - Database read scaling

---

## 🔌 Integrations & App Store

### Calendar Providers
- Google Calendar
- Outlook/Office 365
- Exchange Calendar
- iCloud Calendar
- CalDAV

### Video Conferencing
- Daily.co (default, built-in)
- Zoom
- Google Meet
- Microsoft Teams
- Whereby
- Jitsi (self-hosted)
- Around
- Tandem
- Huddle01

### Payment Processing
- Stripe - Payment collection
- PayPal - Alternative payment
- Alipay - Chinese payments

### CRM Integration
- Salesforce
- HubSpot
- Pipedrive
- Close.com
- Zoho CRM

### Communication
- Twilio (SMS)
- SendGrid (Email)
- Mailgun (Email)
- Postmark (Email)
- Slack (Notifications)
- Discord (Notifications)

### Automation
- Zapier (5,000+ app connections)
- Make (Integromat)
- N8N (self-hosted automation)
- Webhooks (custom integrations)

### Analytics
- Google Analytics
- Plausible Analytics
- Fathom Analytics

### App Store Architecture
Integrations are modular packages in `packages/app-store/`:
- Each integration is a standalone package
- Standard interface for app credentials
- OAuth flow handling
- Webhook event processing

---

## 🔒 Security & Compliance

### Security Features
- **Authentication:** NextAuth.js with multiple providers
- **2FA:** Time-based One-Time Password (TOTP)
- **OAuth 2.0:** For third-party integrations
- **API Key Management:** Secure API key storage
- **Rate Limiting:** API throttling
- **CSRF Protection:** Built into Next.js
- **XSS Protection:** React auto-escaping
- **SQL Injection Protection:** Prisma parameterized queries

### Data Protection
- **Encryption at Rest:** Database encryption
- **Encryption in Transit:** TLS/HTTPS only
- **Data Residency:** Self-hosting for data sovereignty
- **Data Deletion:** GDPR-compliant user data deletion
- **Data Export:** User data export capabilities

### Compliance
- **GDPR** - General Data Protection Regulation
- **SOC 2** - Service Organization Control (Cal.com Cloud)
- **ISO 27001** - Information Security Management
- **HIPAA** - Health Insurance Portability (with configuration)
- **CCPA** - California Consumer Privacy Act

---

## 🌍 Community & Support

### Community Resources
- **GitHub Discussions:** Q&A and feature requests
- **Discord:** Real-time chat (15,000+ members)
- **Twitter/X:** @calcom updates
- **Blog:** cal.com/blog
- **Documentation:** docs.cal.com

### Contributing
- **772+ contributors**
- **Open to pull requests**
- **Contributor License Agreement (CLA):** Required
- **Code of Conduct:** Enforced
- **Good First Issues:** Labeled for newcomers

### Support Tiers
- **Community Support:** Free via GitHub/Discord
- **Priority Support:** Paid support plans
- **Enterprise Support:** SLA-backed support

---

## ⚖️ Licensing

### Open Core Model
**AGPLv3** - 99% of core features
- Scheduling
- Calendar sync
- Integrations
- API
- Self-hosting

**Commercial License** - 1% enterprise features
- SAML SSO
- SCIM provisioning
- Advanced admin controls
- Audit logs
- Enterprise SLA support

**Key Points:**
- Free to use and modify for personal/commercial use
- Must open-source modifications if deployed publicly
- Can purchase commercial license to avoid AGPL requirements
- White-labeling allowed even on AGPLv3

---

## 💡 Unique Selling Points

### Why Cal.com?
1. **Open Source** - Full control of your scheduling data
2. **No Vendor Lock-in** - Export data anytime
3. **Privacy-First** - Self-hosting option
4. **White Label** - Remove Cal.com branding
5. **API-First** - Everything accessible via API
6. **Modern Tech Stack** - TypeScript, Next.js, Prisma
7. **Active Development** - Weekly releases
8. **Large Community** - 36k+ stars, 772+ contributors
9. **Flexible Pricing** - Free self-hosted, affordable cloud
10. **Embeddable** - Widget integration for your website

### Compared to Competitors
**vs. Calendly:**
- Open source (Calendly is proprietary)
- Self-hosting option
- White-label without enterprise plan
- More affordable at scale
- Full API access on all plans

**vs. Chili Piper:**
- More affordable
- Open source
- Better for small teams
- Easier setup

**vs. Acuity Scheduling:**
- Modern interface
- Better developer experience
- Active open-source community
- More integrations via app store

---

## 📈 Statistics

- **GitHub Stars:** 36,000+
- **Contributors:** 772+
- **Commits:** 14,000+
- **Forks:** 8,000+
- **Languages:** TypeScript (93%), JavaScript (4%)
- **Open Issues:** ~500 (actively triaged)
- **Closed Issues:** 3,000+
- **Used By:** 20,000+ organizations

---

## 🎓 Learning Resources

### Official Documentation
- **Website:** https://cal.com
- **Docs:** https://docs.cal.com
- **API Docs:** https://api.cal.com/docs
- **GitHub:** https://github.com/calcom/cal.com

### Setup Guides
- Self-hosting guide
- Vercel deployment
- Docker deployment
- Environment variables reference

### Developer Resources
- Contributing guide
- Architecture overview
- API reference
- Webhook documentation

---

## 🚧 Development Setup

### Quick Start
```bash
# Clone repository
git clone https://github.com/calcom/cal.com.git
cd cal.com

# Install dependencies
yarn install

# Setup database
yarn db-setup

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Run migrations
yarn prisma migrate dev

# Start development server
yarn dev

# Access at http://localhost:3000
```

### Development Tools
```bash
# Type checking
yarn typecheck

# Linting
yarn lint

# Formatting
yarn format

# Testing
yarn test        # Unit tests
yarn test:e2e    # E2E tests with Playwright

# Database
yarn prisma studio  # Visual database browser
yarn prisma migrate # Run migrations
```

---

## 📊 Roadmap & Future

### Recent Additions (2024-2025)
- Platform v2 - New infrastructure layer
- AI-powered scheduling suggestions
- Enhanced team features
- Improved mobile apps
- Better analytics

### Upcoming Features
- Calendar sync improvements
- More integrations
- Enhanced routing logic
- Better mobile experience
- AI meeting optimization

---

**Last Updated:** 2025-01-17
**Source:** Official GitHub repository and documentation
**Analysis Version:** 1.0
