# Canvas LMS - Comprehensive Analysis

> **Project Type:** Learning Management System (LMS)
> **License:** AGPLv3
> **GitHub:** https://github.com/instructure/canvas-lms
> **Maintainer:** Instructure, Inc.
> **GitHub Stars:** ~5,000+
> **Contributors:** 415+
> **Status:** Actively maintained

---

## 📋 What is Canvas LMS?

Canvas is a **modern, open-source Learning Management System** developed and maintained by Instructure Inc. It's designed for educational institutions, corporations, and organizations to deliver online courses, manage learning content, track student progress, and facilitate communication between instructors and learners.

**Target Users:**
- Educational institutions (K-12, higher education)
- Corporate training departments
- Online course creators
- Government training programs

**Market Position:**
- Leading open-source LMS (competing with Moodle, Blackboard)
- Used by millions of students worldwide
- Enterprise-grade features with open-source flexibility

---

## 🎯 Core Features

### Course Management
- **Course Creation & Organization** - Create and structure courses with modules and pages
- **Content Management** - Upload files, embed videos, create rich text content
- **Modules & Pages** - Organize content into logical learning paths
- **Course Templates** - Reusable course structures and content
- **Assignment Management** - Create, distribute, and grade assignments
- **Quizzes & Assessments** - Built-in quiz engine with various question types

### Student Features
- **Gradebook** - Comprehensive grade tracking and reporting
- **Submissions** - File uploads, text submissions, online submissions
- **Discussions** - Threaded discussion boards
- **Notifications** - Email and in-app notifications
- **Calendar** - Course schedule and deadline tracking
- **Mobile Apps** - Native iOS and Android apps

### Instructor Features
- **Gradebook** - Flexible grading with rubrics and speedgrader
- **SpeedGrader** - Fast assignment grading interface
- **Rubrics** - Custom grading rubrics
- **Analytics** - Student engagement and performance analytics
- **Attendance** - Track student attendance
- **Peer Review** - Facilitate peer-to-peer feedback

### Administrative Features
- **Multi-tenancy** - Support multiple institutions/organizations
- **Role-based Permissions** - Granular access control
- **SIS Integration** - Student Information System integration
- **LTI Support** - Learning Tools Interoperability for third-party tools
- **API** - Comprehensive REST API
- **Reporting** - Institution-wide analytics and reports
- **Sub-accounts** - Hierarchical organization structure

### Collaboration
- **Conferences** - Video conferencing (BigBlueButton integration)
- **Collaborations** - Google Docs integration for collaborative editing
- **Groups** - Student group creation and management
- **Announcements** - Course-wide announcements
- **Inbox** - Internal messaging system

### Advanced Features
- **Learning Outcomes** - Define and track learning objectives
- **Standards-based Grading** - Align assessments with standards
- **Mastery Paths** - Adaptive learning paths based on performance
- **Course Import/Export** - Common Cartridge format support
- **Plagiarism Detection** - Integration with Turnitin, Unicheck
- **Accessibility** - WCAG 2.1 AA compliance
- **Customization** - Theme editor and branding options

---

## 💻 Tech Stack

### Backend
**Language:** Ruby 2.7+ (52.3% of codebase)
**Framework:** Ruby on Rails
**ORM:** ActiveRecord
**Background Jobs:** Delayed Job, Sidekiq
**Cache:** Redis
**Search:** Elasticsearch (optional)
**File Storage:** S3-compatible storage, local filesystem

### Frontend
**Languages:**
- JavaScript (24.1%)
- TypeScript (19.6%)
- HTML (2.1%)
- SCSS (1.2%)

**Frameworks/Libraries:**
- React.js (UI components)
- Primer React (UI component library from GitHub)
- jQuery (legacy code)
- Backbone.js (legacy code)

**Build Tools:**
- Webpack (module bundler)
- Rspack (modern build tool alternative)
- Gulp (task runner)
- Yarn/npm (package management)

**Linting/Formatting:**
- ESLint
- Biome (modern linter)
- Prettier

### Database
**Primary:** PostgreSQL 12+
**Features Used:**
- JSONB for flexible data storage
- Full-text search capabilities
- Partitioning for large tables
- Stored procedures

### Infrastructure
**Web Server:** Puma (Ruby web server)
**Reverse Proxy:** Nginx (typical deployment)
**Containerization:** Docker (Dockerfiles provided)
**CI/CD:** Jenkins (Jenkinsfile configurations)

### Testing
**Backend:**
- RSpec (Ruby testing)
- Factory Bot (test data)
- Selenium (integration tests)

