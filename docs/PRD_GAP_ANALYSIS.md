# Treasure Coast AI - PRD Gap Analysis

**Generated:** 2026-01-22
**Status:** Ship-Grade Assessment

## Executive Summary

**Overall Alignment:** 75% Complete
**Critical Gaps:** 6 items
**Nice-to-Have Gaps:** 8 items
**Design Polish Needed:** Multiple pages

---

## SECTION 1: PRODUCT VISION & PROMISE ✅

**Status:** FULLY ALIGNED

- ✅ Truth Mode exists and prevents hallucinations
- ✅ Booking flow is deterministic (FSM-based)
- ✅ Lead capture working
- ✅ Analytics dashboard proves value
- ✅ Multi-tenant with RBAC

---

## SECTION 2: PERSONAS & USE CASES ✅

**Status:** SUPPORTED

- ✅ Prospect (public visitor) - marketing site + demo
- ✅ Agency Owner/Admin - full platform access
- ✅ Client - view-only mode with `allowClientEdits` flag
- ✅ Website Visitor - widget interaction

---

## SECTION 3: PLATFORM ARCHITECTURE ✅

**Status:** SOLID FOUNDATION

- ✅ Next.js App Router + TypeScript + Prisma + Clerk
- ✅ All core data models exist
- ✅ `getOrgContext()` pattern enforced
- ✅ RBAC at API layer
- ✅ Production auth bypass disabled

---

## SECTION 4: UNIVERSAL CORE vs TEMPLATES ⚠️

**Status:** MOSTLY ALIGNED

### ✅ Universal Core Complete:
- Organizations, bots, widget, domain allowlist
- Truth Mode engine
- Booking flow state machine
- Services/hours/contact/policies settings
- KB CRUD + publish flow
- Analytics + events
- Lead inbox
- Notifications

### ⚠️ Template Implementation - PARTIAL:
- ✅ Template registry exists (7 templates: Universal, Barber, Salon, Gym, Dentist, Sober Living, Epoxy)
- ✅ Templates seed starter KB content
- ✅ Tone profile hints (5 voices: professional, friendly, luxury, bold, chill)
- ✅ Goal hints (4 goals: bookings, leads, faqs, support)
- ❌ **GAP:** AI-generated drafts NOT implemented
- ❌ **GAP:** Review/approve flow for AI drafts missing
- ❌ **GAP:** FAQ suggestions not auto-generated
- ❌ **GAP:** "About" text not AI-generated

**Action Required:**
- Implement AI draft generation in onboarding wizard
- Add review/approve UI before publish
- Integrate LLM API (OpenAI/Anthropic) for content generation

---

## SECTION 5: PREMIUM UI/UX SPEC 🎨

**Status:** NEEDS DESIGN AUDIT

### Current State:
- ✅ Dark theme implemented
- ✅ TCA component system exists (Button, Card, Badge)
- ✅ Consistent spacing scale
- ✅ Typography hierarchy defined
- ⚠️ "Coastal Dusk Luxury" vibe - PARTIALLY APPLIED

### Design Gaps Identified:
1. **Marketing Site** - Needs premium polish
   - Hero section exists but may lack visual impact
   - Feature sections need consistency review
   - Testimonials section needs styling audit
   - CTA buttons need hover state review

2. **App Layout** - Good foundation, needs polish
   - ✅ Left sidebar navigation
   - ✅ Page headers with title + description
   - ⚠️ Max content width not consistently enforced
   - ⚠️ Card shadows/borders need consistency check

3. **Component Consistency** - Needs review
   - ⚠️ Button heights: verify 44px minimum
   - ⚠️ Input styling: verify consistent padding
   - ⚠️ Modal structure: verify header/footer consistency
   - ⚠️ Toast notifications: verify position and styling
   - ⚠️ Empty states: audit for helpfulness

4. **Microcopy** - Needs audit
   - Error messages: verify "what happened + how to fix" pattern
   - Empty states: verify explanations + CTAs
   - Success states: verify minimal noise

**Action Required:**
- Run comprehensive design audit
- Create unified CSS variable system
- Ensure all components use TCA system
- Verify accessibility (focus rings, contrast, keyboard nav)

---

## SECTION 6: TRUTH MODE SPEC ✅

**Status:** WELL IMPLEMENTED

### ✅ Allowed Sources Enforced:
- Published KB entries
- Organization services
- Organization hours
- Organization contact info
- Approved policies

