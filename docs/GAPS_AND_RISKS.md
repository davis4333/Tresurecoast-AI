# DELIVERABLE 2: GAPS & RISKS (EXHAUSTIVE)

**Ranked by:** CRITICAL > HIGH > MEDIUM > LOW

---

## 🔴 CRITICAL GAPS (Ship Blockers)

### C1. PLAN/GATING SYSTEM MISSING
**Risk:** No business model enforcement, unlimited free usage
**Impact:** Cannot monetize, no upgrade path, resource abuse possible
**Files Affected:**
- `prisma/schema.prisma` - No Plan model
- `src/lib/plans/` - Directory doesn't exist
- All API routes - No plan checks

**Evidence:**
```bash
grep -r "plan" prisma/schema.prisma  # Returns nothing
grep -r "tier" prisma/schema.prisma  # Returns nothing
grep -r "subscription" prisma/schema.prisma  # Returns nothing
```

**Required Fix:**
1. Add Plan enum to schema (FREE, STARTER, PRO, AGENCY)
2. Add `planId` to Organization
3. Create plan feature matrix
4. Add plan checks to all gated features:
   - Bot creation (count limit)
   - Conversation creation (monthly limit)
   - Analytics date range (7/30/90 days)
   - White-label features
   - Custom domain
   - Notifications
5. Add "Upgrade" CTAs throughout UI

---

### C2. AI DRAFT GENERATION NOT IMPLEMENTED
**Risk:** Core value prop missing, onboarding wizard incomplete
**Impact:** Cannot deliver "AI generates drafts" promise
**Files Affected:**
- `src/app/api/org/onboarding/generate/route.ts` - No LLM integration
- `src/lib/onboarding/aiDrafts.ts` - File doesn't exist

**Evidence:**
```bash
grep -r "openai" src/  # Returns nothing
grep -r "anthropic" src/  # Returns nothing
grep -r "llm" src/  # Returns nothing
grep -r "gpt" src/  # Returns nothing
```

**Current Behavior:**
- Wizard creates bot with template KB content (static placeholders)
- No "About" text generation
- No FAQ generation
- No KB entry generation
- No review/approve UI

**Required Fix:**
1. Integrate LLM API (OpenAI GPT-4 or Anthropic Claude)
2. Create `src/lib/ai/draftGenerator.ts`:
   - `generateAboutText()`
   - `generateFAQs()`
   - `generateKBEntries()`
3. Add `status` enum to `BotKnowledgeSource` (DRAFT/PUBLISHED)
4. Build review/approve UI in onboarding wizard
5. Implement publish workflow

---

### C3. BOT CRUD API ROUTES MISSING
**Risk:** Cannot create/edit bots via API, only via page components
**Impact:** No programmatic bot management
**Files Affected:**
- `src/app/api/org/bots/route.ts` - **FILE DOESN'T EXIST**
- `src/app/api/org/bots/[botPublicKey]/route.ts` - **FILE DOESN'T EXIST**

**Evidence:**
```bash
ls src/app/api/org/bots/
# Only returns: [botPublicKey]/knowledge/ subdirectory
```

**Current Workaround:** Bot pages use direct Prisma calls (not RESTful)

**Required Fix:**
1. Create `GET /api/org/bots` - List bots for org
2. Create `POST /api/org/bots` - Create bot
3. Create `GET /api/org/bots/[key]` - Get bot detail
4. Create `PUT /api/org/bots/[key]` - Update bot
5. Create `DELETE /api/org/bots/[key]` - Archive bot
6. Add RBAC checks + orgId filters
7. Update bot pages to use API endpoints

---

### C4. ANALYTICS FORMULA MISMATCH
**Risk:** Conversion rate calculation doesn't match PRD spec
**Impact:** Dashboard shows incorrect metrics
**Files Affected:**
- `src/app/api/org/analytics/overview/route.ts:78-85`

**Evidence:**
```typescript
// Current code (line 78-85):
const conversionRate = serviceSelectedCount > 0
  ? (bookingLinkClickedCount / serviceSelectedCount) * 100
  : 0;

// PRD Requirement:
// "Conversion rate = booking clicks / leads created"
```

**Issue:** Using `serviceSelectedCount` as denominator, should use `leadCreatedCount`

**Required Fix:**
```typescript
const conversionRate = leadCreatedCount > 0
  ? (bookingLinkClickedCount / leadCreatedCount) * 100
  : 0;
```

