# DELIVERABLE 5: QA MASTER SCRIPT (Manual + Automated)

**Objective:** Test every inch of the platform before ship
**Coverage:** Every page, every button, every input, every state, every role

---

## PART A: MANUAL TEST SCRIPT

### A.1 PUBLIC PAGES (No Authentication)

#### Test 1.1: Landing Page (/)

**Steps:**
1. Navigate to `/`
2. Verify page loads without errors (check console)
3. Click logo → verify returns to `/`
4. Click "Pricing" link → verify navigates to `/pricing`
5. Click "Demo" link → verify navigates to `/demo`
6. Click "Sign In" link → verify navigates to `/sign-in`
7. Click primary CTA "Request Demo" → verify navigates to `/request-demo`
8. Scroll down → verify all sections load
9. Check testimonials → verify quotes display correctly
10. Check stats section → verify numbers visible
11. Check footer links → verify all navigate correctly
12. Test mobile responsive → resize to 375px width, verify layout adapts

**Expected:**
- [ ] No console errors (except acceptable ones: favicon 404, ResizeObserver)
- [ ] All navigation works
- [ ] All text readable (no overlapping, no cut-off)
- [ ] Images load
- [ ] CTAs prominent and clickable
- [ ] Mobile layout doesn't break

**Test Data:** N/A (public page)

---

#### Test 1.2: Pricing Page (/pricing)

**Steps:**
1. Navigate to `/pricing`
2. Verify 3 tiers display: Free, Starter, Pro (or current tier names)
3. Check each tier card:
   - Tier name visible
   - Price visible
   - Features list visible
   - CTA button visible
4. Click CTA on Free tier → verify navigates to sign-up or demo
5. Click CTA on Starter tier → verify navigates to sign-up
6. Click CTA on Pro tier → verify navigates to sign-up
7. Test mobile → verify cards stack vertically
8. Test hover states → verify hover effects work

**Expected:**
- [ ] All tiers visible
- [ ] Pricing clear
- [ ] Features list complete
- [ ] CTAs functional
- [ ] Mobile responsive

---

#### Test 1.3: Demo Page (/demo)

**Steps:**
1. Navigate to `/demo`
2. Verify demo widget loads
3. Type message "Hello" → send
4. Verify bot responds
5. Type "What are your hours?" → send
6. Verify bot responds with hours or "I don't have that info"
7. Type "I want to book" → send
8. Verify booking flow triggers (service selection or error message)
9. Close widget (if launcher present)
10. Reopen widget → verify previous messages persist (session)

**Expected:**
- [ ] Widget loads without errors
- [ ] Chat functional
- [ ] Bot responds correctly (Truth Mode)
- [ ] No hallucinated information
- [ ] Session persists on close/reopen

---

#### Test 1.4: Request Demo Page (/request-demo)

**Steps:**
1. Navigate to `/request-demo`
2. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Business Name: "Test Business"
   - Phone: "555-123-4567" (optional)
3. Submit form
4. Verify success message or redirect
5. Test validation:
   - Submit with empty name → expect error
   - Submit with invalid email → expect error
   - Submit with valid data → expect success

**Expected:**
- [ ] Form submits successfully
- [ ] Validation works
- [ ] Success feedback shown
- [ ] No console errors

---

#### Test 1.5: Sign In Page (/sign-in)

**Steps:**
1. Navigate to `/sign-in`
2. Verify Clerk sign-in UI loads
3. Test sign-in with valid credentials
4. Verify redirects to `/app` after sign-in
5. Test invalid credentials → verify error shown

**Expected:**
- [ ] Clerk UI loads
- [ ] Sign-in functional
- [ ] Redirects correctly
- [ ] Errors handled gracefully

---

### A.2 APP PAGES (Authenticated - OWNER Role)

**Prerequisite:** Sign in as AGENCY_OWNER

#### Test 2.1: Dashboard (/app)

**Steps:**
1. Navigate to `/app`
2. Verify KPI cards display:
   - Total Leads
   - Booking Clicks
   - Conversion Rate
   - Unique Conversations (or similar metrics)
3. Check each KPI has a number (may be 0 if no data)
4. Verify "Setup Status" card shows progress (if exists)
5. Check any charts/graphs load correctly
6. Click "View All Leads" (if button exists) → verify navigates to `/app/leads`

