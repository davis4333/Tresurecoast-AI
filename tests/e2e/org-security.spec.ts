import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Org Security E2E - Step 27", () => {
  const TEST_ORG_NAME = "Security Test Org";
  const OWNER_USER_ID = "e2e_security_owner";
  const CLIENT_USER_ID = "e2e_security_client";
  let orgId: number;

  test.beforeAll(async () => {
    let org = await prisma.organization.findFirst({
      where: { name: TEST_ORG_NAME },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: { name: TEST_ORG_NAME },
      });
    }
    orgId = org.id;

    await prisma.organizationMember.upsert({
      where: { organizationId_clerkUserId: { organizationId: orgId, clerkUserId: OWNER_USER_ID } },
      update: { role: "AGENCY_OWNER" },
      create: { organizationId: orgId, clerkUserId: OWNER_USER_ID, role: "AGENCY_OWNER" },
    });

    await prisma.organizationMember.upsert({
      where: { organizationId_clerkUserId: { organizationId: orgId, clerkUserId: CLIENT_USER_ID } },
      update: { role: "CLIENT" },
      create: { organizationId: orgId, clerkUserId: CLIENT_USER_ID, role: "CLIENT" },
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        customDomain: "e2e-security-test.example.com",
        domainVerificationToken: "test-token-abc123",
        customDomainStatus: "pending",
      },
    });
  });

  test.afterAll(async () => {
    await prisma.organizationMember.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.organization.delete({
      where: { id: orgId },
    });
  });

  test("CLIENT cannot see verification token in custom-domain response", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/org/custom-domain`, {
      headers: {
        "X-Test-User-Id": CLIENT_USER_ID,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.domain.customDomain).toBe("e2e-security-test.example.com");
    expect(data.domain.verificationToken).toBeNull();
  });

  test("CLIENT gets 403 on admin-only endpoints", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const putResponse = await request.put(`${baseURL}/api/org/custom-domain`, {
      headers: {
        "X-Test-User-Id": CLIENT_USER_ID,
        "Content-Type": "application/json",
      },
      data: {
        customDomain: "should-not-work.example.com",
      },
    });

    expect(putResponse.status()).toBe(403);
    const putData = await putResponse.json();
    expect(putData.ok).toBe(false);
    expect(putData.error).toBe("forbidden");

    const verifyResponse = await request.post(`${baseURL}/api/org/custom-domain/verify`, {
      headers: {
        "X-Test-User-Id": CLIENT_USER_ID,
      },
    });

    expect(verifyResponse.status()).toBe(403);
    const verifyData = await verifyResponse.json();
    expect(verifyData.ok).toBe(false);
    expect(verifyData.error).toBe("forbidden");
  });

  test("OWNER can see verification token", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/org/custom-domain`, {
      headers: {
        "X-Test-User-Id": OWNER_USER_ID,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.domain.customDomain).toBe("e2e-security-test.example.com");
    expect(data.domain.verificationToken).toBe("test-token-abc123");
  });
});
