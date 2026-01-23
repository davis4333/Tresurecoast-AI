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