**Expected:**
- [ ] Dashboard loads
- [ ] KPIs visible
- [ ] No errors
- [ ] Navigation functional

---

#### Test 2.2: Leads Page (/app/leads)

**Steps:**
1. Navigate to `/app/leads`
2. If no leads: verify empty state displays with helpful message
3. If leads exist:
   - Verify table displays with columns: Date, Name, Service, Temperature, Status, Score
   - Click a lead row → verify detail drawer opens
   - In drawer:
     - Verify contact info visible (phone, email)
     - Verify click-to-call link works (opens phone app or copies)
     - Verify click-to-email link works (opens email client)
     - Change status from NEW → CONTACTED → verify saves
     - Add note "Test note" → save → verify persists
     - Close drawer → reopen same lead → verify note still there
4. Test filters:
   - Filter by status: NEW → verify only NEW leads show
   - Filter by temperature: HOT → verify only HOT leads show
   - Search by name → type partial name → verify filters
   - Clear filters → verify all leads return
5. Test pagination (if > 20 leads):
   - Click next page → verify loads page 2
   - Click previous → verify returns to page 1
6. Test export:
   - Click "Export CSV" button
   - Verify CSV downloads
   - Open CSV → verify data correct

**Expected:**
- [ ] Leads list functional
- [ ] Detail drawer works
- [ ] Status updates save
- [ ] Notes persist
- [ ] Filters work
- [ ] Pagination works
- [ ] Export works

**Test Data:** Create at least 3 test leads via widget before running this test.

---

#### Test 2.3: Analytics Page (/app/analytics)

**Steps:**
1. Navigate to `/app/analytics`
2. Verify page loads
3. Check KPI row:
   - Leads created count
   - Booking clicks count
   - Conversion rate percentage
4. Check date range selector:
   - Select "7 days" → verify metrics update
   - Select "30 days" → verify metrics update
   - Select "90 days" → verify metrics update
5. Check funnel visualization:
   - Verify shows: Service Selected → Lead Created → Link Shown → Link Clicked
   - Verify counts for each step
   - Verify conversion percentages
6. Check service breakdown table:
   - Verify lists services with lead count and click count
7. Check top topics section:
   - Verify lists topics detected in conversations
8. Check trends chart (if exists):
   - Verify daily leads bar chart
   - Verify daily clicks overlay

**Expected:**
- [ ] Analytics load
- [ ] Metrics accurate (verify against database if possible)
- [ ] Date range filters work
- [ ] Funnel display correct
- [ ] Service breakdown accurate

**Test Data:** Generate test analytics events via widget (complete booking flows).

---

#### Test 2.4: Bots Page (/app/bots)

**Steps:**
1. Navigate to `/app/bots`
2. If no bots: verify empty state
3. If bots exist:
   - Verify list displays bot names, status, created date
   - Click "Create Bot" button → verify navigates to onboarding or creation form
   - Click a bot row → verify navigates to bot detail page `/app/bots/[key]`
4. On bot detail page:
   - Verify bot name displays
   - Verify greeting text displays
   - Check tabs: Overview, Knowledge, Settings (or similar)
   - Click "Knowledge" tab → verify navigates to KB page for this bot
   - Click "Edit" button → verify can update bot name/greeting
   - Save changes → verify persists

**Expected:**
- [ ] Bots list functional
- [ ] Create bot works
- [ ] Bot detail loads
- [ ] Edit bot works
- [ ] Changes persist

---

#### Test 2.5: Knowledge Base Page (/app/kb)

**Steps:**
1. Navigate to `/app/kb`
2. If no KB entries: verify empty state
3. Click "Add Knowledge Source" button
4. Fill form:
   - Title: "Test KB Entry"
   - Content: "This is test content for the knowledge base."
   - Type: PASTE (or select from dropdown)
5. Submit
6. Verify entry appears in list with status "DRAFT"
7. Click "Publish" button on the entry
8. Verify status changes to "PUBLISHED"
9. Test edit:
   - Click "Edit" on published entry
   - Change content → save
   - Verify changes persist
10. Test delete:
    - Create another test entry
    - Click "Delete" → confirm
    - Verify entry removed from list
11. Test search (if exists):
    - Type "test" in search box
    - Verify filters entries matching "test"

**Expected:**
- [ ] KB CRUD works
- [ ] Status changes (DRAFT → PUBLISHED)
- [ ] Edit works
- [ ] Delete works
- [ ] Published content appears in widget (verify in demo)

