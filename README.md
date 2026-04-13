# ΣIGMA by NavTech

**Stay ahead of your semester.**

SIGMA is a student productivity platform that integrates with Canvas LMS to automatically surface assignments, deadlines, and grades — so students never miss what matters.

---

## Why SIGMA?

Students who work and study simultaneously don't have time to manually track deadlines across multiple courses. SIGMA connects directly to Canvas and does it for them.

**What makes SIGMA different:**
- Auto-syncs with Canvas LMS — no manual entry
- AI-powered syllabus parser — upload PDF, get structured data
- Grade predictions and What-If simulator
- Built BY a student who works full-time FOR students who work full-time

## Target Market

- Community college students in Florida (813,000+ students)
- Florida College System: 28 state colleges, all using Canvas LMS
- Starting with: FAU, Broward College, Miami Dade College, Palm Beach State

## Tech Stack

Vite · React · TypeScript · Supabase · Tailwind CSS · Vercel · Claude AI

## Status

🔨 **Phase 0: Foundation & Planning** — [See Master Plan](docs/MASTER-PLAN.md)

---

## Project Documents

| Document | Description |
|----------|-------------|
| [Master Plan](docs/MASTER-PLAN.md) | 19-week execution plan with weekly tasks and milestones |
| [Gap Analysis](docs/GAP-ANALYSIS.md) | Complete inventory of everything that needs to be built |
| [Session Log](docs/SESSION-LOG.md) | Every conversation, decision, and action documented |
| [ADR-001: Tech Stack](docs/architecture/ADR-001-tech-stack.md) | Why we chose Vite + Supabase + Vercel |
| [Market Research](docs/research/market/florida-community-colleges.md) | TAM/SAM/SOM analysis for Florida |
| [Weekly Updates](docs/weekly-updates/) | Progress reports every Saturday |

## Quick Start (Development)

```bash
# Clone
git clone https://github.com/niconv10/navtech-sigma.git
cd navtech-sigma

# Install
pnpm install

# Configure environment
cp .env.example .env.local
# Add your Supabase URL and key to .env.local

# Run
pnpm dev
# Open http://localhost:8080
```

## Project Structure

```
navtech-sigma/
├── src/
│   ├── components/    # UI components (dashboard, calendar, course, etc.)
│   ├── pages/         # App pages (Dashboard, Calendar, Courses, etc.)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Business logic (grade calc, risk assessment, etc.)
│   ├── integrations/  # Supabase client and types
│   ├── stores/        # Zustand state management
│   └── styles/        # CSS modules
├── supabase/
│   ├── functions/     # Edge Functions (syllabus parser, AI advisor)
│   └── migrations/    # Database schema
├── docs/              # All project documentation
├── design/            # Mockups, brand assets
└── CLAUDE.md          # Context file for Claude Code
```

---

Built with 💜 by [NavTech](https://navtech.dev) · Nicolas Navarro · FAU '27