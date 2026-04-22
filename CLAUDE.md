# CLAUDE.md — navtech-sigma repo

Context file for Claude Code. Read before modifying anything in this repo.

## What this is

A working codebase for NavTech's AI-powered weekly briefing product for university students. Deployed at navtech-sigma.vercel.app. 14 commits, production-live. This is not a greenfield project — evolve existing code, don't reconstruct.

"SIGMA" is an internal working name only. The company is NavTech (navtech.dev). Do not use "SIGMA" in user-facing copy, marketing, or external communications.

## Product definition

NavTech's product is an AI-powered weekly briefing that analyzes a student's full semester (courses, syllabi with weight structures, historical grades, declared GPA goals) and each week delivers a personalized briefing containing:

- Retrospective analysis of the past week (what got done, what slipped)
- Preview of the coming week with prioritized focus
- Real-time GPA status per course and aggregate
- Recommendations on where to focus based on the student's goals
- Pattern identification (strengths, weaknesses, trends)

The magic moment is Sunday night. The student opens the app, reads for ~3 minutes, and starts Monday with clarity instead of anxiety. Every design and engineering decision should ladder up to making that Sunday experience excellent.

## What this product is not

- Not a reactive tracker like Canvas Student app
- Not a generic calendar or to-do list
- Not a context-less chatbot like raw ChatGPT
- Not a "productivity app" in any existing category — it's weekly intelligence, a new category

## Tech stack (actual, as running in production)