---

#### Test 2.6: Settings Hub (/app/settings)

**Steps:**
1. Navigate to `/app/settings`
2. Verify all settings cards display:
   - Business Info
   - Services
   - Hours
   - Branding (if OWNER/ADMIN)
   - Notifications
   - (Any other cards)
3. Click each "Manage" button → verify navigates to correct sub-page
4. Return to hub → verify navigation works

**Expected:**
- [ ] Hub displays all cards
- [ ] Navigation functional
- [ ] No errors

---

#### Test 2.7: Services Settings (/app/settings/services)

**Steps:**
1. Navigate to `/app/settings/services`
2. If no services: verify empty state
3. Click "Add Service" button
4. Fill form:
   - Name: "Test Service"
   - Price: "$100" (or 10000 cents)
   - Booking URL: "https://calendly.com/test"
   - Payment URL: "https://stripe.com/pay/test"
5. Submit
6. Verify service appears in list
7. Test edit:
   - Click "Edit" on service
   - Change name → "Test Service Updated"
   - Save → verify persists
8. Test reorder (if drag-drop or up/down buttons exist):
   - Move service up/down
   - Verify order changes
9. Test delete:
   - Click "Delete" → confirm
   - Verify service removed
10. Test validation:
    - Try to add service with empty name → expect error
    - Try to add service with invalid URL → expect error

**Expected:**
- [ ] Service CRUD works
- [ ] Validation enforced
- [ ] Changes persist
- [ ] Services appear in booking flow (verify in widget)

---

#### Test 2.8: Hours Settings (/app/settings/hours)

**Steps:**
1. Navigate to `/app/settings/hours`
2. Verify 7-day grid displays (Monday-Sunday)
3. For Monday:
   - Toggle "Closed" → verify becomes closed
   - Toggle "Open" → verify time inputs appear
   - Set open time: "09:00"
   - Set close time: "17:00"
   - Click "Save"
4. Verify changes persist (refresh page, verify hours still saved)
5. Test validation:
   - Set close time earlier than open time (e.g., open 09:00, close 08:00)
   - Expect inline error or save blocked
6. Test all days:
   - Set hours for all 7 days
   - Save → verify all persist
7. Test revert (if button exists):
   - Make changes
   - Click "Revert" → verify returns to previous state

**Expected:**
- [ ] Hours editor functional
- [ ] Validation works
- [ ] Changes persist
- [ ] Hours appear in Truth Mode responses (verify in widget)

---

#### Test 2.9: Branding Settings (/app/settings/branding)

**Steps:**
1. Navigate to `/app/settings/branding`
2. If CLIENT role and `allowClientEdits=false`: expect locked banner and disabled inputs
3. If OWNER/ADMIN:
   - Toggle "White Label" → enable
   - Enter company name: "Test Company"
   - Enter logo URL: "https://example.com/logo.png" (or upload if supported)
   - Change primary color: #ff0000 (red)
   - Toggle "Show Powered By" → disable
   - Save
4. Verify changes persist
5. Open widget in new tab → verify branding applied:
   - Logo shows (if provided)
   - Company name shows in header
   - Primary color applied
   - "Powered by" removed
6. Test custom domain section:
   - Enter custom domain: "chat.testcompany.com"
   - Save
   - Verify shows "Pending" status
   - Verify shows DNS instructions (TXT record name/value)
   - Note: verification can't be fully tested without DNS setup

**Expected:**
- [ ] Branding settings save
- [ ] White-label applies to widget
- [ ] Custom domain configuration displays
- [ ] RBAC enforced (CLIENT locked out if needed)

---

#### Test 2.10: Notifications Settings (/app/settings/notifications)

**Steps:**
1. Navigate to `/app/settings/notifications`
2. Toggle "Enable Notifications" → enable
3. Add recipient email: "test@example.com"
4. Toggle "Notify on Hot Lead" → enable
5. Toggle "Notify on Booking Click" → enable
6. Save
7. Verify changes persist
8. Test notification trigger:
   - Go to widget
   - Complete booking flow with high-scoring answers (to create HOT lead)
   - Check notification logs (if UI exists) → expect new log entry
   - Check email inbox → expect email received (if email sending implemented)
9. Test disable:
   - Toggle "Enable Notifications" → disable
   - Create another hot lead
   - Verify NO email sent