### ✅ Disallowed Behavior Prevented:
- No invented prices/hours/services (sourced from DB only)
- No assumed policies
- Booking links only from `OrganizationService` table

### ✅ Response Algorithm:
- Intent/topic detection working
- Grounded data retrieval working
- Fallback responses working

### ⚠️ Minor Refinements Needed:
- Verify fallback text matches PRD tone exactly
- Ensure "I don't have that info yet" phrasing is consistent
- Test edge cases (empty services, missing hours)

**Action Required:**
- Add comprehensive Truth Mode test scenarios
- Audit fallback message tone

---

## SECTION 7: BOOKING FLOW SPEC ✅

**Status:** EXCELLENT IMPLEMENTATION

### ✅ State Machine Complete:
- IDLE → SERVICE_SELECTION → LEAD_NAME → LEAD_PHONE → LEAD_EMAIL → COMPLETE

### ✅ UI Directives Working:
- Service selection as buttons (not free-text)
- Lead capture prompts clear
- Confirmation screen with booking link

### ✅ Idempotency Enforced:
- Unique constraint: `[conversationId, serviceId]`
- No duplicate leads created

### ✅ Analytics Events Tracked:
- BOOKING_SERVICE_SELECTED
- BOOKING_LEAD_CREATED
- BOOKING_LINK_SHOWN
- BOOKING_LINK_CLICKED

**Action Required:** None (This is excellent)

---

## SECTION 8: ANALYTICS & DASHBOARD SPEC ⚠️

**Status:** GOOD FOUNDATION, NEEDS VERIFICATION

### Current Implementation:
- ✅ KPI row with leads, clicks, conversion rate
- ✅ Date range selector (7/30/90 days)
- ✅ Trends chart (daily leads + clicks)
- ✅ Funnel visualization
- ✅ Services breakdown table
- ✅ Top topics list
- ✅ Recent activity (24h)

### ⚠️ Verification Needed:
- **Metric Definitions:** Verify exact formulas match PRD
  - PRD: "COUNT(DISTINCT conversationId)"
  - Need to audit SQL queries in `/api/org/analytics/overview`
- **Funnel Conversion Rate:** Verify calculation
  - PRD: "booking clicks / leads created"
  - Current: "(linked_clicks / service_selected) * 100"
  - **MISMATCH DETECTED** - needs fix

### ❌ Missing Features:
- Revenue influenced calculation (if AOV exists) - partially implemented but not on dashboard

**Action Required:**
- Audit analytics queries for exact PRD compliance
- Fix conversion rate formula
- Add revenue influenced display

---

## SECTION 9: LEADS INBOX SPEC ✅

**Status:** WELL IMPLEMENTED

### ✅ List Page Complete:
- Stats cards (total, HOT, NEW, BOOKED)
- Filters (date range, status, temperature, service, search)
- Table columns (date, name, service, temperature, status, score)
- Pagination (cursor-based)
- Export (CSV)

### ✅ Detail Drawer Complete:
- Contact block (click-to-call, click-to-email)
- Service association
- Score + temperature + reasons
- Status quick actions
- Notes editor with save
- Captured answers display

**Action Required:** None (This is excellent)

---

## SECTION 10: SETTINGS SPEC ✅

**Status:** FULLY IMPLEMENTED

### ✅ Settings Hub Complete:
- Services editor (CRUD, reorder, validation)
- Hours editor (7-day grid, toggle, validation)
- Contact info editor (phone, email, address)
- Notifications (enable, recipients, triggers)
- Branding (white-label, logo, color, powered-by toggle)
- Custom domain (status, verification, instructions)

### ✅ RBAC Enforcement:
- `allowClientEdits` flag working
- Lock banner displayed when disabled
- Admin-only sections protected

**Action Required:** None (This is excellent)

---

## SECTION 11: AGENCY ONBOARDING WIZARD ❌

**Status:** CRITICAL GAP

### ✅ Wizard Form Exists:
- Template selection (7 options)
- Business details input
- Brand voice selection
- Primary goal selection

### ❌ AI Draft Generation MISSING:
- **CRITICAL:** AI does not generate drafts
- **CRITICAL:** No review/approve UI
- **CRITICAL:** No "About" text generation
- **CRITICAL:** No FAQ auto-generation
- **CRITICAL:** KB entries not AI-drafted

