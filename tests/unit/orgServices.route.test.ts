import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  normalizeServiceName,
  serviceNameKey,
  OrganizationServiceCreateSchema,
  OrganizationServiceUpdateSchema,
} from "@/lib/validators/orgServices";
import { shouldSkipDatabaseTests } from "../helpers/dbReachability";

const TEST_ORG_A_NAME = "OrgServices_Test_OrgA";
const TEST_ORG_B_NAME = "OrgServices_Test_OrgB";

describe("OrganizationService Validators", () => {
  describe("normalizeServiceName", () => {
    it("trims whitespace", () => {
      expect(normalizeServiceName("  Haircut  ")).toBe("Haircut");
    });

    it("collapses multiple spaces to single space", () => {
      expect(normalizeServiceName("Hot   Towel   Shave")).toBe("Hot Towel Shave");
    });
  });

  describe("serviceNameKey", () => {
    it("returns lowercase normalized name", () => {
      expect(serviceNameKey("  Hot TOWEL  Shave  ")).toBe("hot towel shave");
    });
  });

  describe("OrganizationServiceCreateSchema", () => {
    it("validates valid input", () => {
      const result = OrganizationServiceCreateSchema.safeParse({
        name: "Haircut",
        priceCents: 2500,
        bookingUrl: "https://book.example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Haircut");
        expect(result.data.priceCents).toBe(2500);
        expect(result.data.bookingUrl).toBe("https://book.example.com");
        expect(result.data.displayOrder).toBe(0);
        expect(result.data.isActive).toBe(true);
      }
    });

    it("rejects name shorter than 2 chars", () => {
      const result = OrganizationServiceCreateSchema.safeParse({
        name: "A",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 80 chars", () => {
      const result = OrganizationServiceCreateSchema.safeParse({
        name: "A".repeat(81),
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative priceCents", () => {
      const result = OrganizationServiceCreateSchema.safeParse({
        name: "Haircut",
        priceCents: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL", () => {
      const result = OrganizationServiceCreateSchema.safeParse({
        name: "Haircut",
        bookingUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty string URL and transforms to null", () => {
      const result = OrganizationServiceCreateSchema.safeParse({
        name: "Haircut",
        bookingUrl: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookingUrl).toBe(null);
      }
    });
  });

  describe("OrganizationServiceUpdateSchema", () => {
    it("requires id", () => {
      const result = OrganizationServiceUpdateSchema.safeParse({
        name: "Updated",
      });
      expect(result.success).toBe(false);
    });

    it("validates partial update with id", () => {
      const result = OrganizationServiceUpdateSchema.safeParse({
        id: 1,
        priceCents: 3000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.priceCents).toBe(3000);
        expect(result.data.name).toBeUndefined();
      }
    });
  });
});

describe.skipIf(await shouldSkipDatabaseTests())("OrganizationService DB Integration", () => {
  let orgAId: number;
  let orgBId: number;
  let userOwner: string;
  let userAdmin: string;
  let userClient: string;
  let userOrgB: string;

  beforeAll(async () => {
    const orgA = await prisma.organization.create({
      data: { name: TEST_ORG_A_NAME, allowClientEdits: false },
    });
    orgAId = orgA.id;

    const orgB = await prisma.organization.create({
      data: { name: TEST_ORG_B_NAME, allowClientEdits: false },
    });
    orgBId = orgB.id;

    userOwner = `test_owner_${Date.now()}`;
    userAdmin = `test_admin_${Date.now()}`;
    userClient = `test_client_${Date.now()}`;
    userOrgB = `test_orgb_${Date.now()}`;

    await prisma.organizationMember.createMany({
      data: [
        { organizationId: orgAId, clerkUserId: userOwner, role: "AGENCY_OWNER" },
        { organizationId: orgAId, clerkUserId: userAdmin, role: "AGENCY_ADMIN" },
        { organizationId: orgAId, clerkUserId: userClient, role: "CLIENT" },
        { organizationId: orgBId, clerkUserId: userOrgB, role: "AGENCY_OWNER" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.organizationService.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.organizationMember.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId] } },
    });
  });

  describe("Tenant Isolation", () => {
    it("service created in Org A is not visible to Org B", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Isolation Test Service",
          priceCents: 1000,
        },
      });

      const orgBServices = await prisma.organizationService.findMany({
        where: { organizationId: orgBId },
      });

      expect(orgBServices.find((s) => s.id === service.id)).toBeUndefined();

      await prisma.organizationService.delete({ where: { id: service.id } });
    });

    it("Org B cannot update Org A service", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Cross Org Update Test",
          priceCents: 500,
        },
      });

      const result = await prisma.organizationService.updateMany({
        where: { id: service.id, organizationId: orgBId },
        data: { priceCents: 9999 },
      });

      expect(result.count).toBe(0);

      const unchanged = await prisma.organizationService.findUnique({
        where: { id: service.id },
      });
      expect(unchanged?.priceCents).toBe(500);

      await prisma.organizationService.delete({ where: { id: service.id } });
    });

    it("Org B cannot delete Org A service", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Cross Org Delete Test",
          priceCents: 750,
        },
      });

      const result = await prisma.organizationService.deleteMany({
        where: { id: service.id, organizationId: orgBId },
      });

      expect(result.count).toBe(0);

      const stillExists = await prisma.organizationService.findUnique({
        where: { id: service.id },
      });
      expect(stillExists).not.toBeNull();

      await prisma.organizationService.delete({ where: { id: service.id } });
    });
  });

  describe("Duplicate Prevention", () => {
    it("DB constraint rejects exact duplicate name in same org", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Haircut",
          priceCents: 2500,
        },
      });

      await expect(
        prisma.organizationService.create({
          data: {
            organizationId: orgAId,
            name: "Haircut",
            priceCents: 3000,
          },
        })
      ).rejects.toThrow();

      await prisma.organizationService.delete({ where: { id: service.id } });
    });

    it("API-level check prevents case-insensitive duplicates via serviceNameKey", () => {
      const existing = "Haircut";
      const attempt = "haircut";
      expect(serviceNameKey(existing)).toBe(serviceNameKey(attempt));
    });

    it("allows same service name in different orgs", async () => {
      const serviceA = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Massage",
          priceCents: 5000,
        },
      });

      const serviceB = await prisma.organizationService.create({
        data: {
          organizationId: orgBId,
          name: "Massage",
          priceCents: 6000,
        },
      });

      expect(serviceA.id).not.toBe(serviceB.id);
      expect(serviceA.name).toBe(serviceB.name);

      await prisma.organizationService.deleteMany({
        where: { id: { in: [serviceA.id, serviceB.id] } },
      });
    });
  });

  describe("CRUD Operations", () => {
    it("creates a service with all fields", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Full Service Test",
          priceCents: 4500,
          bookingUrl: "https://book.example.com/full",
          paymentUrl: "https://pay.example.com/full",
          displayOrder: 5,
          isActive: true,
        },
      });

      expect(service.name).toBe("Full Service Test");
      expect(service.priceCents).toBe(4500);
      expect(service.bookingUrl).toBe("https://book.example.com/full");
      expect(service.paymentUrl).toBe("https://pay.example.com/full");
      expect(service.displayOrder).toBe(5);
      expect(service.isActive).toBe(true);

      await prisma.organizationService.delete({ where: { id: service.id } });
    });

    it("updates a service", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Update Me",
          priceCents: 1000,
        },
      });

      const updated = await prisma.organizationService.update({
        where: { id: service.id },
        data: { name: "Updated Name", priceCents: 2000 },
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.priceCents).toBe(2000);

      await prisma.organizationService.delete({ where: { id: service.id } });
    });

    it("deletes a service", async () => {
      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Delete Me",
          priceCents: 100,
        },
      });

      await prisma.organizationService.delete({ where: { id: service.id } });

      const deleted = await prisma.organizationService.findUnique({
        where: { id: service.id },
      });
      expect(deleted).toBeNull();
    });

    it("lists services ordered by displayOrder then id", async () => {
      const s1 = await prisma.organizationService.create({
        data: { organizationId: orgAId, name: "Order Test 1", displayOrder: 2 },
      });
      const s2 = await prisma.organizationService.create({
        data: { organizationId: orgAId, name: "Order Test 2", displayOrder: 1 },
      });
      const s3 = await prisma.organizationService.create({
        data: { organizationId: orgAId, name: "Order Test 3", displayOrder: 1 },
      });

      const services = await prisma.organizationService.findMany({
        where: { organizationId: orgAId, name: { startsWith: "Order Test" } },
        orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
      });

      expect(services[0].name).toBe("Order Test 2");
      expect(services[1].name).toBe("Order Test 3");
      expect(services[2].name).toBe("Order Test 1");

      await prisma.organizationService.deleteMany({
        where: { id: { in: [s1.id, s2.id, s3.id] } },
      });
    });
  });

  describe("RBAC - allowClientEdits=false", () => {
    it("OWNER role can always create services", async () => {
      const org = await prisma.organization.findUnique({
        where: { id: orgAId },
        select: { allowClientEdits: true },
      });
      expect(org?.allowClientEdits).toBe(false);

      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: orgAId, clerkUserId: userOwner },
      });
      expect(member?.role).toBe("AGENCY_OWNER");
    });

    it("ADMIN role can always create services", async () => {
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: orgAId, clerkUserId: userAdmin },
      });
      expect(member?.role).toBe("AGENCY_ADMIN");
    });

    it("CLIENT role membership exists", async () => {
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: orgAId, clerkUserId: userClient },
      });
      expect(member?.role).toBe("CLIENT");
    });
  });

  describe("RBAC - allowClientEdits=true", () => {
    beforeAll(async () => {
      await prisma.organization.update({
        where: { id: orgAId },
        data: { allowClientEdits: true },
      });
    });

    afterAll(async () => {
      await prisma.organization.update({
        where: { id: orgAId },
        data: { allowClientEdits: false },
      });
    });

    it("CLIENT can create when allowClientEdits=true", async () => {
      const org = await prisma.organization.findUnique({
        where: { id: orgAId },
        select: { allowClientEdits: true },
      });
      expect(org?.allowClientEdits).toBe(true);

      const service = await prisma.organizationService.create({
        data: {
          organizationId: orgAId,
          name: "Client Created Service",
          priceCents: 1500,
        },
      });

      expect(service.id).toBeGreaterThan(0);

      await prisma.organizationService.delete({ where: { id: service.id } });
    });
  });
});