**Verification:** Update E2E tests to assert correct formula

---

### C5. DRAFT/PUBLISHED STATUS MISSING FROM KB
**Risk:** Cannot distinguish between draft and published content
**Impact:** Truth Mode may use unapproved content
**Files Affected:**
- `prisma/schema.prisma:378-397` - `BotKnowledgeSource` model

**Evidence:**
```prisma
model BotKnowledgeSource {
  id             Int      @id @default(autoincrement())
  botId          Int
  organizationId Int
  type        String   // "PASTE" | "URL"
  title       String
  content     String
  contentHash String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // MISSING: status field
  ...
}
```

**Required Fix:**
1. Add migration:
```prisma
enum KnowledgeSourceStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model BotKnowledgeSource {
  ...
  status KnowledgeSourceStatus @default(DRAFT)
  publishedAt DateTime?
  ...
}
```
2. Update Truth Mode retrieval to filter `WHERE status = 'PUBLISHED'`
3. Add publish/unpublish endpoints
4. Update KB UI with status badges + publish buttons

---

## 🟡 HIGH PRIORITY GAPS

### H1. EMAIL NOTIFICATIONS NOT SENDING
**Risk:** Notification logs created but no actual emails sent
**Impact:** Owners don't get lead alerts
**Files Affected:**
- `src/lib/notifications/notificationService.ts:42-56`

**Evidence:**
```typescript
// Current code just logs to NotificationLog table:
await prisma.notificationLog.create({
  data: {
    organizationId,
    type,
    recipientEmail,
    status: 'PENDING',
    // ... but never actually sends email
  }
});
```

**Required Fix:**
1. Add email provider env vars:
   ```
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM=
   ```
2. Integrate email service (Resend, SendGrid, or Nodemailer)
3. Implement `sendEmailViaProvider()` function
4. Add retry logic for failed sends
5. Update `status` to 'SENT' or 'FAILED' with error message

---

### H2. COMPONENT LIBRARY INCOMPLETE
**Risk:** Inconsistent UI patterns, hard to maintain
**Impact:** Premium feel degraded, accessibility issues
**Files Missing:**
- `src/components/tca/TcaInput.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaSelect.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaModal.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaDrawer.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaToast.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaTable.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaSkeleton.tsx` - **DOESN'T EXIST**
- `src/components/tca/TcaEmptyState.tsx` - **DOESN'T EXIST**

**Current State:** Inputs/modals/etc. use inline Tailwind (inconsistent)

**Required Fix:**
1. Create unified TCA component library
2. Define prop interfaces for each component
3. Implement all variants (primary/secondary/ghost/destructive for buttons)
4. Add accessibility (aria labels, focus rings, keyboard nav)
5. Replace all inline components with TCA components
6. Create Storybook or component docs

---

### H3. MARKETING SITE NEEDS PREMIUM POLISH
**Risk:** Looks "good" but not "multi-million-dollar"
**Impact:** Conversion rate lower, brand perception weak
**Files Affected:**
- `src/app/(public)/page.tsx` - Landing page
- `src/app/(public)/pricing/page.tsx` - Pricing page
- `src/app/(public)/demo/page.tsx` - Demo page
- `src/app/(public)/request-demo/page.tsx` - Request demo

**Issues:**
1. Hero section lacks visual impact
2. Feature grid spacing inconsistent
3. Testimonials need better styling
4. No animations/motion
5. CTAs not prominent enough
6. Mobile experience needs polish
7. No sticky nav on scroll

**Required Fix:**
1. Implement "Coastal Dusk Luxury" theme fully
2. Add subtle animations (scroll reveals, hover effects)
3. Enhance hero with gradient overlays, better typography
4. Create visual hierarchy with shadows/elevation
5. Add social proof section with logos/stats
6. Implement sticky nav with blur backdrop
7. Optimize mobile layout
8. Add visual regression tests

---

### H4. NICHE LANDING PAGES MISSING
**Risk:** No industry-specific marketing channels
**Impact:** Lower SEO, harder to target specific audiences
**Files Missing:**
- `src/app/(public)/barbers/page.tsx` - **DOESN'T EXIST**
- `src/app/(public)/salons/page.tsx` - **DOESN'T EXIST**
- `src/app/(public)/gyms/page.tsx` - **DOESN'T EXIST**
- `src/app/(public)/dentists/page.tsx` - **DOESN'T EXIST**
- `src/app/(public)/contractors/page.tsx` - **DOESN'T EXIST**