**Expected:**
- [ ] Notification settings save
- [ ] Emails sent when enabled (if implemented)
- [ ] No emails when disabled
- [ ] Logs created

---

### A.3 APP PAGES (Authenticated - CLIENT Role)

**Prerequisite:** Sign in as CLIENT (create test org with `allowClientEdits=false`)

#### Test 3.1: Dashboard (CLIENT View)

**Steps:**
1. Sign in as CLIENT
2. Navigate to `/app`
3. Verify dashboard displays (no RBAC block)
4. Verify can view KPIs
5. Verify can view charts

**Expected:**
- [ ] CLIENT can view dashboard
- [ ] No errors

---

#### Test 3.2: Settings (CLIENT Locked)

**Steps:**
1. As CLIENT, navigate to `/app/settings/services`
2. Verify "Locked" banner displays
3. Verify inputs are disabled (cannot edit)
4. Try to submit form (if possible) → expect 403 error or blocked
5. Navigate to `/app/settings/branding`
6. Verify redirected or 403 error (ADMIN only)

**Expected:**
- [ ] CLIENT locked out of editing (if `allowClientEdits=false`)
- [ ] Banner explains why
- [ ] API rejects edits with 403

---

### A.4 WIDGET FLOWS

#### Test 4.1: Widget Embed & Chat

**Steps:**
1. Get embed snippet from `/app/settings/embed` (or bot detail page)
2. Create test HTML file with embed snippet
3. Open in browser
4. Verify widget launcher button appears (bottom-right or bottom-left)
5. Click launcher → verify chat window opens
6. Type "Hello" → send
7. Verify bot responds with greeting
8. Type "What are your hours?" → send
9. Verify bot responds with hours (if set) or "I don't have that info"
10. Close widget → reopen
11. Verify messages persist in session

**Expected:**
- [ ] Widget loads
- [ ] Chat functional
- [ ] Truth Mode working
- [ ] Session persists

---

#### Test 4.2: Widget Booking Flow (Full E2E)

**Steps:**
1. In widget, type "I want to book an appointment" → send
2. Verify bot responds with service selection buttons
3. Click service "Test Service" button
4. Verify bot asks for name
5. Type name "John Doe" → send
6. Verify bot asks for phone
7. Type phone "555-123-4567" → send
8. Verify bot asks for email
9. Type email "john@example.com" → send
10. Verify bot shows completion message:
    - Summary: name, phone, email, service
    - Booking link button visible
11. Click booking link button
12. Verify:
    - Opens booking URL in new tab
    - Event logged (BOOKING_LINK_CLICKED)
13. Check database:
    - Lead created with correct data
    - Unique constraint upheld (try duplicate conversation/service → no new lead)
14. Check lead inbox:
    - Lead appears with status NEW
    - Temperature calculated correctly

**Expected:**
- [ ] Booking flow completes
- [ ] Lead created
- [ ] Idempotency enforced
- [ ] Booking URL correct (from OrganizationService table)
- [ ] Events logged
- [ ] Lead visible in inbox

---

#### Test 4.3: Widget Validation & Error Handling

**Steps:**
1. Start booking flow
2. When asked for name, type "A" (1 char) → send
3. Expect error: "Name must be at least 2 characters"
4. Type valid name → proceed
5. When asked for phone, type "abc" (invalid) → send
6. Expect error: "Please enter a valid phone number"
7. Type valid phone → proceed
8. When asked for email, type "invalid-email" → send
9. Expect error: "Please enter a valid email address"
10. Type valid email → proceed
11. Complete flow

**Expected:**
- [ ] Validation errors shown
- [ ] User can retry
- [ ] Flow completes after valid inputs

---

#### Test 4.4: Widget Cancel & Restart

**Steps:**
1. Start booking flow
2. Mid-flow (e.g., after selecting service), type "cancel" → send
3. Verify bot acknowledges and exits booking flow
4. Type "I want to book" → send
5. Verify flow restarts from beginning (service selection)
6. Mid-flow, type "restart" → send
7. Verify flow restarts
8. Complete flow successfully

**Expected:**
- [ ] Cancel works
- [ ] Restart works
- [ ] Flow can complete after restart

---

### A.5 ADMIN PAGES

**Prerequisite:** Sign in with admin access or Clerk super-admin

#### Test 5.1: Admin Clients Page (/app/admin/clients)

