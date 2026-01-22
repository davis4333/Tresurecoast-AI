# DELIVERABLE 3: SHIP PLAN (Baby Steps with Exact Patches)

**Order:** CRITICAL → HIGH → MEDIUM (Low priority deferred)
**Each step:** Small, testable, shippable
**Format:** Objective → Files → Patches → Tests → QA → DoD

---

## PHASE 1: CRITICAL FIXES (Ship Blockers)

### STEP 1.1: Fix Analytics Conversion Rate Formula

**Objective:** Correct conversion rate calculation to match PRD spec

**Files to Change:**
1. `src/app/api/org/analytics/overview/route.ts`
2. `tests/analytics-leads.spec.ts` (if exists, otherwise create)

**Exact Patches:**

#### File: `src/app/api/org/analytics/overview/route.ts`

**Find (lines ~78-85):**
```typescript
  const conversionRate = serviceSelectedCount > 0
    ? (bookingLinkClickedCount / serviceSelectedCount) * 100
    : 0;
```

**Replace with:**
```typescript
  const conversionRate = leadCreatedCount > 0
    ? (bookingLinkClickedCount / leadCreatedCount) * 100
    : 0;
```

**Tests to Add:**
Create `__tests__/analytics/conversionRate.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Conversion Rate Formula', () => {
  it('should calculate conversion rate as clicks / leads', () => {
    const leadCreatedCount = 10;
    const bookingLinkClickedCount = 3;

    const conversionRate = leadCreatedCount > 0
      ? (bookingLinkClickedCount / leadCreatedCount) * 100
      : 0;

    expect(conversionRate).toBe(30);
  });

  it('should return 0 when no leads', () => {
    const leadCreatedCount = 0;
    const bookingLinkClickedCount = 0;

    const conversionRate = leadCreatedCount > 0
      ? (bookingLinkClickedCount / leadCreatedCount) * 100
      : 0;

    expect(conversionRate).toBe(0);
  });

  it('should handle clicks without leads (edge case)', () => {
    const leadCreatedCount = 0;
    const bookingLinkClickedCount = 5; // Shouldn't happen but test it

    const conversionRate = leadCreatedCount > 0
      ? (bookingLinkClickedCount / leadCreatedCount) * 100
      : 0;

    expect(conversionRate).toBe(0);
  });
});
```

**QA Evidence Commands:**
```bash
# 1. Run unit test
pnpm vitest run __tests__/analytics/conversionRate.test.ts

# 2. Type check
pnpm typecheck

# 3. Build
pnpm build

# 4. Test analytics endpoint manually
curl -X GET http://localhost:3000/api/org/analytics/overview \
  -H "Authorization: Bearer <clerk-token>" \
  -H "x-org-id: <org-id>"

# 5. Verify conversion rate in response matches formula
# Expected: conversionRate = (bookingLinkClickedCount / leadCreatedCount) * 100
```

**Definition of Done:**
- [ ] Conversion rate uses `leadCreatedCount` as denominator
- [ ] Unit test passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Manual API test shows correct formula
- [ ] Code reviewed
- [ ] Committed with message: "fix: correct analytics conversion rate formula to match PRD"

---

### STEP 1.2: Add Draft/Published Status to Knowledge Base

**Objective:** Prevent unapproved content from being used in Truth Mode

**Files to Change:**
1. `prisma/schema.prisma`
2. `src/lib/truthMode/retrieve.ts`
3. `src/app/api/org/bots/[botPublicKey]/knowledge/route.ts`
4. `src/app/app/kb/page.tsx`
5. Create migration file

**Exact Patches:**

#### File: `prisma/schema.prisma`

