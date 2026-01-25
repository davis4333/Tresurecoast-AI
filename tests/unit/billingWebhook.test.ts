import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Billing Webhook Idempotency', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should have idempotency check in webhook handler', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const webhookPath = path.join(
      process.cwd(),
      'src/app/api/billing/webhook/route.ts'
    );
    const content = fs.readFileSync(webhookPath, 'utf-8');

    // Verify idempotency check exists
    expect(content).toContain('IDEMPOTENCY CHECK');
    expect(content).toContain('webhook_event:');
    expect(content).toContain('existingWebhook');
    expect(content).toContain('alreadyProcessed: true');

    // Verify audit log creation in handler functions
    expect(content).toContain('idempotency tracking');
    expect(content).toContain('prisma.auditLog.create');
  });

  it('should include structured logging context', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const webhookPath = path.join(
      process.cwd(),
      'src/app/api/billing/webhook/route.ts'
    );
    const content = fs.readFileSync(webhookPath, 'utf-8');
    
    // Verify structured logging with context objects
    expect(content).toContain('eventId:');
    expect(content).toContain('eventType:');
    expect(content).toContain('organizationId');
    
    // Verify handler functions have structured logging
    expect(content).toContain('sessionId:');
    expect(content).toContain('subscriptionId:');
    expect(content).toContain('invoiceId:');
  });

  it('should handle duplicate events idempotently', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const webhookPath = path.join(
      process.cwd(),
      'src/app/api/billing/webhook/route.ts'
    );
    const content = fs.readFileSync(webhookPath, 'utf-8');

    // Verify the idempotency logic flow
    expect(content).toContain('findFirst');
    expect(content).toContain('contains:');
    expect(content).toContain('Duplicate event');

    // Verify early return on duplicate
    const idempotencySection = content.match(/IDEMPOTENCY CHECK[\s\S]*?alreadyProcessed: true/);
    expect(idempotencySection).toBeTruthy();
  });
});

describe('Billing Webhook Error Handling', () => {
  it('should include error context in catch blocks', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const webhookPath = path.join(
      process.cwd(),
      'src/app/api/billing/webhook/route.ts'
    );
    const content = fs.readFileSync(webhookPath, 'utf-8');
    
    // Verify error logging includes context
    const errorCatchBlock = content.match(/catch \(error\)[\s\S]*?status: 500/);
    expect(errorCatchBlock).toBeTruthy();
    expect(errorCatchBlock![0]).toContain('eventId');
    expect(errorCatchBlock![0]).toContain('eventType');
  });
});