### Current Behavior:
- Wizard creates bot with basic config
- Template KB content is copied as-is (static placeholders)
- No LLM integration visible

**Action Required:** HIGH PRIORITY
1. Integrate LLM API (OpenAI GPT-4 or Anthropic Claude)
2. Generate drafts from form data:
   - About text (2-3 paragraphs about business)
   - FAQs (5-10 common questions)
   - KB entries (expand on template content)
3. Build review UI:
   - Show AI drafts in editable form
   - "Approve + Publish" button
   - "Edit" button for manual changes
   - "Discard drafts" option
4. Implement publish workflow:
   - Drafts save to `BotKnowledgeSource` with `status: "DRAFT"`
   - Approval changes status to `status: "PUBLISHED"`
   - Only published content used by Truth Mode

---

## SECTION 12: WIDGET SPEC ✅

**Status:** EXCELLENT IMPLEMENTATION

### ✅ Widget Complete:
- Embed script snippet provided
- Domain allowlist enforced
- Fast loading (lazy load)
- Header shows brand name (white-label)
- Message bubbles clean
- Typing indicator
- Enter to send
- Booking flow integration
- Booking link tracking

**Action Required:** None (This is excellent)

---

## SECTION 13: MARKETING SITE SPEC ⚠️

**Status:** PAGES EXIST, NEEDS PREMIUM POLISH

### Current Pages:
- ✅ Home (hero, features, testimonials, stats)
- ✅ Pricing (3 tiers)
- ✅ Demo (live widget)
- ✅ Request Demo (form)
- ❌ **GAP:** Niche landing pages missing (no /barbers, /salons, /gyms, etc.)

### Design Quality:
- ⚠️ Hero section exists but needs visual impact audit
- ⚠️ Feature grid needs consistency check
- ⚠️ Testimonials section needs styling audit
- ⚠️ Social proof section exists but needs enhancement
- ⚠️ CTA buttons need hover state review

**Action Required:** MEDIUM PRIORITY
1. Run design audit on marketing pages
2. Create niche landing pages using template data
3. Enhance hero section visual impact
4. Add more social proof elements
5. Ensure CTAs are always visible on scroll

---

## SECTION 14: FREE VS PAID GATING ❌

**Status:** CRITICAL GAP

### Current State:
- ❌ **NO PLAN SYSTEM IMPLEMENTED**
- ❌ No conversation limits enforced
- ❌ No bot count limits
- ❌ No analytics window restrictions
- ❌ No white-label gating
- ❌ No "Upgrade" CTAs in UI

### PRD Requirements:
- Free: 1 org, 1 bot, 200 conversations/month, 7-day analytics, watermark ON
- Paid: Multiple bots, higher limits, 30/90-day analytics, white-label, custom domain

**Action Required:** HIGH PRIORITY
1. Add `Plan` enum to Prisma schema (FREE, STARTER, PRO, AGENCY)
2. Add `planId` to Organization table
3. Create plan feature matrix in code
4. Implement API-level gating for:
   - Bot creation (check count limit)
   - Conversation creation (check monthly limit)
   - Analytics queries (check date range limit)
   - White-label features (check plan allows)
5. Add UI-level "Upgrade" CTAs
6. Create upgrade flow (Stripe integration or manual)

---

## SECTION 15: QA MASTER PLAN ✅

**Status:** EXCELLENT FOUNDATION

### Test Coverage:
- ✅ 42 unit test files
- ✅ 14 E2E test suites
- ✅ Smoke tests cover critical paths
- ✅ Security tests verify tenant isolation
- ✅ Visual regression tests exist
- ✅ 626 unit tests passing

### Test Quality:
- ✅ Booking flow extensively tested
- ✅ Analytics scoring tested
- ✅ Auth/RBAC tested
- ✅ Validators tested
- ✅ Widget booking flow E2E tested

**Action Required:** ONGOING
- Continue adding tests as features ship
- Run full E2E suite before each deploy
- Maintain visual regression baselines

---

## SECTION 16: MANUAL TEST SCRIPT ⚠️

**Status:** SCRIPT PROVIDED, NEEDS EXECUTION

### PRD Provides:
- Comprehensive manual test runbook (16.1 - 16.10)
- Covers every page, every clickable, every form

**Action Required:** MEDIUM PRIORITY
- Execute manual test script end-to-end
- Document failures
- Create automated tests for manual failures
- Update test coverage matrix

---

