# Kimai - Comprehensive Analysis

> **Project Type:** Time Tracking Application
> **License:** AGPL-3.0
> **GitHub:** https://github.com/kimai/kimai
> **Company:** Kimai (Kevin Papst)
> **GitHub Stars:** 3,500+
> **Contributors:** 100+
> **Status:** Actively maintained
> **Business Model:** Open Source + SaaS (kimai.cloud)

---

## 📋 What is Kimai?

Kimai is a **professional, free, and open-source time-tracking application** that handles use cases of freelancers as well as companies with dozens or hundreds of users. It's designed to be self-hosted, giving you complete control over your time tracking data.

**Tagline:** "Free & Open-Source Time-Tracker"

**Key Focus:**
- Professional time tracking for businesses
- Invoice generation
- Multi-user and multi-client support
- Advanced reporting and analytics
- Self-hosted with full data control

**Target Users:**
- Freelancers and consultants
- Small to large businesses
- Agencies and studios
- Teams tracking billable hours
- Project managers
- Anyone needing detailed time tracking

---

## 🎯 Core Features

### Time Tracking
- **Start/Stop Timer** - Click to start tracking time
- **Punch Clock Mode** - Clock in/clock out for shift workers
- **Multi-timer Support** - Track multiple activities simultaneously
- **Manual Time Entry** - Add time entries manually
- **Duration Input** - Enter durations directly
- **Time Rounding** - Configurable rounding rules
- **Automatic Breaks** - Deduct breaks automatically
- **Overtime Tracking** - Track overtime hours
- **Recurring Timesheets** - Automatic time entry creation

### Project & Task Management
- **Projects** - Organize work by projects
- **Activities** - Track specific tasks within projects
- **Customers** - Client management
- **Tags** - Categorize time entries
- **Teams** - Group users by team
- **Task Assignments** - Assign tasks to team members
- **Billable vs Non-billable** - Mark entries accordingly

### Invoicing
- **Invoice Generation** - Create invoices from time entries
- **Invoice Templates** - Customizable invoice layouts
- **Multiple Templates** - Different templates per customer
- **PDF Export** - Generate PDF invoices
- **HTML/DOCX Export** - Alternative formats
- **Tax Calculation** - VAT and tax support
- **Multi-currency** - Support for multiple currencies
- **Invoice Numbering** - Automatic sequential numbering
- **Partial Invoicing** - Invoice specific time entries
- **Recurring Invoices** - Automatic invoice generation

### Reporting & Analytics
- **Time Reports** - Detailed time analysis
- **Project Reports** - Per-project breakdowns
- **User Reports** - Individual user activity
- **Customer Reports** - Per-customer summaries
- **Revenue Reports** - Income tracking
- **Export Options** - PDF, Excel, CSV, HTML
- **Custom Date Ranges** - Flexible reporting periods
- **Budget Tracking** - Track project budgets (time and money)
- **Utilization Reports** - Employee utilization rates
- **Charts & Graphs** - Visual analytics

### Budget Management
- **Time Budgets** - Set hour limits for projects
- **Money Budgets** - Set financial limits
- **Budget Warnings** - Alerts when approaching limits
- **Budget Reports** - Track budget consumption
- **Per-Customer Budgets** - Client-specific budgets
- **Per-Project Budgets** - Project-specific budgets
- **Budget Recurrence** - Monthly/yearly budget resets

### User Management
- **Multi-user** - Unlimited users (self-hosted)
- **Role-based Permissions** - Granular access control
- **User Roles:** Super Admin, Admin, Teamlead, User
- **Team Management** - Organize users into teams
- **User Preferences** - Individual settings
- **User Rates** - Per-user hourly rates
- **User Targets** - Daily/weekly hour targets

### Advanced Features
- **JSON API** - RESTful API for integrations
- **Webhooks** - Real-time event notifications
- **Two-Factor Authentication (2FA)** - TOTP security
- **SAML/LDAP/Database Auth** - Multiple auth methods
- **Multi-language** - 30+ translations
- **Multi-timezone** - Global team support
- **Custom Fields** - Add custom metadata
- **Expense Tracking** - Track project expenses
- **Lock Timesheets** - Prevent modifications
- **Approval Workflow** - Timesheet approval process
- **Calendar Integration** - iCal export