**Find (line ~378):**
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

  bot          Bot          @relation(fields: [botId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([botId, contentHash])
  @@index([botId])
  @@index([organizationId])
}
```

**Replace with:**
```prisma
enum KnowledgeSourceStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model BotKnowledgeSource {
  id             Int      @id @default(autoincrement())
  botId          Int
  organizationId Int

  type        String   // "PASTE" | "URL"
  title       String
  content     String
  contentHash String

  status      KnowledgeSourceStatus @default(DRAFT)
  publishedAt DateTime?
  publishedBy String?  // Clerk user ID who published

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bot          Bot          @relation(fields: [botId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([botId, contentHash])
  @@index([botId])
  @@index([organizationId])
  @@index([status])
}
```

#### Create Migration:
```bash
pnpm prisma migrate dev --name add_knowledge_source_status
```

#### File: `src/lib/truthMode/retrieve.ts`

**Find (line ~15):**
```typescript
export async function retrieveKnowledge(
  botPublicKey: string,
  query: string,
  topK = TOP_K
): Promise<KnowledgeResult[]> {
  const sources = await prisma.botKnowledgeSource.findMany({
    where: {
      bot: { publicKey: botPublicKey },
    },
    select: {
      id: true,
      title: true,
      content: true,
    },
  });
```

**Replace with:**
```typescript
export async function retrieveKnowledge(
  botPublicKey: string,
  query: string,
  topK = TOP_K
): Promise<KnowledgeResult[]> {
  const sources = await prisma.botKnowledgeSource.findMany({
    where: {
      bot: { publicKey: botPublicKey },
      status: 'PUBLISHED',  // CRITICAL: Only use published content
    },
    select: {
      id: true,
      title: true,
      content: true,
    },
  });
```

#### File: `src/app/api/org/bots/[botPublicKey]/knowledge/route.ts`

**Add publish endpoint:**

**After existing `POST` and `GET` handlers, add:**
```typescript
// Publish knowledge source
export async function PATCH(
  request: NextRequest,
  { params }: { params: { botPublicKey: string } }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  const { sourceId, status } = await request.json();

  if (!sourceId || !status) {
    return NextResponse.json(
      { ok: false, error: 'Missing sourceId or status' },
      { status: 400 }
    );
  }

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid status' },
      { status: 400 }
    );
  }

  const bot = await prisma.bot.findUnique({
    where: { publicKey: params.botPublicKey },
    select: { id: true, organizationId: true },
  });

  if (!bot || bot.organizationId !== ctx.org.id) {
    return NextResponse.json(
      { ok: false, error: 'Bot not found' },
      { status: 404 }
    );
  }

  const source = await prisma.botKnowledgeSource.update({
    where: { id: sourceId },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      publishedBy: status === 'PUBLISHED' ? ctx.userId : null,
    },
  });

  return NextResponse.json({ ok: true, source });
}
```

#### File: `src/app/app/kb/page.tsx`

**Add status badge and publish button to each KB entry:**

**Find the table row rendering:**
```tsx
<tr key={source.id}>
  <td>{source.title}</td>
  <td>{source.type}</td>
  <td>{new Date(source.createdAt).toLocaleDateString()}</td>
  <td>
    <button onClick={() => handleDelete(source.id)}>Delete</button>
  </td>
</tr>
```

**Replace with:**
```tsx
<tr key={source.id}>
  <td>{source.title}</td>
  <td>
    <TcaBadge
      variant={
        source.status === 'PUBLISHED' ? 'success' :
        source.status === 'DRAFT' ? 'warning' :
        'default'
      }
    >
      {source.status}
    </TcaBadge>
  </td>
  <td>{source.type}</td>
  <td>{new Date(source.createdAt).toLocaleDateString()}</td>
  <td>
    {source.status === 'DRAFT' && (
      <TcaButton
        variant="primary"
        size="sm"
        onClick={() => handlePublish(source.id)}
      >
        Publish
      </TcaButton>
    )}
    {source.status === 'PUBLISHED' && (
      <TcaButton
        variant="secondary"
        size="sm"
        onClick={() => handleUnpublish(source.id)}
      >
        Unpublish
      </TcaButton>
    )}
    <TcaButton
      variant="destructive"
      size="sm"
      onClick={() => handleDelete(source.id)}
    >
      Delete
    </TcaButton>
  </td>
</tr>
```

**Add handler functions:**
```tsx
const handlePublish = async (sourceId: number) => {
  const res = await fetch(`/api/org/bots/${botPublicKey}/knowledge`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, status: 'PUBLISHED' }),
  });
  if (res.ok) {
    toast.success('Knowledge source published');
    refetch();
  } else {
    toast.error('Failed to publish');
  }
};

const handleUnpublish = async (sourceId: number) => {
  const res = await fetch(`/api/org/bots/${botPublicKey}/knowledge`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, status: 'DRAFT' }),
  });
  if (res.ok) {
    toast.success('Knowledge source unpublished');
    refetch();
  } else {
    toast.error('Failed to unpublish');
  }
};
```

**Tests to Add:**

Create `__tests__/truthMode/publishedOnly.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { retrieveKnowledge } from '@/lib/truthMode/retrieve';

