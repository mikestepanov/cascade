# Nixelo Documentation

Welcome to the Nixelo documentation. This folder contains all technical documentation for the project.

## Documentation Index

### Setup & Configuration

| Document | Description |
|----------|-------------|
| [Setup Guide](./setup/README.md) | Environment setup, configuration |
| [Environment Variables](./setup/ENV.md) | Required env vars |
| [PWA Setup](./setup/PWA.md) | Progressive Web App configuration |
| [Path Aliases](./setup/PATH_ALIASES.md) | Import path configuration |
| [Authentication](./AUTHENTICATION.md) | Auth methods, user management |

### Features

| Document | Description |
|----------|-------------|
| [AI Overview](./ai/README.md) | AI features (Text AI + Voice AI) |
| [Text AI](./ai/text/README.md) | Chat, semantic search, suggestions |
| [Voice AI](./ai/voice/README.md) | Meeting bot, transcription, summaries |
| [Email System](./email/README.md) | Email notifications, templates |
| [Fuzzy Search](./FUZZY_SEARCH.md) | Search implementation guide |
| [REST API](./API.md) | API endpoints, authentication |
| [Color System](./COLORS.md) | Semantic color tokens, theming |

### Integrations

| Document | Description |
|----------|-------------|
| [Integrations Overview](./integrations/README.md) | GitHub, Google Calendar, offline |
| [Google Calendar Setup](./integrations/GOOGLE_CALENDAR_SETUP.md) | Calendar sync configuration |

### Convex Backend

| Document | Description |
|----------|-------------|
| [Convex Overview](./convex/README.md) | Backend patterns and guides |
| [Best Practices](./convex/BEST_PRACTICES.md) | Query optimization, error handling |
| [Components](./convex/COMPONENTS.md) | Rate limiter, cache, aggregates |
| [Errors](./convex/ERRORS.md) | Error handling, ConvexError usage |
| [Performance](./convex/PERFORMANCE.md) | Query limits, indexing |
| [Pagination](./convex/PAGINATION.md) | Cursor-based pagination patterns |

### Architecture & Research

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture/README.md) | System design, data model |
| [Research & Competitors](./research/README.md) | Market analysis, competitor comparison |
| [Meeting Intelligence](./research/meeting-intelligence.md) | Read AI, Fireflies, open source bots |
| [PM Tools Comparison](./research/pm-tools.md) | Jira, Linear, ClickUp analysis |

### Testing

| Document | Description |
|----------|-------------|
| [Testing Overview](./testing/README.md) | Testing strategy and guides |
| [E2E Tests](./testing/e2e.md) | End-to-end testing with Playwright |
| [Unit Tests](./testing/unit.md) | Unit testing patterns |
| [Backend Tests](./testing/backend.md) | Convex function testing |

### Performance

| Document | Description |
|----------|-------------|
| [Bundle Optimization](./bundle/GUIDE.md) | Bundle size optimization guide |
| [Bundle Results](./bundle/) | Historical bundle size measurements |

## Quick Links

- **Main Project Guide:** [CLAUDE.md](../CLAUDE.md)
- **Contributing:** [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Backend README:** [convex/README.md](../convex/README.md)

## Folder Structure

```
docs/
├── ai/              # AI features (text + voice)
├── architecture/    # System design, data model
├── archive/         # Deprecated/historical docs
├── bundle/          # Bundle optimization
├── convex/          # Convex backend patterns
├── email/           # Email system
├── integrations/    # External integrations
├── research/        # Competitor analysis
├── setup/           # Setup guides
└── testing/         # Test guides
```

## Documentation Standards

All documentation should include:
- Title with `# Heading`
- Clear sections with `##` headings
- Code examples where applicable
- `*Last Updated: YYYY-MM-DD*` at the bottom

---

*Last Updated: 2026-01-20*
