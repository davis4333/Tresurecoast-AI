import { describe, it, expect } from 'vitest';

describe('Analytics Conversion Rate Formula', () => {
  /**
   * PRD Requirement: "Conversion rate = booking clicks / leads created"
   * Formula: (linkClicked / leadCreated) × 100
   */

  it('should calculate conversion rate as (clicks / leads) × 100', () => {
    const leadCreated = 10;
    const linkClicked = 3;

    const conversionRate = leadCreated > 0
      ? Math.round((linkClicked / leadCreated) * 10000) / 100
      : 0;

    expect(conversionRate).toBe(30);
  });

  it('should return 0 when no leads created', () => {
    const leadCreated = 0;
    const linkClicked = 0;

    const conversionRate = leadCreated > 0
      ? Math.round((linkClicked / leadCreated) * 10000) / 100
      : 0;

    expect(conversionRate).toBe(0);
  });

  it('should handle clicks without leads (edge case)', () => {
    const leadCreated = 0;
    const linkClicked = 5; // Shouldn't happen but test it

    const conversionRate = leadCreated > 0
      ? Math.round((linkClicked / leadCreated) * 10000) / 100
      : 0;

    expect(conversionRate).toBe(0); // Safe: returns 0, not Infinity
  });

  it('should round correctly to 2 decimal places', () => {
    const leadCreated = 3;
    const linkClicked = 1;

    const conversionRate = leadCreated > 0
      ? Math.round((linkClicked / leadCreated) * 10000) / 100
      : 0;

    expect(conversionRate).toBe(33.33);
  });

  it('should handle 100% conversion', () => {
    const leadCreated = 10;
    const linkClicked = 10;

    const conversionRate = leadCreated > 0
      ? Math.round((linkClicked / leadCreated) * 10000) / 100
      : 0;

    expect(conversionRate).toBe(100);
  });

  it('should handle >100% conversion (clicks > leads due to multiple clicks)', () => {
    const leadCreated = 10;
    const linkClicked = 15; // Some leads clicked multiple times

    const conversionRate = leadCreated > 0
      ? Math.round((linkClicked / leadCreated) * 10000) / 100
      : 0;

    expect(conversionRate).toBe(150);
  });
});