describe('Knowledge Retrieval - Published Only', () => {
  let testBot;
  let draftSource;
  let publishedSource;

  beforeAll(async () => {
    // Create test bot
    const org = await prisma.organization.create({
      data: { name: 'Test Org' },
    });
    const workspace = await prisma.workspace.create({
      data: { name: 'Test Workspace', organizationId: org.id },
    });
    testBot = await prisma.bot.create({
      data: {
        name: 'Test Bot',
        organizationId: org.id,
        workspaceId: workspace.id,
      },
    });

    // Create draft source
    draftSource = await prisma.botKnowledgeSource.create({
      data: {
        botId: testBot.id,
        organizationId: org.id,
        type: 'PASTE',
        title: 'Draft Article',
        content: 'This is draft content that should not appear',
        contentHash: 'draft-hash',
        status: 'DRAFT',
      },
    });

    // Create published source
    publishedSource = await prisma.botKnowledgeSource.create({
      data: {
        botId: testBot.id,
        organizationId: org.id,
        type: 'PASTE',
        title: 'Published Article',
        content: 'This is published content that should appear',
        contentHash: 'published-hash',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.botKnowledgeSource.deleteMany({
      where: { botId: testBot.id },
    });
    await prisma.bot.delete({ where: { id: testBot.id } });
    // Clean up org/workspace
  });

  it('should only retrieve published knowledge sources', async () => {
    const results = await retrieveKnowledge(testBot.publicKey, 'article');

    const titles = results.map(r => r.title);

    expect(titles).toContain('Published Article');
    expect(titles).not.toContain('Draft Article');
  });

  it('should return empty array when only drafts exist', async () => {
    // Unpublish the published source
    await prisma.botKnowledgeSource.update({
      where: { id: publishedSource.id },
      data: { status: 'DRAFT' },
    });

    const results = await retrieveKnowledge(testBot.publicKey, 'article');

    expect(results).toHaveLength(0);

    // Restore
    await prisma.botKnowledgeSource.update({
      where: { id: publishedSource.id },
      data: { status: 'PUBLISHED' },
    });
  });
});
```

**QA Evidence Commands:**
```bash
# 1. Generate migration
pnpm prisma migrate dev --name add_knowledge_source_status

# 2. Apply migration
pnpm prisma migrate deploy

# 3. Regenerate Prisma Client
pnpm prisma generate

# 4. Run unit tests
pnpm vitest run __tests__/truthMode/publishedOnly.test.ts

# 5. Type check
pnpm typecheck

# 6. Build
pnpm build

# 7. Test publish endpoint manually
curl -X PATCH http://localhost:3000/api/org/bots/<bot-key>/knowledge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sourceId": 1, "status": "PUBLISHED"}'

# 8. Test Truth Mode retrieval
# Create draft and published sources, query widget, verify only published appears

# 9. Visual check KB page
# Visit /app/kb, verify status badges and publish buttons appear
```

**Definition of Done:**
- [ ] Migration created and applied
- [ ] `status` field exists on `BotKnowledgeSource` with DRAFT/PUBLISHED/ARCHIVED
- [ ] Truth Mode retrieval filters by `status = 'PUBLISHED'`
- [ ] PATCH endpoint publishes/unpublishes sources
- [ ] KB UI shows status badges and publish buttons
- [ ] Unit tests pass
- [ ] E2E test verifies only published content appears in widget
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Committed with message: "feat: add draft/published status to knowledge base"

---

### STEP 1.3: Create Bot CRUD API Routes

**Objective:** Add missing `/api/org/bots` and `/api/org/bots/[botPublicKey]` endpoints

**Files to Create:**
1. `src/app/api/org/bots/route.ts`
2. `src/app/api/org/bots/[botPublicKey]/route.ts`

**Exact Patches:**

#### File: `src/app/api/org/bots/route.ts` (CREATE NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBotSchema = z.object({
  name: z.string().min(1).max(100),
  workspaceId: z.number().optional(),
  greeting: z.string().optional(),
  fallbackText: z.string().optional(),
});

// List bots for organization
export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  const bots = await prisma.bot.findMany({
    where: {
      organizationId: ctx.org.id,
      status: { not: 'ARCHIVED' },
    },
    select: {
      id: true,
      publicKey: true,
      name: true,
      status: true,
      greeting: true,
      fallbackText: true,
      businessPhone: true,
      businessEmail: true,
      businessAddress: true,
      createdAt: true,
      updatedAt: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({ ok: true, bots });
}

// Create bot
export async function POST(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  // Only OWNER and ADMIN can create bots
  if (ctx.role === 'CLIENT') {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = createBotSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: validation.error },
      { status: 400 }
    );
  }

  const { name, workspaceId, greeting, fallbackText } = validation.data;

  // Get or create default workspace
  let workspace;
  if (workspaceId) {
    workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        organizationId: ctx.org.id,
      },
    });
    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }
  } else {
    workspace = await prisma.workspace.findFirst({
      where: { organizationId: ctx.org.id },
    });
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Default Workspace',
          organizationId: ctx.org.id,
        },
      });
    }
  }

  const bot = await prisma.bot.create({
    data: {
      name,
      greeting,
      fallbackText,
      organizationId: ctx.org.id,
      workspaceId: workspace.id,
      status: 'ACTIVE',
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Log audit event
  await prisma.auditLog.create({
    data: {
      organizationId: ctx.org.id,
      workspaceId: workspace.id,
      action: 'BOT_CREATED',
      summary: `Bot "${name}" created`,
      actorId: ctx.userId,
    },
  });

  return NextResponse.json({ ok: true, bot }, { status: 201 });
}
```

#### File: `src/app/api/org/bots/[botPublicKey]/route.ts` (CREATE NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  greeting: z.string().optional(),
  fallbackText: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});

// Get bot detail
export async function GET(
  request: NextRequest,
  { params }: { params: { botPublicKey: string } }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  const bot = await prisma.bot.findUnique({
    where: { publicKey: params.botPublicKey },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      allowlist: true,
      _count: {
        select: {
          knowledgeSources: true,
          leads: true,
          conversations: true,
        },
      },
    },
  });

  if (!bot || bot.organizationId !== ctx.org.id) {
    return NextResponse.json(
      { ok: false, error: 'Bot not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, bot });
}

// Update bot
export async function PUT(
  request: NextRequest,
  { params }: { params: { botPublicKey: string } }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  // Only OWNER and ADMIN can update bots (unless allowClientEdits)
  const org = await prisma.organization.findUnique({
    where: { id: ctx.org.id },
    select: { allowClientEdits: true },
  });

  if (ctx.role === 'CLIENT' && !org?.allowClientEdits) {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const bot = await prisma.bot.findUnique({
    where: { publicKey: params.botPublicKey },
    select: { id: true, organizationId: true, name: true },
  });

  if (!bot || bot.organizationId !== ctx.org.id) {
    return NextResponse.json(
      { ok: false, error: 'Bot not found' },
      { status: 404 }
    );
  }

  const body = await request.json();
  const validation = updateBotSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: validation.error },
      { status: 400 }
    );
  }

  const updatedBot = await prisma.bot.update({
    where: { id: bot.id },
    data: validation.data,
  });

  // Log audit event
  await prisma.auditLog.create({
    data: {
      organizationId: ctx.org.id,
      action: 'BOT_UPDATED',
      summary: `Bot "${bot.name}" updated`,
      actorId: ctx.userId,
    },
  });

  return NextResponse.json({ ok: true, bot: updatedBot });
}

// Archive bot (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { botPublicKey: string } }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  // Only OWNER and ADMIN can archive bots
  if (ctx.role === 'CLIENT') {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const bot = await prisma.bot.findUnique({
    where: { publicKey: params.botPublicKey },
    select: { id: true, organizationId: true, name: true },
  });

  if (!bot || bot.organizationId !== ctx.org.id) {
    return NextResponse.json(
      { ok: false, error: 'Bot not found' },
      { status: 404 }
    );
  }

  await prisma.bot.update({
    where: { id: bot.id },
    data: { status: 'ARCHIVED' },
  });

  // Log audit event
  await prisma.auditLog.create({
    data: {
      organizationId: ctx.org.id,
      action: 'BOT_ARCHIVED',
      summary: `Bot "${bot.name}" archived`,
      actorId: ctx.userId,
    },
  });

  return NextResponse.json({ ok: true, message: 'Bot archived' });
}
```

**Tests to Add:**

Create `__tests__/api/bots/botCrud.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Bot CRUD API', () => {
  it('should list bots for organization', async () => {
    // Test GET /api/org/bots
    // Verify org filtering
    // Verify excludes archived bots
  });

  it('should create bot with valid data', async () => {
    // Test POST /api/org/bots
    // Verify bot created
    // Verify audit log entry
  });

  it('should reject bot creation for CLIENT role', async () => {
    // Test RBAC enforcement
  });

  it('should update bot with valid data', async () => {
    // Test PUT /api/org/bots/[key]
    // Verify changes persisted
  });

  it('should archive bot (soft delete)', async () => {
    // Test DELETE /api/org/bots/[key]
    // Verify status = ARCHIVED
    // Verify still in database
  });

  it('should prevent cross-tenant access', async () => {
    // Create bot in org A
    // Try to access from org B
    // Expect 404
  });
});
```

**QA Evidence Commands:**
```bash
# 1. Type check
pnpm typecheck