## SECTION 17: AUTOMATED QA - PLAYWRIGHT ✅

**Status:** STRONG COVERAGE

### Current Coverage:
- ✅ Public routes tested
- ✅ App routes tested
- ✅ Widget tested
- ✅ Security tested
- ✅ Forms tested
- ✅ Navigation tested
- ✅ Visual regression tested

### Missing Coverage:
- ⚠️ Conversations page (marked "Coming Soon")
- ⚠️ Some admin pages (clients, insights)
- ⚠️ Error scenarios (chaos testing)

**Action Required:** LOW PRIORITY
- Add tests as new features ship

---

## SECTION 18: DESIGN REVIEW PROMPT 🎨

**Status:** READY TO EXECUTE

**Action Required:** HIGH PRIORITY
- Run comprehensive design audit using PRD prompt
- Create unified design token system
- Ensure premium "coastal dusk luxury" vibe
- Fix all visual inconsistencies

---

## SECTION 19: RUN ALL QUALITY GATES ⚠️

**Status:** READY TO EXECUTE

**Action Required:** IMMEDIATE
- Run full gate command:
  ```bash
  pnpm install
  pnpm prisma generate
  pnpm typecheck
  pnpm test
  pnpm test:e2e:smoke
  pnpm test:e2e:security
  pnpm test:e2e:visual
  pnpm build
  ```

---

## SECTION 20: DEFINITION OF DONE ⚠️

**Status:** 75% COMPLETE

### Product Readiness:
- ✅ Widget works flawlessly
- ✅ Truth Mode answers correctly
- ✅ Booking flow works deterministically
- ✅ Leads captured and visible
- ✅ Analytics show proof
- ⚠️ Marketing site needs premium polish
- ⚠️ Demo widget works but needs testing

### Operations Readiness:
- ⚠️ Agency can onboard fast BUT AI drafts missing
- ❌ Review/publish flow incomplete

### Security Readiness:
- ✅ Tenant isolation proven
- ✅ RBAC proven
- ✅ No dev bypass in production

### Quality Gates:
- ✅ Typecheck clean
- ✅ Unit tests pass
- ⚠️ E2E tests need full run
- ⚠️ Build needs verification

---

## PRIORITY MATRIX

### 🔴 CRITICAL (Ship Blockers)
1. **AI Draft Generation** - Core value prop missing
2. **Free vs Paid Gating** - Business model not implemented
3. **Analytics Formula Verification** - Must match PRD exactly
4. **Run Full Quality Gates** - Verify everything works

### 🟡 HIGH PRIORITY (Should Have)
1. **Design System Audit** - Premium polish needed
2. **Marketing Site Polish** - Conversion optimization
3. **Niche Landing Pages** - Lead generation channels

### 🟢 MEDIUM PRIORITY (Nice to Have)
1. **Manual Test Execution** - Quality assurance
2. **Revenue Influenced Display** - Analytics enhancement
3. **Truth Mode Tone Audit** - Message refinement

### ⚪ LOW PRIORITY (Future)
1. **Conversation History Page** - Marked "Coming Soon"
2. **Advanced Analytics** - Cohort analysis, custom metrics
3. **CRM Integrations** - Zapier/Make connectors

---

## IMPLEMENTATION ROADMAP

### Phase 1: Critical Gaps (Week 1)
1. Integrate LLM API for AI draft generation
2. Build review/approve UI for drafts
3. Implement plan-based feature gating
4. Fix analytics conversion rate formula
5. Run full quality gates

### Phase 2: Design & Polish (Week 2)
1. Run comprehensive design audit
2. Implement unified design tokens
3. Polish marketing site
4. Create niche landing pages
5. Audit all microcopy

### Phase 3: Testing & Launch (Week 3)
1. Execute manual test script
2. Add missing E2E tests
3. Run visual regression suite
4. Load testing
5. Production deployment

---

## SUCCESS CRITERIA

**Ready to Sell When:**
- [ ] AI generates drafts in onboarding wizard
- [ ] Review/approve workflow complete
- [ ] Free plan limits enforced
- [ ] Upgrade flow exists
- [ ] Marketing site looks premium
- [ ] All quality gates pass
- [ ] Manual test script 100% pass rate
- [ ] Visual regression baselines set
- [ ] Production deployment successful

---

**Next Steps:**
1. Review this gap analysis with team
2. Prioritize based on business needs
3. Begin Phase 1 implementation
4. Track progress in project board
