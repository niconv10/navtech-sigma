# NavTech SIGMA — Master Execution Plan

> Deadline: August 25, 2026 (FAU Fall semester start)
> Timeline: 19 weeks from April 14, 2026
> Weekly commitment: ~11 hours/week

---

## Timeline Overview

```
April    ████░░░░░░░░░░░░░░░░  Phase 0: Foundation (2 weeks)
May      ░░░░████████░░░░░░░░  Phase 1: Core Functional (4 weeks)
June     ░░░░░░░░░░░░████████  Phase 2: Canvas + Polish (4 weeks)
July     ░░░░░░░░░░░░░░░░████  Phase 3: Beta (4 weeks)
August   ░░░░░░░░░░░░░░░░░░██  Phase 4: Launch (3.5 weeks)
```

---

## Phase 0 — Foundation (April 14-27)

**Goal:** Everything configured so you can BUILD without friction.
**Milestone:** App running with functional login and database connected.

### Week 1 (April 14-20) — Infrastructure & Organization

- [ ] Create 4 Claude Projects with system prompts (30 min)
- [ ] Create GitHub Projects board in repo (15 min)
- [ ] Run Supabase migrations (configure database schema) (1 hr) `CRITICAL`
- [ ] Make Auth work (signup/login) (1.5 hrs) `CRITICAL`
- [ ] Navigate entire app, document what works vs broken (1 hr) `CRITICAL`
- [ ] Buy domain navtech.dev or sigma-app.com (15 min)
- [ ] Install Claude Code CLI (10 min)

### Week 2 (April 21-27) — Auth + First Real Data

- [ ] Login/Signup functional end-to-end (2 hrs) `CRITICAL`
- [ ] Upload first real syllabus as test (1 hr) `CRITICAL`
- [ ] Dashboard shows real data from Supabase, not mock data (2 hrs)
- [ ] Register NavTech LLC on Sunbiz.org — $125 (30 min)
- [ ] Email FAU OIT about Canvas API Developer Key (20 min)
- [ ] Write Weekly Update #1 in docs/weekly-updates/2026-W17.md (15 min)

**Checkpoint:** Can a user signup, login, and see a dashboard? If yes → Phase 1.

---

## Phase 1 — Core Functional (May 1-31)

**Goal:** App works end-to-end: signup → upload syllabus → see deadlines.
**Milestone:** A student can use SIGMA to track their full semester.

### Week 3-4 (May 1-14) — Syllabus Parser + Course Management

- [ ] Syllabus parser works with 5+ real FAU syllabi (4 hrs) `CRITICAL`
- [ ] CRUD courses: create, edit, archive, delete (2 hrs) `CRITICAL`
- [ ] CRUD assignments: add, edit, mark complete, input grades (2 hrs) `CRITICAL`
- [ ] Collect 10 real syllabi from FAU for testing (1 hr)
- [ ] UX audit: how many clicks from signup to first deadline? Target: ≤ 3 (30 min)
- [ ] Weekly Updates #2 and #3

### Week 5-6 (May 15-31) — Calendar + Notifications + Grades

- [ ] Calendar view with real assignment deadlines, color-coded by course (3 hrs) `CRITICAL`
- [ ] Grade calculator with What-If simulator connected to real data (2 hrs)
- [ ] Email notifications for deadlines (24hrs before) via Resend (2 hrs)
- [ ] Responsive testing: iPhone SE, Android, iPad — document issues (1 hr)
- [ ] START SUMMER CLASSES — use SIGMA to track ISM 4212, PAD 4702, CJE 4668 (ongoing)
- [ ] Weekly Updates #4 and #5

**Checkpoint:** Can you use SIGMA for your own summer classes? If yes → Phase 2.

---

## Phase 2 — Canvas + Polish (June 1-30)

**Goal:** Canvas API connected + app polished for beta testers.
**Milestone:** SIGMA auto-syncs with Canvas LMS. Ready for beta.

### Week 7-8 (June 1-14) — Canvas API Integration

- [ ] Canvas API OAuth2 flow OR manual token fallback (4 hrs) `CRITICAL`
- [ ] Sync assignments from Canvas → SIGMA automatically (3 hrs) `CRITICAL`
- [ ] Auto-refresh grades from Canvas (every 30 min or manual) (2 hrs)
- [ ] Landing page updated with email waitlist capture (2 hrs)
- [ ] Weekly Updates #6 and #7

### Week 9-10 (June 15-30) — Polish & Beta Prep