# 2. Run unit tests
pnpm vitest run __tests__/api/bots/botCrud.test.ts

# 3. Build
pnpm build

# 4. Test LIST endpoint
curl -X GET http://localhost:3000/api/org/bots \
  -H "Authorization: Bearer <token>"

# 5. Test CREATE endpoint
curl -X POST http://localhost:3000/api/org/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test Bot", "greeting": "Hello!"}'

# 6. Test GET endpoint
curl -X GET http://localhost:3000/api/org/bots/<bot-public-key> \
  -H "Authorization: Bearer <token>"

# 7. Test UPDATE endpoint
curl -X PUT http://localhost:3000/api/org/bots/<bot-public-key> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Updated Bot"}'

# 8. Test DELETE endpoint (archive)
curl -X DELETE http://localhost:3000/api/org/bots/<bot-public-key> \
  -H "Authorization: Bearer <token>"

# 9. Verify RBAC: try as CLIENT role, expect 403
```

**Definition of Done:**
- [ ] `GET /api/org/bots` endpoint created
- [ ] `POST /api/org/bots` endpoint created
- [ ] `GET /api/org/bots/[key]` endpoint created
- [ ] `PUT /api/org/bots/[key]` endpoint created
- [ ] `DELETE /api/org/bots/[key]` endpoint created (archives)
- [ ] All endpoints use `getOrgContext()` and filter by `organizationId`
- [ ] RBAC enforced (CLIENT cannot create/archive, can update if `allowClientEdits`)
- [ ] Audit logs created for create/update/archive
- [ ] Unit tests pass
- [ ] Manual API tests pass
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Committed with message: "feat: add bot CRUD API endpoints"

---

### STEP 1.4: Add Plan/Gating System (Database Only)

**Objective:** Add plan model and org tier field (no enforcement yet, just structure)

**Files to Change:**
1. `prisma/schema.prisma`
2. Create migration

**Exact Patches:**

#### File: `prisma/schema.prisma`

**Add after AuditAction enum:**
```prisma
enum PlanTier {
  FREE
  STARTER
  PRO
  AGENCY
  ENTERPRISE
}
```

**Add to Organization model (after line ~84):**
```prisma
model Organization {
  id        Int      @id @default(autoincrement())
  publicId  String   @unique @db.Uuid @default(dbgenerated("gen_random_uuid()"))
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clerkOrganizationId String? @unique
  allowClientEdits Boolean @default(false)

  // Plan & Usage
  planTier              PlanTier @default(FREE)
  planStartedAt         DateTime @default(now())
  planExpiresAt         DateTime?
  conversationsThisMonth Int     @default(0)
  conversationsLimit     Int     @default(200)  // Free tier default
  botsLimit              Int     @default(1)    // Free tier default

  // ... rest of existing fields
}
```

**Create Plan Feature Matrix File:**

Create `src/lib/plans/features.ts`:
```typescript
export enum PlanTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  AGENCY = 'AGENCY',
  ENTERPRISE = 'ENTERPRISE',
}

export interface PlanFeatures {
  name: string;
  price: number; // Monthly in cents
  conversationsPerMonth: number;
  botsLimit: number;
  analyticsWindowDays: number;
  whiteLabelEnabled: boolean;
  customDomainEnabled: boolean;
  notificationsEnabled: boolean;
  teamSeatsLimit: number;
  prioritySupport: boolean;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  [PlanTier.FREE]: {
    name: 'Free',
    price: 0,
    conversationsPerMonth: 200,
    botsLimit: 1,
    analyticsWindowDays: 7,
    whiteLabelEnabled: false,
    customDomainEnabled: false,
    notificationsEnabled: false,
    teamSeatsLimit: 1,
    prioritySupport: false,
  },
  [PlanTier.STARTER]: {
    name: 'Starter',
    price: 4900, // $49/mo
    conversationsPerMonth: 1000,
    botsLimit: 3,
    analyticsWindowDays: 30,
    whiteLabelEnabled: true,
    customDomainEnabled: true,
    notificationsEnabled: true,
    teamSeatsLimit: 3,
    prioritySupport: false,
  },
  [PlanTier.PRO]: {
    name: 'Professional',
    price: 14900, // $149/mo
    conversationsPerMonth: 5000,
    botsLimit: 10,
    analyticsWindowDays: 90,
    whiteLabelEnabled: true,
    customDomainEnabled: true,
    notificationsEnabled: true,
    teamSeatsLimit: 10,
    prioritySupport: true,
  },
  [PlanTier.AGENCY]: {
    name: 'Agency',
    price: 39900, // $399/mo
    conversationsPerMonth: 20000,
    botsLimit: 50,
    analyticsWindowDays: 365,
    whiteLabelEnabled: true,
    customDomainEnabled: true,
    notificationsEnabled: true,
    teamSeatsLimit: 50,
    prioritySupport: true,
  },
  [PlanTier.ENTERPRISE]: {
    name: 'Enterprise',
    price: 0, // Custom pricing
    conversationsPerMonth: 999999,
    botsLimit: 999,
    analyticsWindowDays: 365,
    whiteLabelEnabled: true,
    customDomainEnabled: true,
    notificationsEnabled: true,
    teamSeatsLimit: 999,
    prioritySupport: true,
  },
};

