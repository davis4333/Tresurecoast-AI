import { describe, it, expect } from 'vitest';
import { PlanTier, PLAN_FEATURES, getPlanFeatures, canAccessFeature } from '@/lib/plans/features';

/**
 * Plan Features Unit Tests
 *
 * These tests verify the plan tier feature matrix and utility functions
 * for the FREE/PAID tier system. No database required.
 */

describe('Plan Features - Feature Matrix', () => {
  it('should have all plan tiers defined', () => {
    expect(PLAN_FEATURES).toHaveProperty(PlanTier.FREE);
    expect(PLAN_FEATURES).toHaveProperty(PlanTier.STARTER);
    expect(PLAN_FEATURES).toHaveProperty(PlanTier.PRO);
    expect(PLAN_FEATURES).toHaveProperty(PlanTier.AGENCY);
    expect(PLAN_FEATURES).toHaveProperty(PlanTier.ENTERPRISE);
  });

  it('should have FREE tier with 200 conversations and 1 bot', () => {
    const free = PLAN_FEATURES[PlanTier.FREE];

    expect(free.name).toBe('Free');
    expect(free.price).toBe(0);
    expect(free.conversationsPerMonth).toBe(200);
    expect(free.botsLimit).toBe(1);
    expect(free.analyticsWindowDays).toBe(7);
    expect(free.whiteLabelEnabled).toBe(false);
    expect(free.customDomainEnabled).toBe(false);
    expect(free.notificationsEnabled).toBe(false);
    expect(free.teamSeatsLimit).toBe(1);
    expect(free.prioritySupport).toBe(false);
  });

  it('should have STARTER tier with 1000 conversations and 3 bots', () => {
    const starter = PLAN_FEATURES[PlanTier.STARTER];

    expect(starter.name).toBe('Starter');
    expect(starter.price).toBe(4900); // $49/mo
    expect(starter.conversationsPerMonth).toBe(1000);
    expect(starter.botsLimit).toBe(3);
    expect(starter.analyticsWindowDays).toBe(30);
    expect(starter.whiteLabelEnabled).toBe(true);
    expect(starter.customDomainEnabled).toBe(true);
    expect(starter.notificationsEnabled).toBe(true);
    expect(starter.teamSeatsLimit).toBe(3);
    expect(starter.prioritySupport).toBe(false);
  });

  it('should have PRO tier with 5000 conversations and priority support', () => {
    const pro = PLAN_FEATURES[PlanTier.PRO];

    expect(pro.name).toBe('Professional');
    expect(pro.price).toBe(14900); // $149/mo
    expect(pro.conversationsPerMonth).toBe(5000);
    expect(pro.botsLimit).toBe(10);
    expect(pro.analyticsWindowDays).toBe(90);
    expect(pro.prioritySupport).toBe(true);
  });

  it('should have AGENCY tier with 20000 conversations and 50 bots', () => {
    const agency = PLAN_FEATURES[PlanTier.AGENCY];

    expect(agency.name).toBe('Agency');
    expect(agency.price).toBe(39900); // $399/mo
    expect(agency.conversationsPerMonth).toBe(20000);
    expect(agency.botsLimit).toBe(50);
    expect(agency.analyticsWindowDays).toBe(365);
    expect(agency.teamSeatsLimit).toBe(50);
  });

  it('should have ENTERPRISE tier with unlimited resources', () => {
    const enterprise = PLAN_FEATURES[PlanTier.ENTERPRISE];

    expect(enterprise.name).toBe('Enterprise');
    expect(enterprise.price).toBe(0); // Custom pricing
    expect(enterprise.conversationsPerMonth).toBe(999999);
    expect(enterprise.botsLimit).toBe(999);
    expect(enterprise.teamSeatsLimit).toBe(999);
  });

  it('should have increasing conversation limits across tiers', () => {
    const tiers = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PRO, PlanTier.AGENCY];
    const limits = tiers.map(tier => PLAN_FEATURES[tier].conversationsPerMonth);

    // Verify each tier has more conversations than the previous
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i]).toBeGreaterThan(limits[i - 1]!);
    }
  });

  it('should have increasing bot limits across tiers', () => {
    const tiers = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PRO, PlanTier.AGENCY];
    const limits = tiers.map(tier => PLAN_FEATURES[tier].botsLimit);

    // Verify each tier has more bots than the previous
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i]).toBeGreaterThan(limits[i - 1]!);
    }
  });

  it('should enable premium features only for paid tiers', () => {
    // FREE tier should have all premium features disabled
    expect(PLAN_FEATURES[PlanTier.FREE].whiteLabelEnabled).toBe(false);
    expect(PLAN_FEATURES[PlanTier.FREE].customDomainEnabled).toBe(false);
    expect(PLAN_FEATURES[PlanTier.FREE].notificationsEnabled).toBe(false);

    // STARTER and above should have premium features enabled
    const paidTiers = [PlanTier.STARTER, PlanTier.PRO, PlanTier.AGENCY, PlanTier.ENTERPRISE];
    for (const tier of paidTiers) {
      expect(PLAN_FEATURES[tier].whiteLabelEnabled).toBe(true);
      expect(PLAN_FEATURES[tier].customDomainEnabled).toBe(true);
      expect(PLAN_FEATURES[tier].notificationsEnabled).toBe(true);
    }
  });

  it('should enable priority support only for PRO and above', () => {
    // FREE and STARTER should not have priority support
    expect(PLAN_FEATURES[PlanTier.FREE].prioritySupport).toBe(false);
    expect(PLAN_FEATURES[PlanTier.STARTER].prioritySupport).toBe(false);

    // PRO, AGENCY, ENTERPRISE should have priority support
    expect(PLAN_FEATURES[PlanTier.PRO].prioritySupport).toBe(true);
    expect(PLAN_FEATURES[PlanTier.AGENCY].prioritySupport).toBe(true);
    expect(PLAN_FEATURES[PlanTier.ENTERPRISE].prioritySupport).toBe(true);
  });
});