**Frontend:**
- Jest (JavaScript testing)
- Vitest (modern test runner)
- React Testing Library

---

## 📦 Key Dependencies & Packages

### Ruby Gems (Backend)
```ruby
# Framework
rails (~> 7.0)
puma (~> 6.0)

# Database
pg (~> 1.4)
redis (~> 5.0)

# Background Jobs
delayed_job (~> 4.1)
sidekiq (~> 7.0)

# File Processing
aws-sdk-s3
paperclip or shrine (file attachments)

# Authentication
devise
omniauth (OAuth providers)
doorkeeper (OAuth server)

# API
grape (REST API framework)
graphql-ruby

# Search
elasticsearch-rails

# Utilities
nokogiri (XML/HTML parsing)
sanitize (HTML sanitization)
mail
```

### npm/Yarn Packages (Frontend)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@primer/react": "^36.x",
    "axios": "^1.x",
    "moment": "^2.x",
    "date-fns": "^2.x",
    "lodash": "^4.x",
    "i18next": "^23.x",
    "react-i18next": "^13.x"
  },
  "devDependencies": {
    "webpack": "^5.x",
    "typescript": "^5.x",
    "eslint": "^8.x",
    "jest": "^29.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x"
  }
}
```

---

## 🏗️ Architecture

### Monolithic Architecture
Canvas uses a **monolithic Rails application** architecture with:
- Single codebase for backend and frontend
- Modular organization within the monolith
- Service objects for business logic
- Background jobs for async processing

### Key Architectural Patterns
- **MVC** (Model-View-Controller) - Rails convention
- **Service Objects** - Business logic encapsulation
- **Background Jobs** - Async processing with Delayed Job/Sidekiq
- **API Gateway** - REST and GraphQL endpoints
- **Event-driven** - Webhook notifications for external integrations

### Directory Structure
```
canvas-lms/
├── app/
│   ├── controllers/      # Request handlers
│   ├── models/           # Database models (ActiveRecord)
│   ├── views/            # ERB/React templates
│   ├── services/         # Business logic
│   ├── graphql/          # GraphQL schema and resolvers
│   └── jobs/             # Background jobs
├── config/               # Configuration files
├── db/
│   ├── migrate/          # Database migrations
│   └── seeds/            # Seed data
├── lib/                  # Shared libraries
├── public/               # Static assets
├── spec/                 # RSpec tests
├── ui/                   # React frontend components
│   ├── features/         # Feature-specific components
│   ├── shared/           # Shared React components
│   └── boot/             # Frontend initialization
└── gems/                 # Custom extracted gems
```

### Database Schema Highlights
- **200+ tables** for comprehensive LMS functionality
- Key tables: users, courses, assignments, submissions, enrollments, discussions
- Sharding support for large deployments
- Database partitioning for performance

---

## 🚀 Deployment & Scaling

### Deployment Options
1. **Self-hosted** - Deploy on your own servers
2. **Cloud-hosted** - AWS, Google Cloud, Azure
3. **Managed Canvas** - Instructure's hosted offering (not open-source)

### System Requirements
- **RAM:** 8GB minimum (16GB+ recommended)
- **CPU:** 4 cores minimum
- **Storage:** 100GB+ (depends on content)
- **OS:** Linux (Ubuntu, CentOS), macOS for development
- **Ruby:** 2.7+ (3.x supported)
- **Node.js:** 18+
- **PostgreSQL:** 12+
- **Redis:** 6+

### Scalability Features
- Horizontal scaling with multiple app servers
- Database read replicas
- CDN for static assets
- Background job workers scaling
- Caching strategies (Redis, memcached)

---

## 🔌 Integrations & Ecosystem

### LTI (Learning Tools Interoperability)
- LTI 1.1 and 1.3 support
- External tools integration
- Grade passback

### SIS (Student Information System)
- SIS import/export
- Automated enrollment sync
- Grade export to SIS

### Third-party Integrations
- **Video Conferencing:** BigBlueButton, Zoom, Microsoft Teams
- **Plagiarism Detection:** Turnitin, Unicheck
- **Collaboration:** Google Drive, Office 365
- **Content:** Common Cartridge import/export
- **Authentication:** SAML, LDAP, OAuth, CAS
- **Analytics:** Segment, Google Analytics

### API
- **REST API** - Comprehensive API for all Canvas features
- **GraphQL API** - Modern query language for flexible data fetching
- **Webhooks** - Real-time event notifications
- **OAuth 2.0** - Secure authentication for integrations

---

## 🔒 Security & Compliance

### Security Features
- **Authentication:** Multiple provider support (SAML, LDAP, OAuth)
- **Authorization:** Role-based access control (RBAC)
- **Data Encryption:** At rest and in transit (TLS)
- **Session Management:** Secure session handling
- **XSS Protection:** Input sanitization
- **CSRF Protection:** Rails built-in protection
- **Rate Limiting:** API throttling

### Compliance
- **FERPA** - Family Educational Rights and Privacy Act
- **COPPA** - Children's Online Privacy Protection Act
- **GDPR** - General Data Protection Regulation (EU)
- **WCAG 2.1 AA** - Accessibility compliance
- **Section 508** - U.S. accessibility standards

---

## 📱 Mobile Apps

### Canvas Student App
- Native iOS and Android apps
- Course access, assignments, grades
- Push notifications
- Offline content access

### Canvas Teacher App
- SpeedGrader mobile
- Announcements and messaging
- Grade entry

### Canvas Parent App
- Monitor student progress
- View grades and assignments
- Communication with teachers

---

## 🌍 Community & Support

### Community Resources
- **Canvas Community:** community.canvaslms.com
- **Documentation:** community.canvaslms.com/docs
- **API Documentation:** canvas.instructure.com/doc/api
- **GitHub Issues:** Bug reports and feature requests
- **Mailing Lists:** Canvas-lms Google Group

### Contributing
- 415+ contributors
- Open to pull requests
- Contributor License Agreement (CLA) required
- Code of Conduct enforced

---

## ⚖️ Licensing

**AGPLv3** (GNU Affero General Public License v3)

**Key Points:**
- Free to use, modify, and distribute
- Must share modifications if deployed publicly
- Network use triggers copyleft (AGPL vs GPL)
- Cannot use as proprietary SaaS without open-sourcing modifications

**Important Note:**
Some Canvas features are **not open source** and exist in separate proprietary repositories. These include certain analytics, studio, and enterprise features.

---

## 🔄 Release Cycle

### Branches
- **Master** - Development branch (unstable)
- **Beta** - Testing branch (updated every 14 days)
- **Stable** - Production branch (released versions)

### Release Schedule
- Releases approximately every 3 weeks
- Beta branch updated from master bi-weekly
- Hot fixes for critical issues

---

## 💡 Unique Selling Points

### Why Canvas?
1. **Modern Interface** - Clean, intuitive UI compared to older LMS platforms
2. **Mobile-first** - Strong mobile app support
3. **API-first** - Everything accessible via API
4. **Open Source** - Full control and customization
5. **Active Development** - Regular updates and improvements
6. **Large Community** - Extensive plugin and integration ecosystem
7. **Proven Scale** - Handles millions of users
8. **Standards Compliance** - LTI, QTI, Common Cartridge support

### Compared to Competitors
**vs. Moodle:**
- More modern UI/UX
- Better mobile apps
- Cleaner codebase (Ruby vs PHP)

**vs. Blackboard:**
- Open source (Blackboard is proprietary)
- Lower cost of ownership
- More flexible customization

**vs. Google Classroom:**
- More features for higher ed
- Better assessment tools
- Self-hosting option

---

## 📈 Statistics

- **Codebase:** 74,704+ commits
- **Languages:** Ruby (52.3%), JavaScript (24.1%), TypeScript (19.6%)
- **Code Size:** ~2M+ lines of code
- **Contributors:** 415+
- **GitHub Stars:** ~5,000+
- **Used By:** Thousands of institutions worldwide
- **Active Users:** Millions of students and instructors

---

## 🎓 Learning Resources

### Official Documentation
- Installation Guide: https://github.com/instructure/canvas-lms/wiki
- API Docs: https://canvas.instructure.com/doc/api
- Developer Guide: https://github.com/instructure/canvas-lms/wiki/Quick-Start

### Setup Guides
- Quick Start (development)
- Production Start (deployment)
- Docker setup guides

---

## 🚧 Development Setup

### Prerequisites
```bash
# Ruby
ruby 2.7+ (3.x recommended)

# Node.js
node 18+

# Database
postgresql 12+
redis 6+

# Build tools
yarn
webpack
```

### Quick Start
```bash
# Clone repository
git clone https://github.com/instructure/canvas-lms.git
cd canvas-lms

# Install Ruby dependencies
bundle install

# Install Node dependencies
yarn install

# Setup database
bundle exec rake db:create db:migrate

# Start server
bundle exec rails server

# Start webpack (in separate terminal)
yarn webpack
```

---

**Last Updated:** 2025-01-17
**Source:** Official GitHub repository and documentation
**Analysis Version:** 1.0