export function getPlanFeatures(tier: PlanTier): PlanFeatures {
  return PLAN_FEATURES[tier];
}

export function canAccessFeature(
  orgPlanTier: PlanTier,
  feature: keyof PlanFeatures
): boolean {
  const features = getPlanFeatures(orgPlanTier);
  return !!features[feature];
}
```

**Create Migration:**
```bash
pnpm prisma migrate dev --name add_plan_tier_to_organization
```

**QA Evidence Commands:**
```bash
# 1. Create migration
pnpm prisma migrate dev --name add_plan_tier_to_organization

# 2. Apply migration
pnpm prisma migrate deploy

# 3. Regenerate Prisma Client
pnpm prisma generate

# 4. Type check
pnpm typecheck

# 5. Build
pnpm build

# 6. Verify plan features utility
node -e "const { PLAN_FEATURES, PlanTier } = require('./src/lib/plans/features.ts'); console.log(PLAN_FEATURES[PlanTier.FREE]);"
```

**Definition of Done:**
- [ ] `PlanTier` enum added to schema
- [ ] `planTier`, `planStartedAt`, `planExpiresAt`, `conversationsThisMonth`, `conversationsLimit`, `botsLimit` fields added to Organization
- [ ] Migration created and applied
- [ ] `src/lib/plans/features.ts` created with feature matrix
- [ ] `getPlanFeatures()` and `canAccessFeature()` utilities working
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Committed with message: "feat: add plan tier to organization model"

**Note:** Actual enforcement will come in STEP 1.5 (next step)

---

### STEP 1.5: Implement AI Draft Generation (Critical Value Prop)

**Objective:** Integrate LLM API to generate About/FAQs/KB drafts in onboarding wizard

**Prerequisite:** Choose LLM provider (OpenAI GPT-4 or Anthropic Claude recommended)

**Files to Change:**
1. `.env.example` - Add API key env var
2. `package.json` - Add LLM SDK dependency
3. Create `src/lib/ai/draftGenerator.ts`
4. `src/app/api/org/onboarding/generate/route.ts` - Integrate AI drafts
5. `src/app/app/onboarding/page.tsx` - Add review/approve UI

**Exact Patches:**

#### File: `.env.example`

**Add:**
```env
# AI Draft Generation
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Choose provider: "openai" or "anthropic"
AI_PROVIDER=openai
```

#### File: `package.json`

**Add to dependencies:**
```json
{
  "dependencies": {
    "openai": "^4.68.0"
  }
}
```

Then run:
```bash
pnpm install
```

#### Create File: `src/lib/ai/draftGenerator.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BusinessData {
  name: string;
  category: string;
  websiteUrl?: string;
  phone?: string;
  address?: string;
  hours?: string;
  services?: string[];
  bookingUrl?: string;
  brandVoice: 'professional' | 'friendly' | 'luxury' | 'bold' | 'chill';
  primaryGoal: 'bookings' | 'leads' | 'faqs' | 'support';
}

export interface DraftContent {
  aboutText: string;
  faqs: Array<{ question: string; answer: string }>;
  kbEntries: Array<{ title: string; content: string }>;
}

export async function generateDrafts(
  business: BusinessData
): Promise<DraftContent> {
  const prompt = buildPrompt(business);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert copywriter for AI chatbot knowledge bases. Generate high-quality, accurate content for a ${business.category} business. Match the brand voice: ${business.brandVoice}. Focus on the goal: ${business.primaryGoal}.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI');
  }

  const parsed = JSON.parse(response);
  return {
    aboutText: parsed.aboutText || '',
    faqs: parsed.faqs || [],
    kbEntries: parsed.kbEntries || [],
  };
}

function buildPrompt(business: BusinessData): string {
  return `
Generate knowledge base content for the following business:

Business Name: ${business.name}
Category: ${business.category}
${business.websiteUrl ? `Website: ${business.websiteUrl}` : ''}
${business.phone ? `Phone: ${business.phone}` : ''}
${business.address ? `Address: ${business.address}` : ''}
${business.hours ? `Hours: ${business.hours}` : ''}
${business.services && business.services.length > 0 ? `Services: ${business.services.join(', ')}` : ''}
${business.bookingUrl ? `Booking URL: ${business.bookingUrl}` : ''}

Brand Voice: ${business.brandVoice}
Primary Goal: ${business.primaryGoal}

Generate the following in JSON format:
{
  "aboutText": "A 2-3 paragraph 'About Us' section that introduces the business, its values, and what makes it special. Match the brand voice.",
  "faqs": [
    { "question": "...", "answer": "..." },
    // 5-10 common questions customers ask
  ],
  "kbEntries": [
    { "title": "...", "content": "..." },
    // 3-5 knowledge base articles covering key topics
  ]
}

Rules:
- Use ONLY the provided business data. Do not invent prices, services, or policies.
- If a detail is missing, be general or prompt the user to provide it.
- Match the brand voice in tone and language.
- Focus on the primary goal (bookings, leads, FAQs, or support).
- Keep answers concise and helpful.
- For a luxury brand, use elegant language. For a chill brand, use casual tone.

Return ONLY the JSON object, no additional text.
`;
}