- Frontend: Vite + React 18 + TypeScript + Tailwind CSS
- State: Zustand (stores in src/stores/) + React Context (auth, theme)
- UI primitives: shadcn/ui on top of Radix (in src/components/ui/)
- Routing: react-router-dom v6
- Data fetching: Direct Supabase client calls via hooks (TanStack Query is installed and QueryClient is mounted in App.tsx but unused for data fetching — see TODO comment in App.tsx)
- Backend: Supabase (PostgreSQL, Auth with Google SSO, Edge Functions on Deno)
- AI: Anthropic API (Claude) called directly from Edge Functions, model claude-sonnet-4-6
- Hosting: Vercel (frontend), Supabase (backend/edge)
- Testing: Vitest with @testing-library/react
- Package manager: pnpm (remove bun.lockb and package-lock.json — they're stale)

If a doc anywhere else says "Next.js", it's wrong — this is Vite/React.

## Repo layout (what lives where)

```
src/
  App.tsx                  # Router, providers (Auth, Theme, QueryClient, Tooltip)
  main.tsx                 # Entry
  pages/                   # Route components — one per route
  components/
    ui/                    # shadcn primitives (many unused — safe to tree-shake)
    dashboard/             # Dashboard widgets (hero layout)
    course/                # Course detail widgets
    calendar/              # Calendar page widgets
    insights/              # Analytics/insights widgets
    goals/                 # Goals page (habits, focus timer, GPA goal)
    auth/                  # ProtectedRoute wrapper
    layout/                # MainLayout, Sidebar, MobileNav
  hooks/                   # useAuth, useCourses (data layer), useSemesters, useGoalsSync
  stores/                  # Zustand: useSemesterStore, useGoalsStore
  lib/                     # Pure logic — grade math, risk, prediction, AI digest, parsers
  integrations/supabase/   # Supabase client + generated types
  styles/                  # Feature-scoped CSS modules (mixed with Tailwind)
  test/                    # Vitest specs for lib/*
  types/                   # App-wide TypeScript types

supabase/
  migrations/              # SQL migrations (8 migrations, schema is stable)
  functions/
    parse-syllabus/        # PDF syllabus → structured data via Claude API
    ai-advisor/            # On-demand advisor (NOT the weekly briefing generator yet)
    send-email/            # Email delivery

tests/syllabi/             # Real FAU (7) + Broward (9) syllabus PDFs — valuable assets
docs/                      # MASTER-PLAN, GAP-ANALYSIS, SESSION-LOG (partially stale; see below)
design/brand/              # Logo assets
```

## Database schema — core tables

All tables have Row Level Security enabled and RLS policies enforcing auth.uid() = user_id.

**profiles** — extends auth.users. Fields: email, full_name, university, major, graduation_year, gpa_goal (default 3.5), has_completed_onboarding, signup_source, primary_challenge, notification_preferences (jsonb).

**semesters** — one user has many. Fields: name, type (fall/spring/summer/winter), year, is_active, emoji.

**courses** — rich JSONB columns for syllabus-parsed data: grading_categories, modules, policies, ai_policy, academic_integrity, important_dates, learning_objectives, support_resources, communication, final_exam, materials_data. Plus scalar: code, name, credits, color, institution, delivery_mode, section, crn.

**assignments** — belongs to course. Fields: name, type (exam/quiz/homework/project/paper/lab/discussion/participation/presentation/midterm/final/other), weight, due_date, description, score, archived. Archived flag preserves grade history when a syllabus re-upload removes an assignment that already has a grade entered — never delete graded assignments; archive them.

**user_goals** — single-row-per-user JSONB blobs: habits, completion_history, focus_sessions, total_focus_minutes, achievements, study_streak, last_study_date.

Triggers: handle_new_user auto-creates a profile on signup. update_updated_at_column keeps updated_at in sync on profiles and courses.

## Core business logic (in src/lib/)

**gradeUtils.ts** — source of truth for grade math. calculateCourseGrade, calculateGPA (supports custom grading scales per course), projectFinalGrade (what-if), calculateRequiredScore (solver for target grade). Respects archived. Don't reimplement grade math elsewhere — import from here.

**gradePrediction.ts** — three-scenario prediction (optimistic/most-likely/pessimistic) with confidence tiers based on % of weight already completed. Trend analysis (improving/stable/declining). Category performance analysis. Consume this from the weekly briefing rather than rebuilding prediction logic.

**riskAssessment.ts** — 5-factor risk scoring per course → riskScore 0-100 and riskLevel critical/high/medium/low. Exports calculateAllCourseRisks(courses) which sorts by priority. Feeds Dashboard's NeedsAttentionCard and weekly digest.

**aiAdvisor.ts** — client-side helper for AI features. Contains generateWeeklyDigest() (heuristic-only today, see "Known misalignments" below) and generateAIInsights(). Defines the canonical WeeklyDigest interface.

**syllabusUpdater.ts** — reconciles a re-uploaded syllabus against existing course data, archiving removed graded assignments.

**icsParser.ts** — parses .ics calendar files for manual import flow.

## Edge Functions (supabase/functions/)

**parse-syllabus/** — the crown jewel. Accepts a PDF (base64) or plain text, sends it to Anthropic's API with a detailed extraction prompt (~700 lines of rules for handling point-based grading, grouped assignments, policies, AI policy, extra credit, minimum requirements, confidence scoring, parsing warnings). Returns structured data that populates the rich JSONB columns of courses and creates assignments rows. JWT auth required.

**ai-advisor/** — on-demand academic advisor. Returns assessment + priorities + studyStrategies + timeManagement + motivation. This is not yet the weekly briefing generator — see "Evolution plan" below.

**send-email/** — transactional email delivery.

All edge functions authenticate the caller via Supabase JWT (Authorization: Bearer …) before calling external APIs. Preserve this pattern in any new function.

## Current decisions that shape engineering work

- **Canvas API is nice-to-have, not must-have.** Design features assuming manual syllabus upload + manual grade entry as the primary flow. Canvas auto-sync is a future enhancement, not a foundation. Do not architect anything that breaks if Canvas is unavailable.
- **Evolve existing code, don't reconstruct.** ~60% of current code is useful as-is (schema, auth, grade/risk/prediction math, syllabus parser, data layer). ~40% is the AI+UX layer that needs rework for the weekly briefing vision.
- **Sunday-night ritual is the design north star.** When in doubt about a feature, ask: does this make Sunday-night clarity better?

## Evolution plan — what to build next

The immediate engineering priority is replacing the heuristic weekly digest with a real AI-generated weekly briefing, elevated to the Dashboard hero. Sequence:

### Phase 1 — Briefing foundation (~12-18h)

1. Add migration weekly_briefings table (user_id, week_start, week_end, content jsonb, generated_at, read_at, RLS by user_id).
2. Create new Edge Function weekly-briefing (separate from ai-advisor) that takes courses snapshot + current/target GPA + time window + prior briefings history, returns retrospective narrative, preview narrative, projected GPA analysis, focus recommendations, pattern identification.
3. Add helper calculateProjectedGPA(courses) in gradeUtils.ts composing calculateGPA + predictFinalGrade().mostLikely.grade for ungraded courses.
4. Rework generateWeeklyDigest() in src/lib/aiAdvisor.ts to call the new edge function. Keep the WeeklyDigest interface as a contract — extend it, don't replace it. Preserve heuristic fallback for offline/error states.

### Phase 2 — Dashboard as briefing hero (~8-12h)

5. New WeeklyBriefingCard component in src/components/dashboard/ rendering retrospective + preview + CTA to full view.
6. Reorder Dashboard.tsx: briefing card becomes hero, GPAChartWidget demotes to secondary widget, the rest of the layout stays.

### Phase 3 — Messaging alignment (blocked on Growth agent)

7. src/pages/Landing.tsx copy rework to remove Canvas-as-feature messaging (see below).
8. Decide fate of src/pages/AIAdvisor.tsx — either delete the WeeklyDigestTab (redundant once Dashboard owns it) or rename the route to /briefing as the expanded view.

### Phase 4 — Tech debt cleanup (anytime) — see "Tech debt" section.

## Known misalignments (don't be confused by these)

- **src/pages/Landing.tsx** still promises Canvas auto-sync (lines ~70, 378, 553, 696). This contradicts the current product direction. Do not expand on Canvas features in the Landing. Copy rework is owned by the Growth and Marketing agent, not Engineering — when touched, it should be part of a coordinated change.
- **src/pages/AIAdvisor.tsx** contains a WeeklyDigestTab rendering the heuristic digest. It's hidden behind /advisor. This will be replaced/relocated in Phase 2.
- **docs/MASTER-PLAN.md, docs/GAP-ANALYSIS.md, docs/SESSION-LOG.md, docs/architecture/ADR-001-tech-stack.md, docs/research/market/florida-community-colleges.md, docs/weekly-updates/** — pre-pivot documents. Some details are still valid, but treat as historical. Current strategic truth lives in NavTech's Drive (01-Strategy/Decision-Log.doc), not in docs/. If a doc in docs/ contradicts this CLAUDE.md, this file wins.
- **README.md** — also pre-pivot. Describes the product as a Canvas-synced productivity tracker. Update it when Phase 3 happens; don't use it as source of truth.

## Tech debt (low priority, clean when convenient)

- `.gitinore` (typo) exists alongside `.gitignore` — delete the typo'd file.
- `supabase/.temp/` is committed — add to .gitignore and `git rm -r --cached supabase/.temp/`.
- `package.json` has `"name": "vite_react_shadcn_ts"` — rename to `navtech-sigma`.
- `lovable-tagger` in devDependencies — this repo was originally bootstrapped with Lovable; remove the dep.
- `bun.lockb` and `package-lock.json` coexist with `pnpm-lock.yaml` — keep only pnpm-lock.yaml.
- TODO: migrate data layer to TanStack Query in App.tsx — QueryClient is mounted but data is still fetched ad-hoc via hooks. Migration is a larger effort; don't do piecemeal.
- `src/components/ui/*` has ~80 shadcn primitives, many unused — tree-shaking pass when bundle size becomes a concern.
- `src/lib/riskAssessment.ts` and `src/lib/gradePrediction.ts` group by assignment.type but courses.grading_categories (jsonb) from the syllabus parser has richer category data — predictions could be more accurate using the structured categories. Not blocking.

## Conventions to preserve

- **Grade math:** always use functions from src/lib/gradeUtils.ts. Never duplicate grade logic.
- **Archived assignments:** always filter with `a.archived !== true` (or `!a.archived`) in calculations. Never hard-delete graded assignments.
- **User-scoped state:** any new Zustand store must hook into the cross-account state clearing in useAuth.tsx (see clearUserScopedClientState). Data leaks across logins otherwise.
- **RLS:** every new table needs ENABLE ROW LEVEL SECURITY plus granular per-operation policies (SELECT/INSERT/UPDATE/DELETE). See migration 20260207015821 as the template.
- **Edge functions:** always verify JWT via supabase.auth.getUser() before any external API call. Never trust client-supplied user_id.
- **No secrets in client code.** ANTHROPIC_API_KEY lives in Supabase edge function env only.

## What this repo is NOT responsible for

- Market research, pricing strategy, beachhead selection — that's the Strategy and Product agent.
- Landing copy, messaging, go-to-market — that's the Growth and Marketing agent.
- Legal, FERPA, LLC, vendor approval processes — that's the Business Operations agent.
- Project management, file organization in Drive — that's the Daily Operations agent.

If a request spans domains, flag and route rather than absorbing the work.

## Staying current

This file reflects the state of the repo and product direction as of 2026-04-21 (post-pivot session). If the product definition, stack, phase, or core decisions change, update this file in the same commit that makes the change. Stale CLAUDE.md is worse than no CLAUDE.md.
