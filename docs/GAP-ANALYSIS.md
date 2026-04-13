# NavTech SIGMA — Gap Analysis

> Last updated: April 13, 2026
> Status: Pre-development — documenting everything before building

---

## Summary

| Category | Total | Blockers | Status |
|----------|-------|----------|--------|
| Technical / Engineering | 13 | 4 | 🔴 Not started |
| Security & Compliance | 8 | 2 | 🔴 Not started |
| Legal & Business | 7 | 3 | 🔴 Not started |
| Product & UX | 7 | 1 | 🔴 Not started |
| Marketing & Growth | 6 | 0 | 🟡 Partial |
| Operations & Processes | 6 | 0 | 🔴 Not started |
| **TOTAL** | **47** | **10** | |

---

## 🔴 BLOCKERS — Must resolve before launch

- [ ] Supabase schema (run migrations)
- [ ] Auth functional (signup → login → session)
- [ ] Syllabus parser tested with real syllabi
- [ ] Canvas API integration (OAuth2 or manual token)
- [ ] FERPA compliance implemented
- [ ] Row Level Security on ALL tables
- [ ] NavTech LLC registered in Florida
- [ ] Privacy Policy (real, not placeholder)
- [ ] Terms of Service (real, not placeholder)
- [ ] Full app audit (what works vs what's placeholder)

---

## ⚙️ Technical / Engineering

### Phase 0 (This week)
- [ ] **Supabase schema** — Run existing migrations in /supabase/migrations/ on new Supabase project. Without tables, nothing works. `BLOCKER`
- [ ] **Auth functional** — Signup → confirm email → login → see dashboard. If this doesn't work, nothing else matters. `BLOCKER`
- [ ] **CI/CD pipeline** — GitHub Actions: lint + test on PR, auto-deploy to Vercel on merge to main. 1 hour setup.

### Phase 1 (May)
- [ ] **Syllabus parser tested** — Test with 5+ real FAU syllabi. Must extract: course name, professor, assignments, weights, dates, policies. `BLOCKER`
- [ ] **Tests running** — vitest files exist in /src/test/. Make them run in CI. Prevents breaking existing features.
- [ ] **Responsive design verified** — Test on iPhone SE, Android, iPad. Community college students use phones for everything.
- [ ] **Email notifications** — Supabase Edge Function + Resend. Email 24hrs before each deadline.

### Phase 2 (June)
- [ ] **Canvas API integration** — OAuth2 flow if FAU OIT approves, manual token fallback. THE moat of SIGMA. `BLOCKER`
- [ ] **Error monitoring** — Sentry free tier. Know about errors before users report them.
- [ ] **Rate limiting** — Prevent API abuse. Upstash Redis or Vercel built-in.
- [ ] **Environment management** — Dev (localhost), Staging (Vercel preview), Prod (Vercel main).
- [ ] **PWA configuration** — Installable on home screen without app store. Service worker for basic offline.

### Phase 3 (July)
- [ ] **Data backup strategy** — Upgrade to Supabase Pro ($25/mo) for daily backups when we have users.

---

## 🔒 Security & Compliance

### Phase 0
- [ ] **Row Level Security (RLS)** — Verify EVERY table has RLS enabled with user_id policies. One user must NEVER see another's data. `BLOCKER`

### Phase 1
- [ ] **FERPA compliance** — Explicit consent at signup, encrypted grades in DB, right to delete, Privacy Policy mentions FERPA. `BLOCKER`
- [ ] **Dependency scanning** — Enable GitHub Dependabot alerts. 15 min setup. Repo → Settings → Security → Enable.

### Phase 2
- [ ] **Canvas tokens encrypted in DB** — If database is compromised, Canvas tokens must still be safe. Use pgcrypto or app-level encryption.
- [ ] **HTTPS verification** — Vercel handles SSL automatically. Verify no mixed content (HTTP requests in code).
- [ ] **Input sanitization** — Audit all user inputs for XSS/injection vulnerabilities. Supabase parameterizes queries automatically.
- [ ] **Data deletion button** — "Delete my account" that removes ALL user data. FERPA/GDPR requirement.

### Phase 3
- [ ] **Accessibility (ADA/Section 508)** — Screen readers, color contrast WCAG AA, keyboard navigation, ARIA labels. Required for university adoption. Use axe DevTools for audit.

---

## ⚖️ Legal & Business

### Phase 0
- [ ] **NavTech LLC** — Register on Sunbiz.org. $125 + 30 min. Protects personal assets from business liability. `BLOCKER`
- [ ] **Business bank account** — Chase Business Complete. Separate personal from business money.
- [ ] **Domain** — navtech.dev or sigma-app.com. ~$12/year. Professional email: founders@navtech.dev

### Phase 1
- [ ] **Privacy Policy REAL** — Must mention: data collected, how it's used, FERPA, third parties (Supabase, Stripe, Claude API), right to delete. `BLOCKER`
- [ ] **Terms of Service REAL** — Stripe requires clear ToS. Protects NavTech if app shows incorrect grade. `BLOCKER`
- [ ] **Disclaimer of liability** — DisclaimerBanner.tsx exists in components — verify it has real content.
- [ ] **Trademark search** — Search USPTO TESS (tmsearch.uspto.gov) for "SIGMA" in EdTech. If taken, we need a new name BEFORE launch.

### Phase 3
- [ ] **Stripe account** — Requires LLC + EIN/SSN. Set up in test mode early, go live in Phase 4.

---

## ✦ Product & UX

### Phase 0
- [ ] **Full app audit** — Navigate every page. Document what works vs what's placeholder. This determines our real starting point. `BLOCKER`

### Phase 1
- [ ] **Onboarding flow** — Signup → value in under 3 minutes. If a student takes longer to see their first deadline, we lose them.
- [ ] **Empty states designed** — When new user opens dashboard with no courses, what do they see? Must be a clear CTA, not blank screen.

### Phase 2
- [ ] **Error messages human** — "Couldn't connect to Canvas. Are you on FAU's network?" not "Error 403". Apple quality.

### Phase 3
- [ ] **Bilingual support (EN/ES)** — 28% of MDC is Hispanic/Latino. Our natural advantage as bilingual founder. No competitor offers this.
- [ ] **Feature flag system** — Clean way to limit features for free vs pro users.
- [ ] **User feedback widget** — "Give Feedback" button visible throughout app. Saves to Supabase.

---

## 📈 Marketing & Growth

### Phase 0
- [ ] **Reserve Instagram handle** — @sigma.app or similar. $0, 5 minutes. Don't lose it.

### Phase 1
- [ ] **Brand guidelines** — Document colors, fonts, logo usage, tone of voice. Palette already defined (Teal #14B8A6 primary).

### Phase 2
- [ ] **Landing page email capture** — Landing exists and looks professional. Add email form connected to Resend/Mailchimp.
- [ ] **SEO basics** — Meta tags, Open Graph images, sitemap. Show up when someone searches "Canvas grade tracker."

### Phase 3
- [ ] **Comparison page** — SIGMA vs Notion vs Google Calendar. Visual answer to "why not use Notion?"

### Phase 4
- [ ] **Campus marketing** — Flyers with QR codes for FAU library, student union, breezeway.

---

## 🔄 Operations & Processes

### Phase 0
- [ ] **Claude Projects configured** — 4 projects: SIGMA-Engineering, SIGMA-Product, SIGMA-Marketing, SIGMA-Finance. System prompts documented in docs/claude-projects.md
- [ ] **GitHub Projects board** — Kanban board: Backlog → In Progress → Review → Done. All tasks from all departments live here.
- [ ] **Claude Code CLI installed** — `npm install -g @anthropic-ai/claude-code`. Your CTO virtual.
- [ ] **Weekly update cadence** — Every Saturday. Template in docs/weekly-updates/template.md

### Phase 3
- [ ] **Incident response plan** — What to do when the app goes down at 2am. Documented checklist.
- [ ] **Accounting setup** — Wave Accounting. Track every dollar in and out of NavTech from day 1.

---

## Notes

- Items marked `BLOCKER` must be resolved before public launch
- Phase numbers correspond to the Master Execution Plan (see MASTER-PLAN.md)
- Check items off directly in GitHub as you complete them
- This document is the source of truth — update it, don't create new lists