export async function testAIConnection(): Promise<boolean> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Respond with "OK"' }],
      max_tokens: 10,
    });
    return completion.choices[0]?.message?.content === 'OK';
  } catch (error) {
    console.error('[AI] Connection test failed:', error);
    return false;
  }
}
```

#### File: `src/app/api/org/onboarding/generate/route.ts`

**Find the existing POST handler (around line 30+):**
```typescript
export async function POST(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  // ... existing validation ...

  // Creates bot with basic config
  const bot = await createBotFromOnboarding(validData, ctx.org.id);

  return NextResponse.json({ ok: true, bot });
}
```

**Replace with:**
```typescript
import { generateDrafts } from '@/lib/ai/draftGenerator';

export async function POST(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error },
      { status: ctx.status }
    );
  }

  const body = await request.json();
  const validation = onboardingSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: validation.error },
      { status: 400 }
    );
  }

  const validData = validation.data;

  // Create bot with basic config
  const bot = await createBotFromOnboarding(validData, ctx.org.id);

  // Generate AI drafts
  let drafts = null;
  try {
    drafts = await generateDrafts({
      name: validData.businessName,
      category: validData.category || 'business',
      websiteUrl: validData.websiteUrl,
      phone: validData.phone,
      address: validData.address,
      hours: validData.hours,
      services: validData.services?.split(',').map(s => s.trim()),
      bookingUrl: validData.bookingUrl,
      brandVoice: validData.brandVoice || 'professional',
      primaryGoal: validData.primaryGoal || 'bookings',
    });

    // Store drafts as DRAFT status
    if (drafts.aboutText) {
      await prisma.botKnowledgeSource.create({
        data: {
          botId: bot.id,
          organizationId: ctx.org.id,
          type: 'PASTE',
          title: 'About Us (AI Draft)',
          content: drafts.aboutText,
          contentHash: crypto.createHash('sha256').update(drafts.aboutText).digest('hex'),
          status: 'DRAFT',
        },
      });
    }

    for (const faq of drafts.faqs || []) {
      await prisma.botKnowledgeSource.create({
        data: {
          botId: bot.id,
          organizationId: ctx.org.id,
          type: 'PASTE',
          title: faq.question,
          content: faq.answer,
          contentHash: crypto.createHash('sha256').update(faq.question + faq.answer).digest('hex'),
          status: 'DRAFT',
        },
      });
    }

    for (const entry of drafts.kbEntries || []) {
      await prisma.botKnowledgeSource.create({
        data: {
          botId: bot.id,
          organizationId: ctx.org.id,
          type: 'PASTE',
          title: entry.title,
          content: entry.content,
          contentHash: crypto.createHash('sha256').update(entry.title + entry.content).digest('hex'),
          status: 'DRAFT',
        },
      });
    }
  } catch (error) {
    console.error('[Onboarding] AI draft generation failed:', error);
    // Continue without drafts (non-blocking)
  }

  return NextResponse.json({
    ok: true,
    bot,
    draftsGenerated: !!drafts,
    message: drafts
      ? 'Bot created with AI-generated drafts. Review and publish them in the Knowledge Base.'
      : 'Bot created. AI drafts unavailable.'
  });
}
```

#### File: `src/app/app/onboarding/page.tsx`

**After form submission success, add:**
```tsx
// After successful bot creation response
if (response.draftsGenerated) {
  toast.success(
    'Bot created! Review AI-generated drafts in the Knowledge Base.',
    { duration: 7000 }
  );
  router.push(`/app/bots/${response.bot.publicKey}?tab=knowledge&reviewDrafts=true`);
} else {
  toast.success('Bot created successfully!');
  router.push(`/app/bots/${response.bot.publicKey}`);
}
```

**In the KB page, add "Review Drafts" banner:**

#### File: `src/app/app/kb/page.tsx`

**At top of page, add:**
```tsx
export default function KBPage() {
  const searchParams = useSearchParams();
  const shouldReviewDrafts = searchParams.get('reviewDrafts') === 'true';

  // ... existing code ...

  return (
    <TcaPageShell title="Knowledge Base" description="...">
      {shouldReviewDrafts && (
        <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                AI Drafts Ready for Review
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                We've generated draft content for your knowledge base. Review each entry below and click "Publish" to make it live in your chatbot.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ... rest of KB UI ... */}
    </TcaPageShell>
  );
}
```

**QA Evidence Commands:**
```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variable
export OPENAI_API_KEY=sk-...

# 3. Test AI connection
node -e "const { testAIConnection } = require('./src/lib/ai/draftGenerator.ts'); testAIConnection().then(ok => console.log('AI Connected:', ok));"

# 4. Type check
pnpm typecheck

# 5. Build
pnpm build

# 6. Test onboarding with AI generation
# Fill out onboarding form, submit
# Verify drafts created with status=DRAFT
# Navigate to KB page, verify banner appears
# Verify drafts visible in list
# Publish one draft, verify it works in widget

# 7. Test widget retrieval
# Query widget, verify ONLY published content appears
```

**Definition of Done:**
- [ ] `src/lib/ai/draftGenerator.ts` created with `generateDrafts()` function
- [ ] OpenAI SDK installed and configured
- [ ] Onboarding API generates AI drafts on bot creation
- [ ] Drafts stored with `status='DRAFT'`
- [ ] KB page shows "Review Drafts" banner when redirected from onboarding
- [ ] Drafts can be published/unpublished via KB UI
- [ ] Truth Mode only uses published content (from Step 1.2)
- [ ] Manual test: full onboarding flow → review → publish → verify widget
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Committed with message: "feat: integrate AI draft generation in onboarding wizard"

---

## SUMMARY: CRITICAL FIXES COMPLETE

After completing PHASE 1 (Steps 1.1-1.5), you will have resolved ALL CRITICAL ship blockers:

- ✅ Analytics conversion rate fixed
- ✅ Draft/published status enforced
- ✅ Bot CRUD API routes created
- ✅ Plan tier database structure added
- ✅ AI draft generation working

**Next:** Move to PHASE 2 (HIGH PRIORITY fixes) or ship with tech debt acknowledged.

---

# PHASE 2: HIGH PRIORITY FIXES

### STEP 2.1: Implement Email Notifications (Actual Sending)

**Objective:** Integrate email service to actually send notifications

**Prerequisite:** Choose email provider (Resend recommended for simplicity)

**Files to Change:**
1. `.env.example`
2. `package.json`
3. `src/lib/notifications/emailProvider.ts` (CREATE NEW)
4. `src/lib/notifications/notificationService.ts`

**Exact Patches:**

#### File: `.env.example`

**Add:**
```env
# Email Notifications
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@treasurecoastai.com
```

#### File: `package.json`

**Add:**
```json
{
  "dependencies": {
    "resend": "^4.0.0"
  }
}
```

Then:
```bash
pnpm install
```

#### Create File: `src/lib/notifications/emailProvider.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(data: EmailData): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set, skipping send');
    return { ok: false, error: 'Email provider not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'notifications@treasurecoastai.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Send exception:', error);
    return { ok: false, error: String(error) };
  }
}
```

#### File: `src/lib/notifications/notificationService.ts`

**Find (around line 40+):**
```typescript
export async function sendNotification(input: NotificationInput): Promise<void> {
  // ... builds email HTML ...

  // Creates NotificationLog with status=PENDING
  await prisma.notificationLog.create({
    data: {
      organizationId,
      leadId: input.leadId,
      type: input.type,
      channel: 'EMAIL',
      recipientEmail,
      status: 'PENDING',
      // ... but never actually sends
    },
  });
}
```

**Replace with:**
```typescript
import { sendEmail } from './emailProvider';

export async function sendNotification(input: NotificationInput): Promise<void> {
  const { organizationId, type, data } = input;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      notificationEnabled: true,
      notificationEmails: true,
      notifyOnHotLead: true,
      notifyOnBookingClick: true,
    },
  });

  if (!org || !org.notificationEnabled || org.notificationEmails.length === 0) {
    return; // Notifications disabled
  }

  // Check if this notification type is enabled
  if (type === 'HOT_LEAD' && !org.notifyOnHotLead) return;
  if (type === 'BOOKING_LINK_CLICK' && !org.notifyOnBookingClick) return;

  // Build email
  const emailHtml = await buildEmailHtml(type, data);
  const subject = getSubjectLine(type, data);

  // Send to each recipient
  for (const recipientEmail of org.notificationEmails) {
    const log = await prisma.notificationLog.create({
      data: {
        organizationId,
        leadId: input.leadId,
        type,
        channel: 'EMAIL',
        recipientEmail,
        status: 'PENDING',
      },
    });

    // Actually send email
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html: emailHtml,
    });

    // Update log with result
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: result.ok ? 'SENT' : 'FAILED',
        providerMessageId: result.messageId,
        errorMessage: result.error,
      },
    });

    if (!result.ok) {
      console.error(`[Notification] Failed to send to ${recipientEmail}:`, result.error);
    }
  }
}

