import { vi } from "vitest";
import type { OrgContextResult } from "@/lib/auth/getOrgContext";

export function mockOrgContextSuccess(
  orgId = 1,
  role: "AGENCY_OWNER" | "AGENCY_ADMIN" | "CLIENT" = "AGENCY_OWNER"
): () => Promise<OrgContextResult> {
  return vi.fn().mockResolvedValue({
    ok: true,
    org: { id: orgId, name: "Test Org", clerkOrganizationId: "org_test123", customDomain: null },
    role,
    userId: "test-user-123",
  });
}