describe('Plan Features - getPlanFeatures()', () => {
  it('should return correct features for FREE tier', () => {
    const features = getPlanFeatures(PlanTier.FREE);

    expect(features.name).toBe('Free');
    expect(features.conversationsPerMonth).toBe(200);
    expect(features.botsLimit).toBe(1);
  });

  it('should return correct features for STARTER tier', () => {
    const features = getPlanFeatures(PlanTier.STARTER);

    expect(features.name).toBe('Starter');
    expect(features.conversationsPerMonth).toBe(1000);
    expect(features.botsLimit).toBe(3);
  });

  it('should return correct features for PRO tier', () => {
    const features = getPlanFeatures(PlanTier.PRO);

    expect(features.name).toBe('Professional');
    expect(features.conversationsPerMonth).toBe(5000);
    expect(features.botsLimit).toBe(10);
  });

  it('should return correct features for AGENCY tier', () => {
    const features = getPlanFeatures(PlanTier.AGENCY);

    expect(features.name).toBe('Agency');
    expect(features.conversationsPerMonth).toBe(20000);
    expect(features.botsLimit).toBe(50);
  });

  it('should return correct features for ENTERPRISE tier', () => {
    const features = getPlanFeatures(PlanTier.ENTERPRISE);

    expect(features.name).toBe('Enterprise');
    expect(features.conversationsPerMonth).toBe(999999);
    expect(features.botsLimit).toBe(999);
  });
});

describe('Plan Features - canAccessFeature()', () => {
  it('should deny white label access for FREE tier', () => {
    const hasAccess = canAccessFeature(PlanTier.FREE, 'whiteLabelEnabled');
    expect(hasAccess).toBe(false);
  });

  it('should allow white label access for STARTER tier', () => {
    const hasAccess = canAccessFeature(PlanTier.STARTER, 'whiteLabelEnabled');
    expect(hasAccess).toBe(true);
  });

  it('should deny custom domain for FREE tier', () => {
    const hasAccess = canAccessFeature(PlanTier.FREE, 'customDomainEnabled');
    expect(hasAccess).toBe(false);
  });

  it('should allow custom domain for STARTER tier', () => {
    const hasAccess = canAccessFeature(PlanTier.STARTER, 'customDomainEnabled');
    expect(hasAccess).toBe(true);
  });

  it('should deny priority support for FREE tier', () => {
    const hasAccess = canAccessFeature(PlanTier.FREE, 'prioritySupport');
    expect(hasAccess).toBe(false);
  });

  it('should deny priority support for STARTER tier', () => {
    const hasAccess = canAccessFeature(PlanTier.STARTER, 'prioritySupport');
    expect(hasAccess).toBe(false);
  });

  it('should allow priority support for PRO tier', () => {
    const hasAccess = canAccessFeature(PlanTier.PRO, 'prioritySupport');
    expect(hasAccess).toBe(true);
  });

  it('should check numeric features correctly', () => {
    // conversationsPerMonth is a number, so it should be truthy (200 > 0)
    const hasConversations = canAccessFeature(PlanTier.FREE, 'conversationsPerMonth');
    expect(hasConversations).toBe(true);
  });
});

describe('Plan Features - Usage Limits', () => {
  it('should define conversation limits per tier', () => {
    expect(getPlanFeatures(PlanTier.FREE).conversationsPerMonth).toBe(200);
    expect(getPlanFeatures(PlanTier.STARTER).conversationsPerMonth).toBe(1000);
    expect(getPlanFeatures(PlanTier.PRO).conversationsPerMonth).toBe(5000);
    expect(getPlanFeatures(PlanTier.AGENCY).conversationsPerMonth).toBe(20000);
    expect(getPlanFeatures(PlanTier.ENTERPRISE).conversationsPerMonth).toBe(999999);
  });

  it('should define bot limits per tier', () => {
    expect(getPlanFeatures(PlanTier.FREE).botsLimit).toBe(1);
    expect(getPlanFeatures(PlanTier.STARTER).botsLimit).toBe(3);
    expect(getPlanFeatures(PlanTier.PRO).botsLimit).toBe(10);
    expect(getPlanFeatures(PlanTier.AGENCY).botsLimit).toBe(50);
    expect(getPlanFeatures(PlanTier.ENTERPRISE).botsLimit).toBe(999);
  });

  it('should define team seat limits per tier', () => {
    expect(getPlanFeatures(PlanTier.FREE).teamSeatsLimit).toBe(1);
    expect(getPlanFeatures(PlanTier.STARTER).teamSeatsLimit).toBe(3);
    expect(getPlanFeatures(PlanTier.PRO).teamSeatsLimit).toBe(10);
    expect(getPlanFeatures(PlanTier.AGENCY).teamSeatsLimit).toBe(50);
    expect(getPlanFeatures(PlanTier.ENTERPRISE).teamSeatsLimit).toBe(999);
  });

  it('should define analytics window per tier', () => {
    expect(getPlanFeatures(PlanTier.FREE).analyticsWindowDays).toBe(7);
    expect(getPlanFeatures(PlanTier.STARTER).analyticsWindowDays).toBe(30);
    expect(getPlanFeatures(PlanTier.PRO).analyticsWindowDays).toBe(90);
    expect(getPlanFeatures(PlanTier.AGENCY).analyticsWindowDays).toBe(365);
    expect(getPlanFeatures(PlanTier.ENTERPRISE).analyticsWindowDays).toBe(365);
  });
});