**Steps:**
1. Navigate to `/app/admin/clients`
2. Verify list of organizations displays
3. Click "Create Client" button (if exists)
4. Fill form:
   - Organization name: "Test Client Org"
5. Submit
6. Verify organization created
7. Click "Invite" button for a client
8. Fill invite form:
   - Email: "client@example.com"
   - Role: CLIENT
9. Send invite
10. Verify invite sent (check logs or notification)

**Expected:**
- [ ] Admin can view all clients
- [ ] Admin can create orgs
- [ ] Admin can send invites

---

#### Test 5.2: Admin Settings Page (/app/admin/settings)

**Steps:**
1. Navigate to `/app/admin/settings`
2. Verify displays:
   - Auth mode (production / dev_bypass / test)
   - Clerk keys status (present / missing)
   - Environment info
3. Verify no secrets exposed (Clerk secret key hidden)

**Expected:**
- [ ] Auth status displayed
- [ ] No secrets leaked

---

### A.6 EDGE CASES & ERROR STATES

#### Test 6.1: Unauthenticated Access Attempt

**Steps:**
1. Sign out
2. Try to access `/app/leads` directly (paste URL)
3. Expect redirect to `/sign-in` or 401 error

**Expected:**
- [ ] Unauthenticated users blocked
- [ ] Redirected to sign-in

---

#### Test 6.2: Cross-Tenant Access Attempt

**Steps:**
1. Sign in as User A (Org A)
2. Get a bot public key from Org B (or conversation ID, lead ID, etc.)
3. Try to access `/app/bots/[org-b-bot-key]`
4. Expect 404 or 403

**Expected:**
- [ ] Tenant isolation enforced
- [ ] No cross-tenant data leakage

---

#### Test 6.3: Network Error Handling

**Steps:**
1. Open browser DevTools → Network tab
2. Go offline (disable network)
3. Try to load `/app/leads`
4. Verify error message shown (not blank page)
5. Go online
6. Retry → verify loads

**Expected:**
- [ ] Graceful error handling
- [ ] User notified
- [ ] No crashes

---

#### Test 6.4: Large Data Sets

**Steps:**
1. Create 100+ leads (script or manual)
2. Navigate to `/app/leads`
3. Verify pagination works
4. Verify performance acceptable (< 3s load)
5. Test export with 100+ leads
6. Verify CSV contains all records

**Expected:**
- [ ] Handles large data sets
- [ ] Performance acceptable
- [ ] Export complete

---

## PART B: AUTOMATED TEST COVERAGE MAP

### B.1 Unit Tests (Vitest)

**Location:** `__tests__/` directories throughout codebase

#### Existing Coverage
| Module | Test File | Status | Tests |
|--------|-----------|--------|-------|
| Booking FSM | `booking/stateMachine.test.ts` | ✅ | 20+ |
| Booking Runtime | `booking/runtime.test.ts` | ✅ | 10+ |
| Booking Validators | `booking/validators.test.ts` | ✅ | 15+ |
| Analytics | `analytics/analytics.test.ts` | ✅ | 10+ |
| Lead Scoring | `leads/scoreLead.test.ts` | ✅ | 8+ |
| Auth | `auth/getOrgContext.test.ts` | ✅ | 12+ |
| Validators | `validators/*.test.ts` | ✅ | 20+ |
| Settings | `settings/*.test.ts` | ✅ | 15+ |
| Templates | `templates/*.test.ts` | ✅ | 8+ |
| Notifications | `notifications/*.test.ts` | ✅ | 6+ |

**Total Unit Tests:** ~626 (from package.json vitest run)

#### Missing Unit Tests
- [ ] `src/lib/ai/draftGenerator.ts` - No tests yet (pending implementation)
- [ ] `src/lib/plans/features.ts` - No tests yet (pending implementation)
- [ ] Component library tests (TcaInput, TcaButton, etc.)

**Command to Run:**
```bash
pnpm vitest run
```

---

### B.2 E2E Tests (Playwright)

**Location:** `tests/` directory

#### Smoke Tests (`tests/smoke.spec.ts`)
**Coverage:** Critical happy paths
- Landing page loads
- Pricing page loads
- Demo page loads
- Dashboard loads (after auth)
- Widget loads

**Command:**
```bash
pnpm playwright test --project=smoke
```

---