- [ ] Bug fix sprint — resolve all accumulated issues (4 hrs)
- [ ] Onboarding flow: first-time user experience in < 3 min (3 hrs) `CRITICAL`
- [ ] Deploy to Vercel (production) with custom domain (1 hr) `CRITICAL`
- [ ] Performance audit: Lighthouse score > 80 all categories (1 hr)
- [ ] Create Instagram @sigma.app — bio, logo, 3 initial posts (30 min)
- [ ] Prepare beta invite email/message template (30 min)
- [ ] Weekly Updates #8 and #9

**Checkpoint:** Is the app deployed, polished, and stable? If yes → Phase 3.

---

## Phase 3 — Beta (July 1-31)

**Goal:** 50 real users using SIGMA. Real feedback. Fast iteration.
**Milestone:** 50 active beta users with NPS > 30. Product-market fit signal.

### Week 11-12 (July 1-14) — Launch Closed Beta

- [ ] Invite first 20 beta testers (FAU classmates, Broward College friends) (1 hr) `CRITICAL`
- [ ] In-app feedback widget: "Give Feedback" button (2 hrs) `CRITICAL`
- [ ] PostHog analytics setup: track signups, feature usage, drop-offs (1 hr)
- [ ] Daily bug check from reported feedback (15 min/day)
- [ ] 3 user interviews by video call (1.5 hrs)
- [ ] Weekly Updates #10 and #11

### Week 13-14 (July 15-31) — Iterate + Scale to 50

- [ ] Build top 3 features requested by beta users (6 hrs) `CRITICAL`
- [ ] Invite 30 more beta testers (total: 50) (1 hr)
- [ ] A/B test: Canvas connect vs manual upload onboarding (2 hrs)
- [ ] Stripe integration in TEST mode (2 hrs)
- [ ] NPS survey to all 50 beta users (30 min)
- [ ] Weekly Updates #12 and #13

**Checkpoint:** NPS > 30? Users coming back daily? If yes → Phase 4.

---

## Phase 4 — Launch Fall 2026 (August 1-25)

**Goal:** SIGMA available to ALL FAU students. Monetization active.
**Milestone:** App live. Stripe active. First paying users.

### Week 15-16 (August 1-14) — Pre-Launch Final

- [ ] Stripe LIVE — activate real payments (1 hr) `CRITICAL`
- [ ] Freemium gate: 2 courses free, unlimited = Pro $4.99/mo (2 hrs) `CRITICAL`
- [ ] Final bug sweep — zero critical bugs (3 hrs) `CRITICAL`
- [ ] Privacy Policy and Terms of Service finalized (2 hrs) `CRITICAL`
- [ ] Marketing materials: Canva flyers, QR codes, Instagram posts (2 hrs)
- [ ] Weekly Updates #14 and #15

### Week 17-18 (August 15-25) — 🚀 LAUNCH

- [ ] LAUNCH: App available publicly (1 hr) `CRITICAL`
- [ ] Campus marketing: flyers at FAU library, student union, breezeway (2 hrs)
- [ ] Monitor 24/7 first week — Sentry alerts, PostHog, email support (ongoing)
- [ ] Email/push to existing users: "Fall semester is here!" (30 min)
- [ ] Track first payments in Stripe Dashboard (ongoing)
- [ ] Weekly Update #16 — LAUNCH REPORT

**Checkpoint:** People are signing up and some are paying? 🎉 NavTech is real.

---

## Weekly Schedule — Summer 2026

| Day | Chase | SIGMA | Classes |
|-----|-------|-------|---------|
| Mon-Thu | 8am-5pm | 7-8pm (1hr) | Async |
| Friday | OFF | 9am-1pm (4hrs) | 1-3pm |
| Saturday | OFF | 9am-12pm (3hrs) | Catch-up |
| Sunday | OFF | REST | Assignments |

**Total: ~11 hrs/week on SIGMA**

---

## Non-Negotiable Rules

1. Maximum 11 hrs/week on SIGMA — health and GPA come first
2. Chase and classes ALWAYS have priority
3. Don't invest more than $100/mo until users are paying
4. If GPA drops below 3.5, SIGMA pauses until recovered
5. Sunday = rest. No SIGMA code on Sundays.

---

## Financial Projections

| Timeframe | MRR Target | Pro Users Needed | Realistic? |
|-----------|-----------|-----------------|------------|
| Launch (Aug) | $50 | 10 | ✅ Yes |
| Month 3 (Nov) | $500 | 100 | ✅ Likely |
| Month 6 (Feb 2027) | $2,500 | 500 | ✅ Possible |
| Month 12 (Aug 2027) | $5,000+ | 1,000+ | ✅ With expansion |

---

*This plan is a living document. Update it as priorities shift. The phases are gates — don't advance until the milestone is met.*