**Required Fix:**
1. Create template-driven niche pages
2. Use template registry to generate content:
   - Hero: "{Industry} AI Assistant"
   - Features: Industry-specific benefits
   - Testimonials: Industry-specific quotes
   - FAQ: Industry-specific questions
3. Generate pages programmatically from template registry
4. Add metadata for SEO
5. Create sitemap

---

### H5. TcaButton MISSING VARIANTS
**Risk:** Inconsistent button styles across app
**Impact:** Premium feel degraded
**File:** `src/components/tca/TcaButton.tsx`

**Evidence:**
```typescript
// Current variants: primary, secondary, disabled
// Missing: ghost, destructive, outline
```

**Current Usage:** Many buttons use inline Tailwind classes

**Required Fix:**
1. Add button variants:
   ```typescript
   variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
   ```
2. Implement styling for each variant
3. Find/replace all inline button styles with `<TcaButton>`
4. Add loading state prop
5. Add icon support (left/right)

---

### H6. NO TOAST NOTIFICATION SYSTEM
**Risk:** Success/error feedback inconsistent
**Impact:** Poor UX, users unsure if actions succeeded
**File Missing:** `src/components/tca/TcaToast.tsx`

**Current Workaround:** Some pages use browser `alert()` or nothing

**Required Fix:**
1. Create `<TcaToast>` component
2. Implement toast provider/context
3. Add toast trigger function: `toast.success()`, `toast.error()`, `toast.info()`
4. Position: fixed bottom-right
5. Auto-dismiss after 5s (configurable)
6. Support stacking multiple toasts
7. Add close button
8. Replace all alert() calls with toast()

---

### H7. MOBILE NAV MISSING HAMBURGER
**Risk:** Mobile navigation broken on public site
**Impact:** Mobile users can't navigate
**File:** `src/components/tca/PublicNav.tsx`

**Evidence:**
```bash
grep -n "hamburger" src/components/tca/PublicNav.tsx  # Returns nothing
grep -n "menu-icon" src/components/tca/PublicNav.tsx  # Returns nothing
```

**Current State:** Nav items likely overflow or hidden on mobile

**Required Fix:**
1. Add hamburger icon (lucide-react Menu icon)
2. Implement mobile menu drawer
3. Show/hide based on screen size (md:hidden / md:flex)
4. Add close button in drawer
5. Test on mobile devices
6. Add E2E mobile test

---

## 🟢 MEDIUM PRIORITY GAPS

### M1. CONVERSATIONS PAGE NOT IMPLEMENTED
**Risk:** Cannot browse chat history
**Impact:** Support/debugging harder, feature promised but missing
**File:** `src/app/app/conversations/page.tsx`

**Current State:**
```typescript
export default function ConversationsPage() {
  return (
    <TcaPageShell title="Conversations" description="Coming Soon">
      <div className="text-center py-12">
        <p>This feature is coming soon.</p>
      </div>
    </TcaPageShell>
  );
}
```

**Required Fix:**
1. Create conversation list API: `GET /api/org/conversations`
2. Build conversation list UI:
   - Table: date, bot, lead, status, message count
   - Filters: date range, bot, lead status
   - Search: by lead name/email
3. Create conversation detail drawer
4. Show full message history with timestamps
5. Add export conversation feature
6. Add E2E tests

---

### M2. VISUAL REGRESSION BASELINES NOT SET
**Risk:** UI regressions won't be caught
**Impact:** Design polish degrades over time
**File:** `tests/visual.spec.ts`

**Current State:** Test file exists but no baseline screenshots taken

**Required Fix:**
1. Run visual tests to generate baselines:
   ```bash
   pnpm playwright test --project=visual --update-snapshots
   ```
2. Review all screenshots for quality
3. Mask dynamic elements (timestamps, IDs, random data)
4. Commit baselines to git
5. Document visual test process in `docs/QA_COVERAGE_MATRIX.md`
6. Add to CI pipeline

---

### M3. REVENUE INFLUENCED NOT ON DASHBOARD
**Risk:** Missing ROI metric
**Impact:** Lower perceived value
**File:** `src/app/app/analytics/page.tsx`

**Current State:** AOV field exists in Organization table, calculated in API, but not displayed

**Required Fix:**
1. Add "Revenue Influenced" KPI card to dashboard:
   ```typescript
   const revenueInfluenced = leadCount * (organization.averageOrderValue || 0);
   ```