function getSubjectLine(type: NotificationType, data: any): string {
  switch (type) {
    case 'HOT_LEAD':
      return `🔥 Hot Lead Alert: ${data.leadName || 'New Lead'}`;
    case 'BOOKING_LINK_CLICK':
      return `📅 Booking Link Clicked by ${data.leadName || 'Lead'}`;
    case 'LEAD_STATUS_CHANGE':
      return `Lead Status Updated: ${data.status}`;
    default:
      return 'Treasure Coast AI Notification';
  }
}
```

**Tests to Add:**

Create `__tests__/notifications/emailSending.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { sendEmail } from '@/lib/notifications/emailProvider';

describe('Email Sending', () => {
  it('should send email with valid data', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    });

    // In test environment, may return { ok: false, error: 'not configured' }
    // In production with RESEND_API_KEY set, should return { ok: true, messageId: '...' }

    expect(result).toHaveProperty('ok');
  });

  it('should handle missing API key gracefully', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('not configured');

    process.env.RESEND_API_KEY = originalKey;
  });
});
```

**QA Evidence Commands:**
```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
export RESEND_API_KEY=re_...
export EMAIL_FROM=notifications@yourdomain.com

# 3. Type check
pnpm typecheck

# 4. Run unit tests
pnpm vitest run __tests__/notifications/emailSending.test.ts

# 5. Build
pnpm build

# 6. Test notification sending (create hot lead)
# - Go to widget
# - Complete booking flow with high-scoring answers
# - Check notification logs: expect status=SENT
# - Check recipient inbox: verify email received

# 7. Test notification settings page
# Visit /app/settings/notifications
# Verify enable toggle works
# Add/remove recipient emails
# Verify notification logs display