#### Widget Booking Tests (`tests/widgetBooking.spec.ts`)
**Coverage:** Full booking flow
- Widget loads
- Chat interaction
- Service selection
- Lead capture (name, phone, email)
- Completion screen
- Booking link tracking

**Command:**
```bash
pnpm playwright test tests/widgetBooking.spec.ts
```

---

#### Navigation Tests (`tests/navigation.spec.ts`, `tests/nav-global.spec.ts`)
**Coverage:** App navigation
- Sidebar links
- Settings sub-nav
- Logo click returns home
- Tab navigation (keyboard a11y)

**Command:**
```bash
pnpm playwright test tests/navigation.spec.ts
pnpm playwright test tests/nav-global.spec.ts
```

---

#### Settings Tests
**Files:** `tests/hours-settings.spec.ts`, `tests/services-settings.spec.ts`
**Coverage:** Settings CRUD
- Hours editor
- Services CRUD
- Validation

**Command:**
```bash
pnpm playwright test tests/hours-settings.spec.ts
pnpm playwright test tests/services-settings.spec.ts
```

---

#### Analytics & Leads Tests (`tests/analytics-leads.spec.ts`)
**Coverage:** Analytics + Leads
- KPI display
- Funnel visualization
- Lead list
- Lead filters
- Export

**Command:**
```bash
pnpm playwright test tests/analytics-leads.spec.ts
```

---

#### Security Tests
**Files:** `tests/security-tenant.spec.ts`, `tests/org-security.spec.ts`
**Coverage:** Security
- Tenant isolation (cross-org access blocked)
- RBAC enforcement
- Unauthenticated access blocked
- Secrets not exposed

**Command:**
```bash
pnpm playwright test --project=security
```

---

#### Form Validation Tests (`tests/forms-validation.spec.ts`)
**Coverage:** Form validation
- All forms tested with invalid inputs
- Inline errors displayed
- Submissions blocked until valid

**Command:**
```bash
pnpm playwright test tests/forms-validation.spec.ts
```

---

#### Visual Regression Tests (`tests/visual.spec.ts`)
**Coverage:** Visual baselines
- Screenshots of all major pages
- Comparison against baselines
- Detects UI regressions

**Status:** ⚠️ Baselines not yet generated

**Command:**
```bash
# Generate baselines (first run)
pnpm playwright test --project=visual --update-snapshots

# Run visual tests (compare against baselines)
pnpm playwright test --project=visual
```

---

### B.3 Test Coverage Gaps