2. Show: "$X,XXX influenced by leads"
3. Add info tooltip explaining calculation
4. Make it conditional (only show if AOV set)
5. Add to analytics E2E test

---

### M4. TRUTH MODE FALLBACK TONE INCONSISTENT
**Risk:** Some fallback messages don't match premium brand voice
**Impact:** Brand perception weaker
**Files Affected:**
- `src/lib/truth/truthEngine.ts:50-120`

**Current Fallback Examples:**
```typescript
"I don't have information about that yet."
"I'm not sure about that."
"Let me get you in touch with someone."
```

**Required Fix:**
1. Audit all fallback messages
2. Ensure consistent tone: confident, helpful, not apologetic
3. Always offer next action (book/capture lead)
4. Example replacement:
   ```typescript
   // Instead of: "I don't have information about that yet."
   // Use: "I don't have that information in my knowledge base, but I'd be happy to connect you with the team. Would you like to schedule a time to chat?"
   ```
5. Add fallback message tests

---

### M5. RATE LIMITING WEAK ON PUBLIC ENDPOINTS
**Risk:** Abuse, DDoS, resource exhaustion
**Impact:** Service degradation, increased costs
**Files Affected:**
- `src/app/api/public/chat/route.ts` - Has rate limit but may be too permissive
- `src/app/api/public/leads/route.ts` - Has rate limit
- Other public endpoints - May not have rate limits

**Current Implementation:**
```typescript
// src/lib/utils/rateLimit.ts exists
// But limits may be too high:
// - 100 requests per 15 minutes per IP (for chat)
```

**Required Fix:**
1. Audit all public endpoint rate limits
2. Tighten limits:
   - Chat: 30 requests / 15 min / IP
   - Leads: 20 requests / 15 min / IP
   - Demo requests: 5 requests / hour / IP
3. Add rate limit response headers
4. Add rate limit exceeded toast on frontend
5. Consider Redis for distributed rate limiting (production)
6. Add rate limit E2E test

---

### M6. NO ERROR BOUNDARIES IN APP
**Risk:** Unhandled errors crash entire app
**Impact:** Poor UX, hard to debug
**Files Missing:**
- `src/app/error.tsx` - Root error boundary
- `src/app/app/error.tsx` - App error boundary

**Required Fix:**
1. Create root error boundary:
   ```tsx
   // src/app/error.tsx
   'use client'
   export default function Error({ error, reset }) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <TcaCard>
           <TcaCardBody>
             <h2>Something went wrong</h2>
             <button onClick={reset}>Try again</button>
           </TcaCardBody>
         </TcaCard>
       </div>
     );
   }
   ```
2. Create app-specific error boundary
3. Log errors to monitoring service (Sentry, LogRocket)
4. Add error boundary tests

---

### M7. SKELETON LOADING STATES INCOMPLETE
**Risk:** Jarring layout shifts on page load
**Impact:** Poor perceived performance
**Files Missing:**
- Most pages don't have loading.tsx files

**Current State:** Some pages have skeletons, many don't

**Required Fix:**
1. Create `TcaSkeleton` component
2. Add loading.tsx for each route:
   - `/app/leads/loading.tsx`
   - `/app/analytics/loading.tsx`
   - `/app/bots/loading.tsx`
   - `/app/settings/*/loading.tsx`
3. Match skeleton structure to actual page layout
4. Use consistent pulse animation
5. Test with Playwright (verify skeleton appears)

---

### M8. EMPTY STATES INCONSISTENT
**Risk:** Some pages have good empty states, others don't
**Impact:** Confused users, unclear next actions
**Files Affected:** Multiple page files

**Required Fix:**
1. Create `TcaEmptyState` component:
   ```tsx
   <TcaEmptyState
     icon={<InboxIcon />}
     title="No leads yet"
     description="Leads will appear here once visitors interact with your AI assistant."
     action={{ label: "View embed instructions", href: "/app/settings/embed" }}
   />
   ```
2. Audit all list pages:
   - Leads
   - Bots
   - Conversations
   - KB articles
   - Services
   - Members
3. Ensure all empty states include:
   - Helpful icon
   - Clear title
   - Explanation
   - Next action CTA

---

## ⚪ LOW PRIORITY GAPS

### L1. NO STORYBOOK OR COMPONENT DOCS
**Risk:** Hard for new devs to understand components
**Impact:** Slower development, inconsistent usage
**Files Missing:** Entire Storybook setup