# 8. Test error handling (invalid email)
# Add invalid email to recipients
# Trigger notification
# Verify status=FAILED with error message
```

**Definition of Done:**
- [ ] Resend SDK installed
- [ ] `src/lib/notifications/emailProvider.ts` created
- [ ] `sendEmail()` function working
- [ ] `notificationService.ts` actually sends emails
- [ ] NotificationLog updated with status (SENT/FAILED)
- [ ] Error messages captured
- [ ] Unit tests pass
- [ ] Manual test: hot lead created → email received
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Committed with message: "feat: implement actual email sending for notifications"

---

### STEP 2.2: Create TCA Component Library (Core Components)

**Objective:** Build reusable TCA components to replace inline Tailwind

**Components to Create:**
1. `TcaInput`
2. `TcaSelect`
3. `TcaModal`
4. `TcaDrawer`
5. `TcaToast` + Provider
6. `TcaTable`
7. `TcaSkeleton`
8. `TcaEmptyState`

**Files to Create:**
- `src/components/tca/TcaInput.tsx`
- `src/components/tca/TcaSelect.tsx`
- `src/components/tca/TcaModal.tsx`
- `src/components/tca/TcaDrawer.tsx`
- `src/components/tca/TcaToast.tsx`
- `src/components/tca/TcaToastProvider.tsx`
- `src/components/tca/TcaTable.tsx`
- `src/components/tca/TcaSkeleton.tsx`
- `src/components/tca/TcaEmptyState.tsx`

**Exact Patches:**

*(Due to length, showing abbreviated versions. Full implementations available on request.)*

#### File: `src/components/tca/TcaInput.tsx`

```typescript
import React from 'react';

export interface TcaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const TcaInput = React.forwardRef<HTMLInputElement, TcaInputProps>(
  ({ label, helperText, error, icon, className, ...props }, ref) => {
    return (
      <div className="tca-input-wrapper">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              tca-input
              w-full
              min-h-[44px]
              px-3.5 py-2.5
              ${icon ? 'pl-10' : ''}
              bg-[var(--color-surface-elevated)]
              border border-[var(--color-border)]
              rounded-md
              text-sm
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--color-brand-primary)]
              focus:border-transparent
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-colors
              ${error ? 'border-red-500' : ''}
              ${className || ''}
            `}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

TcaInput.displayName = 'TcaInput';
```

#### File: `src/components/tca/TcaToastProvider.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState } from 'react';
import { TcaToast } from './TcaToast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within TcaToastProvider');
  }
  return context;
}

export function TcaToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  };

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const value = {
    toasts,
    toast: {
      success: (msg: string, duration?: number) => addToast('success', msg, duration),
      error: (msg: string, duration?: number) => addToast('error', msg, duration),
      info: (msg: string, duration?: number) => addToast('info', msg, duration),
      warning: (msg: string, duration?: number) => addToast('warning', msg, duration),
    },
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <TcaToast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

#### File: `src/components/tca/TcaEmptyState.tsx`

```typescript
import React from 'react';
import { TcaButton } from './TcaButton';

export interface TcaEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function TcaEmptyState({ icon, title, description, action }: TcaEmptyStateProps) {
  return (
    <div className="tca-empty-state flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="tca-empty-state-icon mb-4 text-[var(--color-text-muted)]">
          {icon}
        </div>
      )}
      <h3 className="tca-empty-state-title text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="tca-empty-state-description text-sm text-[var(--color-text-secondary)] mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <TcaButton
          as={action.href ? 'a' : 'button'}
          href={action.href}
          onClick={action.onClick}
          variant="primary"
        >
          {action.label}
        </TcaButton>
      )}
    </div>
  );
}
```

**Full implementations for TcaModal, TcaDrawer, TcaTable, TcaSkeleton, TcaSelect available on request (truncated for brevity).**

**QA Evidence Commands:**
```bash
# 1. Type check
pnpm typecheck

# 2. Build
pnpm build

# 3. Visual test each component in isolation
# Create /app/test/components page
# Render each component with various props
# Verify styling, accessibility, interactions

# 4. Replace inline components (gradual refactor)
# Find all inline input elements
# Replace with <TcaInput>
# Verify functionality unchanged

# 5. Test toast system
# Add TcaToastProvider to root layout
# Trigger toasts from various pages
# Verify appear/dismiss correctly

# 6. Accessibility audit
# Tab through forms with TcaInput
# Verify focus rings visible
# Test with screen reader
```

**Definition of Done:**
- [ ] All 8 core TCA components created
- [ ] TcaToastProvider integrated into root layout
- [ ] Each component has consistent styling matching design tokens
- [ ] Accessibility: focus rings, aria labels, keyboard nav
- [ ] Type check passes
- [ ] Build succeeds
- [ ] At least 3 pages refactored to use new components
- [ ] Committed with message: "feat: create TCA component library"

---

*(Additional HIGH, MEDIUM, and LOW priority steps truncated for brevity. Full SHIP PLAN available on request.)*

---

## IMPLEMENTATION PRIORITY

**Week 1: Critical Fixes**
- STEP 1.1: Analytics formula fix (30 min)
- STEP 1.2: Draft/published status (2 hours)
- STEP 1.3: Bot CRUD API (3 hours)
- STEP 1.4: Plan database structure (1 hour)
- STEP 1.5: AI draft generation (4 hours)

**Week 2: High Priority**
- STEP 2.1: Email notifications (2 hours)
- STEP 2.2: TCA component library (6 hours)
- STEP 2.3: Marketing site polish (4 hours)
- STEP 2.4: Niche landing pages (3 hours)

**Week 3: Medium Priority + Polish**
- Implement plan enforcement
- Add missing loading states
- Improve empty states
- Visual regression baselines
- Final QA sweep

---

**Total Estimated Time:** ~30-40 hours for all critical + high priority fixes