### Customization
- **Custom Rates** - User/customer/project-specific rates
- **Custom Fields** - Add metadata to entities
- **Custom Reports** - Define custom report templates
- **Theming** - Customize appearance (via plugins)
- **Branding** - Add company logo and colors
- **Language Packs** - Create translations

### Plugin System
- **Extensible Architecture** - Plugin-based extensions
- **Plugin Marketplace** - Official plugin store (kimai.org/store)
- **Free Plugins:** Audit trail, expenses, Kiosk mode
- **Paid Plugins:** Advanced reporting, custom fields, invoicing templates
- **Community Plugins** - Third-party extensions

---

## 💻 Tech Stack

### Backend
**Language:** PHP 8.1.3+ (latest: PHP 8.3 supported)
**Framework:** Symfony 6.4 LTS
**ORM:** Doctrine 3.x
**Template Engine:** Twig 3.x
**API:** FOSRestBundle for REST API
**Authentication:** Symfony Security Component
**Validation:** Symfony Validator

### Frontend
**UI Framework:** Bootstrap 5.x
**Admin Template:** Tabler (modern admin dashboard)
**JavaScript:** Vanilla JS, jQuery (minimal usage)
**Charts:** Chart.js for analytics
**Date/Time:** Moment.js, Flatpickr
**Icons:** Tabler Icons, Font Awesome

### Database
**Supported Databases:**
- **MySQL** 5.7+ (recommended: MySQL 8.0+)
- **MariaDB** 10.4+ (recommended: MariaDB 10.11+)
- **PostgreSQL** (community support)

**Database Features:**
- Database migrations (Doctrine Migrations)
- Foreign key constraints
- Indexing for performance
- Full-text search capabilities

### Build Tools
**PHP Dependency Manager:** Composer 2.x
**Asset Bundling:** Webpack Encore
**CSS Preprocessor:** SCSS/Sass
**JavaScript Bundler:** Webpack

### Development Tools
**Code Quality:**
- **PHPStan** - Static analysis (Level 5)
- **PHP-CS-Fixer** - Code style fixing
- **PHPUnit** - Unit and integration testing
- **ESLint** - JavaScript linting

---

## 📦 Key Dependencies & Packages

### Composer Dependencies (PHP)
```json
{
  "require": {
    "php": ">=8.1.3",
    "ext-json": "*",
    "ext-mbstring": "*",
    "ext-pdo": "*",

    # Framework
    "symfony/framework-bundle": "^6.4",
    "symfony/console": "^6.4",
    "symfony/form": "^6.4",
    "symfony/validator": "^6.4",
    "symfony/security-bundle": "^6.4",
    "symfony/translation": "^6.4",
    "symfony/twig-bundle": "^6.4",

    # ORM
    "doctrine/orm": "^3.0",
    "doctrine/doctrine-bundle": "^2.11",
    "doctrine/doctrine-migrations-bundle": "^3.3",

    # API
    "friendsofsymfony/rest-bundle": "^3.7",
    "jms/serializer-bundle": "^5.4",
    "nelmio/api-doc-bundle": "^4.26",

    # Authentication
    "scheb/2factor-bundle": "^7.3",
    "symfony/ldap": "^6.4",

    # Utilities
    "symfony/mailer": "^6.4",
    "twig/twig": "^3.8",
    "monolog/monolog": "^3.5",
    "symfony/http-client": "^6.4"
  },
  "require-dev": {
    "phpstan/phpstan": "^1.10",
    "friendsofphp/php-cs-fixer": "^3.48",
    "phpunit/phpunit": "^10.5",
    "symfony/phpunit-bridge": "^7.0"
  }
}
```

### NPM Dependencies (Frontend)
```json
{
  "dependencies": {
    "@tabler/core": "^1.x",
    "bootstrap": "^5.x",
    "chart.js": "^4.x",
    "flatpickr": "^4.x",
    "moment": "^2.x",
    "axios": "^1.x"
  },
  "devDependencies": {
    "@symfony/webpack-encore": "^4.x",
    "sass": "^1.x",
    "webpack": "^5.x",
    "eslint": "^8.x"
  }
}
```

---

## 🏗️ Architecture