#### High Priority Gaps
1. **Conversations page** - No tests (page is "Coming Soon")
2. **Onboarding wizard** - Partial tests, need AI draft flow
3. **Bot CRUD API** - No tests (routes don't exist yet)
4. **Plan gating** - No tests (feature not implemented)
5. **Email notifications** - No tests for actual sending (only logs)

#### Medium Priority Gaps
6. **Niche landing pages** - No tests (pages don't exist)
7. **Custom domain verification** - No automated tests (requires DNS)
8. **Chaos/error injection** - No tests
9. **Load/performance** - No tests
10. **Accessibility audit** - No automated tests (axe-core not integrated)

---

### B.4 QA Automation Roadmap

#### Phase 1: Close Critical Gaps
- [ ] Add tests for Bot CRUD API (after implementation)
- [ ] Add tests for AI draft generation (after implementation)
- [ ] Add tests for plan gating (after implementation)
- [ ] Generate visual regression baselines

#### Phase 2: Expand Coverage
- [ ] Add E2E test for onboarding wizard (full flow)
- [ ] Add E2E test for conversation history page (after implementation)
- [ ] Add load tests (Artillery or k6)
- [ ] Integrate axe-core for a11y testing

#### Phase 3: CI/CD Integration
- [ ] Add GitHub Actions workflow
- [ ] Run unit tests on every PR
- [ ] Run smoke + security tests on every PR
- [ ] Run full E2E suite nightly
- [ ] Run visual tests on main branch merges
- [ ] Block merges if tests fail

---

## PART C: QUALITY GATES (Before Ship)

### Gate 1: Type Safety ✅
```bash
pnpm typecheck
```
**Expected:** 0 errors

---

### Gate 2: Unit Tests ✅
```bash
pnpm vitest run
```
**Expected:** All pass (626 tests or current count)

---

### Gate 3: E2E Smoke Tests ⚠️
```bash
pnpm playwright test --project=smoke
```
**Expected:** All pass
**Status:** Pending full run

---

### Gate 4: E2E Security Tests ⚠️
```bash
pnpm playwright test --project=security
```
**Expected:** All pass
**Status:** Pending full run

---

### Gate 5: E2E Full Suite ⚠️
```bash
pnpm playwright test --project=chromium
```
**Expected:** All pass
**Status:** Pending full run

---

### Gate 6: Visual Regression ⚠️
```bash
pnpm playwright test --project=visual
```
**Expected:** 0 unexpected diffs
**Status:** Baselines not set

---

### Gate 7: Build ✅
```bash
pnpm build
```
**Expected:** Clean build with 0 errors
**Status:** Currently passing

---

### Gate 8: Accessibility Audit ⚠️
```bash
# Manual using axe DevTools browser extension
# Or automate with @axe-core/playwright
```
**Expected:** 0 critical violations
**Status:** Not yet run

---

### Gate 9: Security Scan ⚠️
```bash
pnpm audit
# OR
npm audit
```
**Expected:** 0 high/critical vulnerabilities
**Status:** Not yet run

---

### Gate 10: Performance Audit ⚠️
```bash
# Lighthouse CI or manual
```
**Expected:** Performance score > 90, Accessibility > 95
**Status:** Not yet run

---

## PART D: SHIP READINESS CHECKLIST

### Product Completeness
- [x] Truth Mode working (no hallucinations)
- [x] Booking flow deterministic (FSM-based)
- [x] Lead capture working
- [x] Analytics dashboard functional
- [ ] AI draft generation implemented
- [ ] Plan/gating system implemented
- [x] Settings fully functional
- [x] Widget embeddable
- [x] Domain allowlist enforced

### Security
- [x] Tenant isolation tested
- [x] RBAC enforced
- [x] Production auth bypass disabled
- [x] Secrets not exposed in client
- [ ] Rate limiting verified under load
- [ ] CSRF protection verified
- [ ] XSS protection verified (DOMPurify)
- [ ] SQL injection impossible (Prisma parameterized)

### Quality Assurance
- [x] Unit tests pass (626 tests)
- [ ] E2E smoke tests pass
- [ ] E2E security tests pass
- [ ] E2E full suite pass
- [ ] Visual regression baselines set
- [ ] Manual test script executed (this document)
- [ ] Accessibility audit complete
- [ ] Performance audit complete

### UX/Design
- [ ] Marketing site premium polish
- [ ] App UI consistent (TCA components)
- [ ] Empty states helpful
- [ ] Loading states present
- [ ] Error states graceful
- [ ] Mobile responsive
- [ ] Focus rings visible
- [ ] Keyboard navigation working

### Operational Readiness
- [ ] Deployment docs complete
- [ ] Environment variables documented
- [ ] Monitoring/logging setup
- [ ] Error tracking (Sentry) setup
- [ ] Backup strategy documented
- [ ] Rollback plan tested
- [ ] Onboarding wizard fast (<5 min)
- [ ] Demo bot preloaded

---

## PART E: REGRESSION TEST SUITE (Run Before Each Release)

### Quick Regression (30 minutes)
1. Run unit tests: `pnpm vitest run`
2. Run smoke tests: `pnpm playwright test --project=smoke`
3. Run security tests: `pnpm playwright test --project=security`
4. Manual: Create lead via widget, verify appears in inbox
5. Manual: Update settings, verify persists
6. Build: `pnpm build`

### Full Regression (2 hours)
1. All Quick Regression steps
2. Run full E2E suite: `pnpm playwright test`
3. Run visual tests: `pnpm playwright test --project=visual`
4. Execute manual test script (Part A, selected tests)
5. Test as CLIENT role (RBAC)
6. Test cross-tenant isolation
7. Test all CRUD operations
8. Export data (leads, analytics)
9. Performance check (Lighthouse)

---

## CONCLUSION

**Ship Readiness:** 🟡 NOT READY YET

**Blockers:**
1. AI draft generation not implemented
2. Plan/gating system not implemented
3. E2E tests not fully run
4. Visual regression baselines not set
5. Premium UI polish incomplete

**Recommended Action:**
1. Complete CRITICAL fixes from SHIP_PLAN.md
2. Run full QA gate suite
3. Execute manual test script
4. Fix any failures
5. Re-run gates until green
6. Ship!

**Estimated Time to Ship-Ready:** 1-2 weeks (with focused effort on critical fixes)