**Required Fix:**
1. Install Storybook: `pnpm add -D @storybook/nextjs`
2. Create stories for all TCA components
3. Document props, variants, usage examples
4. Add accessibility notes
5. Deploy Storybook to Vercel

---

### L2. NO SITEMAP.XML
**Risk:** Lower SEO, search engines may miss pages
**Impact:** Less organic traffic
**File Missing:** `public/sitemap.xml` or `src/app/sitemap.ts`

**Required Fix:**
1. Create dynamic sitemap generator:
   ```typescript
   // src/app/sitemap.ts
   export default function sitemap() {
     return [
       { url: 'https://treasurecoastai.com', lastModified: new Date() },
       { url: 'https://treasurecoastai.com/pricing', lastModified: new Date() },
       // ... niche pages
     ];
   }
   ```
2. Add to robots.txt
3. Submit to Google Search Console

---

### L3. NO ROBOTS.TXT
**Risk:** Search engines may crawl admin/test pages
**Impact:** Lower SEO quality
**File Missing:** `public/robots.txt`

**Required Fix:**
```txt
User-agent: *
Disallow: /api/
Disallow: /app/
Disallow: /test/
Disallow: /widget/
Allow: /

Sitemap: https://treasurecoastai.com/sitemap.xml
```

---

### L4. NO FAVICON VARIANTS
**Risk:** Generic favicon on mobile/PWA
**Impact:** Branding weaker
**Files Missing:** Multiple icon sizes in `public/`

**Required Fix:**
1. Generate favicon pack (16x16, 32x32, 180x180, 192x192, 512x512)
2. Add to `src/app/layout.tsx`:
   ```tsx
   <link rel="icon" href="/favicon.ico" sizes="any" />
   <link rel="icon" href="/icon.svg" type="image/svg+xml" />
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   ```
3. Add manifest.json for PWA

---

### L5. NO CHANGELOG
**Risk:** Users don't know what's new
**Impact:** Lower engagement with new features
**File Missing:** `CHANGELOG.md` or `/changelog` page

**Required Fix:**
1. Create `CHANGELOG.md` with semantic versioning
2. Document all releases
3. Optionally create `/changelog` public page
4. Link from footer

---

### L6. NO ANALYTICS TRACKING (GOOGLE/PLAUSIBLE)
**Risk:** Don't know how users interact with site
**Impact:** Can't optimize conversion funnel
**Files Missing:** Analytics script in layout

**Required Fix:**
1. Choose: Google Analytics, Plausible, or Fathom
2. Add script to `src/app/layout.tsx`
3. Track key events:
   - Demo widget opened
   - Demo request submitted
   - Sign up started
   - Onboarding completed
   - Bot created
   - Lead captured
4. Set up conversion goals

---

### L7. NO WEBHOOK INTEGRATION FOR LEADS
**Risk:** No way to send leads to external CRM/Slack/Zapier
**Impact:** Manual data entry required
**Files Affected:**
- `src/lib/notifications/notificationService.ts` - Could add webhook support

**Required Fix:**
1. Add webhook URL field to Organization
2. Add webhook signature for security
3. Send POST to webhook on lead creation:
   ```json
   {
     "event": "lead.created",
     "data": { "lead": {...} },
     "signature": "sha256..."
   }
   ```
4. Add retry logic
5. Log webhook attempts to `NotificationLog`

---

### L8. NO MULTI-LANGUAGE SUPPORT
**Risk:** Limited to English-speaking markets
**Impact:** Smaller addressable market
**Files:** Entire codebase (hardcoded strings)

**Required Fix:**
1. Install i18n library (next-intl)
2. Extract all UI strings to locale files
3. Add language selector
4. Support: en, es, fr (start with 3)
5. Update SEO metadata per language

---

## SECURITY GAPS

### S1. MISSING INPUT SANITIZATION IN KB CONTENT
**Risk:** XSS attack via knowledge base entries
**Impact:** Malicious scripts could execute in widget
**Files Affected:**
- `src/app/api/org/bots/[botPublicKey]/knowledge/route.ts`

**Evidence:** Content is stored as-is, displayed in widget without sanitization

**Required Fix:**
1. Install DOMPurify: `pnpm add dompurify isomorphic-dompurify`
2. Sanitize on save:
   ```typescript
   import DOMPurify from 'isomorphic-dompurify';
   const clean = DOMPurify.sanitize(content);
   ```