### MVC Architecture (Symfony)
Kimai follows Symfony's **Model-View-Controller** pattern:
- **Models (Entities):** Database entities with Doctrine
- **Views (Templates):** Twig templates for rendering
- **Controllers:** Request handling and business logic

### Directory Structure
```
kimai/
├── assets/               # Frontend assets
│   ├── js/              # JavaScript files
│   ├── css/             # SCSS/CSS files
│   └── images/          # Images and icons
├── bin/                 # Executable scripts
│   └── console          # Symfony console commands
├── config/              # Configuration files
│   ├── packages/        # Bundle configurations
│   ├── routes/          # Routing definitions
│   └── services.yaml    # Service container
├── migrations/          # Database migrations
├── public/              # Web-accessible files
│   ├── index.php        # Front controller
│   └── bundles/         # Compiled assets
├── src/
│   ├── API/             # API endpoints
│   ├── Controller/      # MVC controllers
│   ├── Entity/          # Doctrine entities
│   ├── Form/            # Symfony forms
│   ├── Repository/      # Data access layer
│   ├── Timesheet/       # Time tracking logic
│   ├── Invoice/         # Invoicing logic
│   ├── Export/          # Data export
│   ├── Reporting/       # Reports and analytics
│   ├── Widget/          # Dashboard widgets
│   └── EventSubscriber/ # Event listeners
├── templates/           # Twig templates
│   ├── timesheet/       # Time tracking UI
│   ├── invoice/         # Invoice templates
│   ├── reporting/       # Report views
│   └── layout/          # Base layouts
├── tests/               # PHPUnit tests
├── translations/        # i18n translations
├── var/
│   ├── cache/           # Application cache
│   └── log/             # Log files
└── vendor/              # Composer dependencies
```

### Key Architectural Patterns
- **Repository Pattern** - Data access abstraction
- **Service Layer** - Business logic separation
- **Event-driven** - Symfony EventDispatcher
- **Dependency Injection** - Symfony DI container
- **Form Builder** - Symfony Form component
- **Voter Pattern** - Authorization checks

### Database Schema
**Core Tables:**
- `users` - User accounts
- `customers` - Clients/customers
- `projects` - Projects for customers
- `activities` - Tasks within projects
- `timesheet` - Time entries
- `invoices` - Generated invoices
- `invoice_templates` - Invoice layouts
- `tags` - Categorization tags
- `teams` - User groups
- `expenses` - Project expenses
- `user_preferences` - User settings

**Key Relationships:**
- Customer → Projects (one-to-many)
- Project → Activities (one-to-many)
- Timesheet → User, Project, Activity (many-to-one)
- Invoice → Timesheet entries (many-to-many)

---

## 🚀 Deployment & Hosting

### Self-Hosting (Recommended)
**Server Requirements:**
- **PHP:** 8.1.3 or higher
- **Database:** MySQL 5.7+ or MariaDB 10.4+
- **Web Server:** Apache 2.4+ or Nginx 1.18+
- **RAM:** 512MB minimum (1GB+ recommended)
- **Storage:** 1GB+ (depends on usage)
- **HTTPS:** Required for production

**Recommended Setup:**
- **OS:** Ubuntu 22.04 LTS
- **PHP:** 8.3
- **Database:** MariaDB 10.11+
- **Web Server:** Nginx with PHP-FPM
- **SSL:** Let's Encrypt (free)

### Cloud Hosting (Kimai Cloud)
**SaaS Option:** https://www.kimai.cloud
- Managed hosting by Kimai developers
- No installation required
- Automatic updates
- Backup included
- Starts at €5/month per user
- 14-day free trial

### Docker Deployment
```yaml
# docker-compose.yml
version: '3'
services:
  kimai:
    image: kimai/kimai2:latest
    ports:
      - "8080:8001"
    environment:
      - DATABASE_URL=mysql://kimai:kimai@db:3306/kimai
      - MAILER_URL=null://null
    volumes:
      - kimai-data:/opt/kimai/var
    depends_on:
      - db

  db:
    image: mariadb:10.11
    environment:
      - MYSQL_DATABASE=kimai
      - MYSQL_USER=kimai
      - MYSQL_PASSWORD=kimai
      - MYSQL_ROOT_PASSWORD=root
    volumes:
      - db-data:/var/lib/mysql

volumes:
  kimai-data:
  db-data:
```

