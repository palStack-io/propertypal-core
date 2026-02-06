# propertyPal

![propertyPal](propertyPal.png)

**Your Complete Property Management Solution**

[Try Demo →](https://propertypal.palstack.io) | [Documentation](https://propertypal.palstack.io/docs) | [More Tools](https://palstack.io)

> Open source, privacy-first property management from palStack

[![Status](https://img.shields.io/badge/status-beta-yellow)](https://github.com/palStack-io/propertypal-core)
[![Platform](https://img.shields.io/badge/platform-self--hosted-blue)](https://github.com/palStack-io/propertypal-core)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green)](LICENSE)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-ready-41BDF5)](https://www.home-assistant.io/)
[![GHCR](https://img.shields.io/badge/GHCR-packages-blue)](https://github.com/orgs/palStack-io/packages)
[![Docs](https://img.shields.io/badge/docs-palstack.io-orange)](https://propertypal.palstack.io/docs)

**Part of [palStack](https://palstack.io) - Privacy-first tools for everyday life**

---

## The Story Behind propertyPal

We're palStack—a small team building privacy-first tools for everyday life. propertyPal grew out of our own frustrations with homeownership.

**The problem was simple and annoying:** keeping track of everything that comes with owning a home. When was the furnace last serviced? Where's the warranty for the dishwasher? How much did we spend on repairs last year? Is the roof inspection due?

*"Can't you just... build something?"*

So we did.

What started as a solution for tracking one home's maintenance quickly expanded. Friends saw it working and wanted in. They had the same problems—lost warranty documents, forgotten maintenance schedules, no idea where money was going.

### The Home Automation Touch

We integrated with Home Assistant for smart automations. Get reminders when it's time to change air filters. Track energy usage. Automate seasonal maintenance checklists. Our friends loved these features and started building their own automations.

### Learning as We Go

Here's the honest truth: none of us came from software engineering backgrounds. We're learning this stuff as we build it—backend design, microservices, mobile apps, Docker networking. Some days it's Flask patterns. Other days it's debugging why containers won't talk to each other at 2 AM.

We use AI coding assistants heavily. Not to write the code for us, but to help us understand *why* things work the way they do. It's like having a patient teacher who doesn't judge when you ask the same question three different ways.

Is propertyPal over-engineered for what it does? Probably. Does it work? Absolutely. Are we still figuring things out? Every single day.

### Why Open Source?

As more friends adopted propertyPal, we kept refining it—better document management, smoother expense tracking, easier self-hosting. Eventually we realized: why keep this just for people we know?

We founded palStack to share these tools with anyone who wants them. propertyPal is part of our production-ready Pals, built on a simple idea: **everyday problems deserve privacy-first, self-hosted solutions that actually work.**

---

## The palStack Family

**Production Ready:**
- **[pantryPal](https://github.com/palStack-io/pantrypal-core)** - Never buy duplicate groceries again

**Final Testing Stage:**
- **[finPal](https://github.com/palStack-io/finpal-core)** - Personal finance tracking with privacy-first design

**In Active Development:**
- **propertyPal** - You're here! Track home maintenance, warranties, documents
- **carPal** - Vehicle maintenance tracking (coming soon)
- **petPal** - Pet health and care management (coming soon)
- **clubPal** - Group coordination for dining, activities, and social clubs

Learn more at [palstack.io](https://palstack.io)

> **Why "Pal"?** Because that's what these tools are—friendly helpers for the everyday stuff we all struggle with.

---

## 🚀 Hosting Options

### Self-Host (Available Now)
Deploy propertyPal on your own infrastructure with our one-command setup. Full features, complete control, free forever.

### Managed Hosting (Coming Soon!)
Don't want to manage servers? We're launching a managed hosting service where we handle everything:

- ✅ Automatic updates and backups
- ✅ 99.9% uptime guarantee
- ✅ Professional support
- ✅ Same features as self-hosted
- ✅ Subscription-based pricing

**Stay updated:** [palstack.io](https://palstack.io) | **Email:** palstack4u@gmail.com

---

## What propertyPal Does

**The Core Problem:** *"When was the furnace last serviced? Where's that warranty? How much did we spend on the house this year?"*

**The Solution:**

- 📄 **Document Storage** - Store warranties, contracts, insurance documents securely
- 🔧 **Maintenance Tracking** - Never miss a service date with seasonal checklists
- 💰 **Expense Management** - Track every dollar spent on your property
- 📊 **Budget Planning** - Set budgets and monitor spending by category
- 🏠 **Appliance Registry** - Track warranties, manuals, and service history
- 📋 **Project Management** - Plan and track home improvement projects
- 📈 **Reports & Analytics** - Visualize spending and maintenance history
- 🏡 **Home Assistant Ready** - Integrate with your smart home

**Built by people who actually use it daily.**

---

## Key Features

### For Everyday Use

| Feature | Description |
|---------|-------------|
| **Document Management** | Upload and organize warranties, contracts, insurance, legal docs |
| **Maintenance Tracking** | Seasonal checklists with customizable reminders |
| **Expense Tracking** | Log expenses by category with receipt attachments |
| **Budget Management** | Set monthly/yearly budgets, track spending vs. budget |
| **Appliance Registry** | Track make, model, warranty dates, service history |
| **Project Tracking** | Manage home improvement projects from start to finish |
| **Photo Gallery** | Store property photos organized by date |
| **Financial Reports** | Generate expense reports, budget summaries |
| **Multi-Property Support** | Manage multiple properties from one account |
| **Dark Mode** | Beautiful dark theme interface |

### For Home Assistant Fans

| Feature | Description |
|---------|-------------|
| **REST API** | Pull property data into Home Assistant |
| **Maintenance Alerts** | Trigger automations for upcoming maintenance |
| **Expense Tracking** | Log expenses via automations |
| **API Key Support** | Secure service-to-service authentication |
| **Self-Hosted** | No cloud dependencies, runs on your network |

### Privacy & Control

| Feature | Description |
|---------|-------------|
| **100% Self-Hosted** | Your data never leaves your network |
| **No Subscriptions** | Free and open source (AGPL-3.0) |
| **No Tracking** | No analytics, no telemetry, no phone-home |
| **Full Control** | Modify anything you want, it's your code |
| **Secure by Default** | JWT authentication, bcrypt passwords |

---

## System Requirements

**Minimum:**
- 1GB RAM
- 2GB disk space
- Docker & Docker Compose
- (Optional) Home Assistant instance

**Recommended:**
- 2GB RAM for better performance
- 5GB disk space (includes document storage)
- Home server, NAS, or VPS
- Reverse proxy with SSL (Nginx, Caddy, Traefik)

---

## Quick Start

### Deploy with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/palStack-io/propertypal-core.git
cd propertypal-core

# Copy environment file
cp .env.example .env

# Start propertyPal
docker-compose up -d

# Access at http://localhost
```

### Deploy with Pre-built Images (GHCR)

```bash
# Download docker-compose file for pre-built images
curl -O https://raw.githubusercontent.com/palStack-io/propertypal-core/main/docker-compose.ghcr.yml

# Copy environment file
curl -O https://raw.githubusercontent.com/palStack-io/propertypal-core/main/.env.example
cp .env.example .env

# Start propertyPal
docker-compose -f docker-compose.ghcr.yml up -d

# Access at http://localhost
```

### First Time Setup

1. Open http://localhost in your browser
2. Click **"Sign Up"** to create your account (first user becomes admin)
3. Complete the property setup wizard
4. Start tracking your home!

### Demo Mode

Want to try before you commit? Enable demo mode:

```bash
# Edit .env file
DEMO_MODE=true
```

Demo accounts will be auto-created:

| Email | Password |
|-------|----------|
| `demo@propertypal.com` | `Demo123!` |
| `demo2@propertypal.com` | `Demo123!` |
| `demo3@propertypal.com` | `Demo123!` |

---

## Architecture

Built with a clean, maintainable architecture:

```
nginx (reverse proxy)
├── backend (Flask/Python)    # REST API, authentication, business logic
├── frontend (React)          # Web dashboard interface
└── postgresql                # Data persistence
```

**Tech Stack:**
- **Backend:** Python 3.9+ / Flask 2.x / SQLAlchemy
- **Frontend:** React 18 / Tailwind CSS
- **Database:** PostgreSQL 14
- **Reverse Proxy:** Nginx
- **Authentication:** JWT tokens, bcrypt
- **Multi-arch:** AMD64 + ARM64 Docker images

---

## Configuration

### Environment Variables

Configure propertyPal via `.env` file:

#### Core Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_MODE` | `false` | Enable demo accounts |
| `SKIP_EMAIL_VERIFICATION` | `true` | Skip email verification (recommended for self-host) |
| `DEBUG` | `false` | Enable debug mode |

#### Database
| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `propertypal` | Database username |
| `POSTGRES_PASSWORD` | `propertypal` | Database password |
| `POSTGRES_DB` | `propertypal` | Database name |

#### Security
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | - | Flask secret key (change in production!) |
| `JWT_SECRET_KEY` | - | JWT signing key (change in production!) |

#### Email (Optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_SERVER` | - | SMTP server hostname |
| `MAIL_PORT` | `587` | SMTP server port |
| `MAIL_USERNAME` | - | SMTP username |
| `MAIL_PASSWORD` | - | SMTP password |

### Example Configuration

```bash
# .env file
DEMO_MODE=false
SKIP_EMAIL_VERIFICATION=true

# Database
POSTGRES_USER=propertypal
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=propertypal

# Security (CHANGE THESE!)
SECRET_KEY=your-random-secret-key-here
JWT_SECRET_KEY=your-random-jwt-key-here

# Optional: Email for password reset
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild after changes
docker-compose up -d --build

# Reset everything (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d --build
```

---

## Home Assistant Integration

### Quick Setup

Add this to your `configuration.yaml`:

```yaml
sensor:
  - platform: rest
    name: Property Maintenance Due
    resource: http://YOUR_SERVER_IP/api/maintenance/upcoming
    headers:
      Authorization: Bearer YOUR_API_TOKEN
    value_template: "{{ value_json | length }}"
    scan_interval: 3600
```

### Generate API Token

1. Log in to propertyPal web interface
2. Go to **Settings → API Keys**
3. Click **Generate New API Key**
4. Copy the key for Home Assistant configuration

### Example Automation

```yaml
automation:
  - alias: "Weekly Maintenance Reminder"
    trigger:
      - platform: time
        at: "09:00:00"
    condition:
      - condition: time
        weekday:
          - mon
    action:
      - service: notify.mobile_app
        data:
          title: "Property Maintenance"
          message: "{{ states('sensor.property_maintenance_due') }} items need attention"
```

---

## Troubleshooting

**Can't access the site?**
```bash
docker-compose logs nginx
docker-compose logs frontend
```

**Backend errors?**
```bash
docker-compose logs backend
```

**Database issues?**
```bash
docker-compose logs db
```

**Need a fresh start?**
```bash
docker-compose down -v
docker-compose up -d --build
```

---

## Roadmap

**Near Term:**
- [ ] Mobile app (React Native)
- [ ] Receipt scanning with OCR
- [ ] Recurring expense templates
- [ ] Enhanced reporting with charts

**Future:**
- [ ] carPal integration (vehicle maintenance)
- [ ] petPal integration (pet care tracking)
- [ ] Cross-Pal data sharing
- [ ] AI-powered maintenance predictions

**palStack Vision:** All our Pals will eventually work together seamlessly—imagine your property expenses syncing with finPal, or maintenance costs flowing into your budget automatically.

---

## Why Self-Hosted?

Because your property data is **your** personal data. You shouldn't need:

- A subscription to track your own home
- Permission from a cloud service to access your documents
- Internet connectivity to know when the furnace was last serviced

**Self-hosting means:**
- ✅ Complete privacy and control
- ✅ No recurring costs
- ✅ Works offline
- ✅ Integrate with anything
- ✅ Modify as needed

---

## Contributing

propertyPal is open source and welcomes contributions!

**How to Contribute:**
- **Bug reports** - Submit via [GitHub Issues](https://github.com/palStack-io/propertypal-core/issues)
- **Feature requests** - Open a discussion to propose new features
- **Pull requests** - Code contributions welcome

**Pull Request Requirements:**
- All PRs require approval from 2 palStack developers
- Review process typically takes 24-48 hours
- Include clear description of changes
- Ensure all tests pass
- Follow existing code patterns

By contributing, you agree that your contributions will be licensed under AGPL-3.0.

---

## License

### Dual Licensed: Open Source Core + Proprietary Premium

#### propertyPal Core (AGPL-3.0) - This Repository

The self-hosted version is free and open source under AGPL-3.0:

- ✅ **Free for personal use** - No cost, ever
- ✅ **Free for commercial use** - Use in your business
- ✅ **All core features included** - Nothing held back
- ✅ **Modify and distribute freely** - Fork it, customize it
- ⚠️ **Must share modifications** - AGPL copyleft requirement
- ⚠️ **Network use counts as distribution** - Must provide source to users

#### propertyPal Premium (Proprietary) - Managed Hosting Only

Our managed hosting service will include proprietary premium features:

- 🤖 **AI-powered document scanning** - Photo to organized docs
- 📊 **Advanced analytics** - Maintenance prediction, cost trends
- 🏠 **Smart maintenance scheduling** - AI-optimized service timing
- 📧 **Enhanced notifications** - Smarter reminders
- ⚡ **Priority support** - Direct access to the team

**Why Dual Licensing?**

We believe in both open source and sustainable business:
- **Self-hosters get:** Powerful property tools, free forever, full control
- **Managed subscribers get:** Extra convenience features + support our work
- **Everyone wins:** Premium revenue funds Core development

Full License: See [LICENSE](LICENSE) file for complete terms.

---

## Acknowledgments

- **Our friends** - For adopting propertyPal and providing invaluable feedback
- **The open source community** - For showing us that building in public creates better software
- **AI Coding Assistants** - For being patient teachers bridging the gap to software engineering
- **Home Assistant Community** - For building an incredible smart home platform
- **Docker** - For making deployment consistent and simple
- **Everyone who said "just use a spreadsheet"** - You motivated us to prove there's a better way

---

## About palStack

**Privacy-first tools for everyday life.** That's what pals do—they show up and help with the everyday stuff.

We're not building engagement platforms or harvesting data. We solve real problems we've experienced, then share the solution.

**Core Values:**
- **Your Data:** Zero telemetry, no tracking, privacy by design
- **Open Source:** AGPL-3.0, free forever, improvements benefit everyone
- **Human-Centered:** Plain English, accessible design, forgiving UX
- **AI-Assisted:** LLM-agnostic (Claude, ChatGPT, Qwen), all code human-reviewed
- **Dog-Fooded:** We use what we build daily

**Two Paths:**
- **Self-Host** - Free forever, full features, community support
- **Managed Hosting** - Coming soon! We handle infrastructure, you enjoy the app

We're building sustainable tools that help people, not chasing unicorns. If we can pay our bills doing it—and sleep well at night—that's success.

---

## The Team

- **Harun Gunasekaran** - Founder & Lead Developer
- **Chris Macioci** - Co-Founder & Lead DevOps
- **Rachel Surette** - Co-Founder, Marketing & Branding
- **Elle Russel Chopra** - Co-Founder, Lead UI/UX Designer
- **Chaitanya Gunupudi** - Senior Advisor, Cybersecurity & DevOps
- **AI Assistants** - LLM-agnostic: Claude, ChatGPT, Qwen (all code human-reviewed)

---

## Contact & Community

**Get in Touch:**
- 🌐 **Website:** [palstack.io](https://palstack.io)
- 📧 **Email:** palstack4u@gmail.com
- 💻 **GitHub:** [@palStack-io](https://github.com/palStack-io)
- 📦 **Containers:** [GitHub Packages](https://github.com/orgs/palStack-io/packages)
- 📚 **Docs:** [propertypal.palstack.io/docs](https://propertypal.palstack.io/docs)

**Join the Community:**

We're building a community of privacy-focused, self-hosting enthusiasts who believe everyday tools shouldn't compromise your data. Whether you're a developer, a user with ideas, or someone who just wants to manage their home better—you're welcome here.

**Ways to Get Involved:**
- 🏠 Use propertyPal and share your home management success stories
- 💻 Contribute code via pull requests on GitHub
- 🐛 Report bugs to help us improve
- 💡 Request features that solve real problems
- 📣 Spread the word about privacy-first alternatives

**Support the Project:**
- [GitHub Sponsors](https://github.com/sponsors/palStack-io)
- [Buy Me a Coffee](https://buymeacoffee.com/palstack)

**Learn More:**
- [Our Methodology](https://palstack.io/methodology) - How we build
- [The Team](https://palstack.io/team) - Who we are
- [All Projects](https://palstack.io/projects) - Explore the full palStack suite

---

> *"That's what pals do - they show up and help with the everyday stuff."*

**Built by the open source community, for the open source community.**

---

**Privacy-first • Family-focused • Home Assistant ready • AGPL-3.0**

Explore: [palstack.io](https://palstack.io)