3. Add test with XSS payload
4. Verify widget displays safe HTML only

---

### S2. DOMAIN VERIFICATION TOKEN VISIBLE TO CLIENTS
**Risk:** Clients could see verification token (not critical but violates PRD)
**Impact:** Slight security/trust issue
**File:** `src/app/api/org/custom-domain/route.ts`

**Current State:** `domainVerificationToken` included in response if user is CLIENT

**Required Fix:**
1. Filter out `domainVerificationToken` from response if role is CLIENT:
   ```typescript
   if (ctx.role === 'CLIENT') {
     return NextResponse.json({
       customDomain: org.customDomain,
       customDomainStatus: org.customDomainStatus,
       // DO NOT include: domainVerificationToken
     });
   }
   ```
2. Add RBAC test for this

---

### S3. NO CSRF PROTECTION ON STATE-CHANGING OPERATIONS
**Risk:** Cross-site request forgery attacks possible
**Impact:** Attacker could trigger actions on behalf of user
**Files Affected:** All POST/PUT/DELETE endpoints

**Current State:** Clerk provides some protection, but explicit CSRF tokens not used

**Required Fix:**
1. Add CSRF token middleware
2. Validate token on all state-changing operations
3. Or rely on SameSite cookies + Clerk's CSRF protection (verify this is sufficient)
4. Add CSRF test

---

### S4. NO CONTENT SECURITY POLICY
**Risk:** XSS attacks easier to execute
**Impact:** Widget could load malicious scripts
**File:** `next.config.mjs` - Missing CSP headers

**Required Fix:**
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com; connect-src 'self' https://api.clerk.com;"
          }
        ]
      }
    ];
  }
};
```

---

## TEST GAPS

### T1. NO CHAOS/ERROR INJECTION TESTS
**Risk:** App behavior under failures unknown
**Impact:** Production incidents harder to handle
**Files Missing:** `tests/chaos.spec.ts`

**Required Tests:**
1. Database connection lost
2. API timeout
3. Invalid Clerk token
4. Malformed request body
5. Large file upload
6. Concurrent lead creation (race condition)

---

### T2. NO LOAD/PERFORMANCE TESTS
**Risk:** App may not scale under traffic
**Impact:** Slow response times, crashes
**Files Missing:** Load test suite (Artillery, k6, or Playwright scaled)

**Required Fix:**
1. Create load test scenarios:
   - 100 concurrent chat requests
   - 50 concurrent lead creations
   - 20 concurrent analytics queries
2. Measure response times
3. Set SLAs: p50 < 200ms, p95 < 1s, p99 < 3s
4. Run before each major release

---

### T3. NO ACCESSIBILITY AUDIT
**Risk:** WCAG compliance unknown
**Impact:** Legal risk, users with disabilities excluded
**Files Missing:** Accessibility test reports

**Required Fix:**
1. Run axe-core on all pages
2. Test with screen reader (NVDA/JAWS)
3. Test keyboard-only navigation
4. Fix all critical a11y issues
5. Add `aria-label` where missing
6. Ensure focus rings visible
7. Test color contrast (use WCAG checker)

---

## SUMMARY BY CATEGORY

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| **Product Gaps** | 3 | 4 | 4 | 5 |
| **Security Gaps** | 0 | 1 | 3 | 0 |
| **UX/Design Gaps** | 0 | 3 | 4 | 2 |
| **Test Gaps** | 0 | 0 | 2 | 1 |
| **Total** | **5** | **12** | **16** | **10** |

---

## SHIP READINESS VERDICT

**Overall Status:** 🟡 NOT READY TO SHIP

**Blockers (Must Fix):**
1. C1: Plan/gating system
2. C2: AI draft generation
3. C3: Bot CRUD API routes
4. C4: Analytics formula fix
5. C5: Draft/published status

**Ship Criteria:**
- ✅ Core functionality working (Truth Mode, Booking, Leads)
- ✅ Security solid (tenant isolation, RBAC, auth)
- ❌ Business model not enforced (no plans)
- ❌ Core value prop incomplete (no AI drafts)
- ❌ Premium UI inconsistent (missing components)
- ❌ Marketing site needs polish

**Recommendation:** Fix all CRITICAL gaps before launch. HIGH gaps should be addressed but could ship without some if deadline is tight. MEDIUM/LOW can ship as tech debt.