### Shared Hosting
Kimai can run on shared hosting (with PHP support):
- cPanel hosting
- Plesk hosting
- Minimum: PHP 8.1, MySQL 5.7
- Requires shell access for installation

---

## 🔌 Integrations & Plugins

### Official Plugins (Free)
- **Audit Trail** - Track all changes
- **Custom CSS** - Add custom styling
- **Expenses** - Track project expenses
- **Kiosk Mode** - Simplified clock in/out interface
- **Lockdown** - Lock past time entries
- **Metadata** - Custom fields for entities
- **Translation** - Community translations

### Official Plugins (Paid)
Available at https://www.kimai.org/store/
- **Advanced Reporting** - Custom report builder
- **Invoice Templates** - Professional invoice designs
- **Approval** - Timesheet approval workflow
- **Custom Fields Pro** - Advanced custom fields
- **Working Contracts** - Track expected hours
- **Recurring Timesheets** - Auto-generate entries
- **Calendar View** - Visual time planning

### API & Integrations
**REST API:**
- Full REST API (OpenAPI/Swagger documented)
- Authentication: API tokens
- Endpoints for all entities (users, customers, projects, timesheets)
- Rate limiting

**Third-party Integrations:**
- **Mobile Apps:** iOS and Android apps (community-built)
- **Browser Extensions:** Chrome, Firefox time tracking
- **Zapier:** Connect to 5,000+ apps
- **LDAP/Active Directory:** User authentication
- **SAML SSO:** Enterprise authentication
- **Webhooks:** Custom integrations

---

## 🔒 Security & Permissions

### Authentication
- **Database:** Username/password
- **LDAP/Active Directory:** Enterprise authentication
- **SAML:** Single Sign-On for enterprises
- **Two-Factor Authentication (2FA):** TOTP-based
- **Remember Me:** Persistent login
- **Session Management:** Secure session handling

### Authorization (Roles)
**Built-in Roles:**
1. **ROLE_USER** - Regular user
   - Track own time
   - View own timesheets
   - Basic reports

2. **ROLE_TEAMLEAD** - Team leader
   - Manage team members
   - View team timesheets
   - Approve timesheets
   - Team reports

3. **ROLE_ADMIN** - Administrator
   - Manage users
   - Create customers/projects
   - System configuration
   - All reports

4. **ROLE_SUPER_ADMIN** - Super administrator
   - Full system access
   - Plugin management
   - Security settings
   - System updates

### Permissions System
**Granular Permissions:**
- View/edit own timesheet
- View/edit other timesheets
- Create/edit customers
- Create/edit projects
- Create/edit activities
- View reports
- Create invoices
- Manage users
- System configuration

### Security Features
- **CSRF Protection:** Built-in Symfony protection
- **XSS Prevention:** Twig auto-escaping
- **SQL Injection Prevention:** Doctrine parameterized queries
- **Password Hashing:** bcrypt/argon2i
- **Rate Limiting:** API throttling
- **Audit Logs:** Track all changes (with plugin)
- **Session Security:** HTTP-only cookies, secure flag

---

## 🌍 Internationalization

### Supported Languages (30+)
- English (default)
- German
- French
- Spanish
- Italian
- Dutch
- Portuguese
- Russian
- Polish
- Czech
- Japanese
- Chinese
- Arabic
- Turkish
- And 15+ more...

### Translation System
- **Translation files:** YAML format
- **Contributed by community**
- **Easy to add new languages**
- **Per-user language preference**
- **Date/time localization**
- **Currency formatting**

---

## 📱 Mobile Support

### Mobile Apps (Community)
**iOS App:**
- Available on App Store
- Native Swift app
- Offline support
- Push notifications

**Android App:**
- Available on Google Play
- Native Kotlin app
- Offline support
- Widgets

### Mobile Web
- **Responsive Design:** Works on mobile browsers
- **PWA Capable:** Can be "installed" on mobile
- **Touch-optimized:** Easy mobile interaction

---

## 🌍 Community & Support

### Community Resources
- **Website:** kimai.org
- **Documentation:** kimai.org/documentation
- **API Docs:** kimai.org/documentation/rest-api.html
- **GitHub:** github.com/kimai/kimai
- **Forum:** Discussions on GitHub
- **Chat:** Discussions and help

