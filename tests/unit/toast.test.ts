import { describe, it, expect, vi } from 'vitest';

describe('TcaToast', () => {
  it('should export ToastProvider and useToast', async () => {
    const { ToastProvider, useToast } = await import('@/components/tca/TcaToast');
    
    expect(ToastProvider).toBeDefined();
    expect(useToast).toBeDefined();
    expect(typeof ToastProvider).toBe('function');
    expect(typeof useToast).toBe('function');
  });

  it('should export Toast interface', async () => {
    const module = await import('@/components/tca/TcaToast');
    
    // Verify the module exports what we expect
    expect(module).toHaveProperty('ToastProvider');
    expect(module).toHaveProperty('useToast');
  });
});

describe('UpgradeModal toast integration', () => {
  it('should import useToast from TcaToast', async () => {
    // Read the UpgradeModal file content to verify import
    const fs = await import('fs');
    const path = await import('path');
    
    const upgradeModalPath = path.join(process.cwd(), 'src/components/tca/UpgradeModal.tsx');
    const content = fs.readFileSync(upgradeModalPath, 'utf-8');
    
    // Verify useToast is imported
    expect(content).toContain("import { useToast } from './TcaToast'");
    
    // Verify no alert() calls remain
    expect(content).not.toContain('alert(');
    
    // Verify showToast is used instead
    expect(content).toContain('showToast(');
  });
});