### Contributing
- **100+ contributors**
- **Open to pull requests**
- **Translation contributions** welcomed
- **Plugin development** encouraged
- **Documentation improvements**

### Support
- **Community Support:** Free via GitHub issues/discussions
- **Documentation:** Comprehensive guides
- **Professional Support:** Available for purchase
- **Kimai Cloud:** Managed service with support

---

## ⚖️ Licensing

**AGPL-3.0** (GNU Affero General Public License v3.0)

**Key Points:**
- Free for commercial and personal use
- Must share modifications if deployed publicly
- Network use triggers copyleft (AGPL vs GPL)
- Cannot use as proprietary SaaS without contributing back
- Plugins can be commercial (exception in license)

**Plugin Licensing:**
- Plugins can use different licenses
- Commercial plugins allowed
- Marketplace supports paid plugins

---

## 💡 Unique Selling Points

### Why Kimai?
1. **Professional Features** - Enterprise-grade time tracking
2. **Self-Hosted** - Full control of your data
3. **Free & Open Source** - No licensing costs
4. **Invoice Generation** - Built-in invoicing
5. **Multi-user** - Unlimited users (self-hosted)
6. **Active Development** - Regular updates
7. **Plugin Ecosystem** - Extensible via plugins
8. **API-First** - Comprehensive REST API
9. **Multi-language** - 30+ translations
10. **Proven Solution** - Used by thousands of businesses

### Compared to Competitors
**vs. Toggl Track:**
- Open source (Toggl is proprietary)
- Self-hosting option
- Unlimited users (self-hosted)
- Built-in invoicing
- One-time cost vs subscription

**vs. Harvest:**
- Free and open source
- Self-hosting
- No monthly fees
- Full customization

**vs. Clockify:**
- Open source
- Data privacy (self-hosted)
- More features (invoicing, budgets)
- Plugin ecosystem

**vs. TimeCamp:**
- Self-hosted option
- Open source
- Better for EU businesses (GDPR)

---

## 📈 Statistics

- **GitHub Stars:** 3,500+
- **Contributors:** 100+
- **Commits:** 5,000+
- **Releases:** 100+ versions
- **Languages:** PHP (91%), JavaScript (5%), Twig (3%)
- **Active Installations:** Thousands worldwide
- **Plugin Marketplace:** 20+ plugins

---

## 🎓 Learning Resources

### Official Documentation
- **Website:** https://www.kimai.org
- **Docs:** https://www.kimai.org/documentation/
- **API:** https://www.kimai.org/documentation/rest-api.html
- **GitHub:** https://github.com/kimai/kimai

### Installation Guides
- Installation guide
- Docker setup
- Shared hosting guide
- Update guide
- Migration guide

---

## 🚧 Development Setup

### Local Development
```bash
# Clone repository
git clone https://github.com/kimai/kimai.git
cd kimai

# Install PHP dependencies
composer install

# Install JavaScript dependencies
yarn install

# Configure database
cp .env.dist .env
# Edit .env with your database credentials

# Create database
bin/console doctrine:database:create
bin/console doctrine:migrations:migrate

# Install assets
bin/console assets:install

# Build frontend
yarn build

# Create admin user
bin/console kimai:user:create admin admin@example.com ROLE_SUPER_ADMIN

# Start development server
symfony server:start
# Or use PHP built-in server
php -S localhost:8000 -t public
```

### Running Tests
```bash
# PHPUnit tests
vendor/bin/phpunit

# PHPStan static analysis
vendor/bin/phpstan analyse

# Code style check
vendor/bin/php-cs-fixer fix --dry-run
```

---

## 📊 Roadmap

### Recent Features (2024-2025)
- Symfony 6.4 LTS upgrade
- PHP 8.3 support
- Improved API documentation
- Better mobile responsiveness
- Performance optimizations

### Upcoming Features
- GraphQL API (planned)
- Better calendar integration
- Enhanced mobile apps
- More invoice templates
- AI-powered time tracking suggestions

---

**Last Updated:** 2025-01-17
**Source:** Official GitHub repository and documentation
**Analysis Version:** 1.0
