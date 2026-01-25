'use client';

import { useEffect, useState } from 'react';
import { UsageMeter } from '@/components/tca/UsageMeter';
import { UpgradeModal } from '@/components/tca/UpgradeModal';
import { PLAN_FEATURES, PlanTier } from '@/lib/plans/features';

interface DashboardStats {
  bots: { total: number; limit: number; usagePercent: number };
  conversations: { total: number; thisMonth: number; limit: number; usagePercent: number };
  leads: { total: number; hot: number };
  plan: {
    tier: PlanTier;
    shouldUpgrade: boolean;
    recommendedTier: PlanTier | null;
    upgradeReason: string;
  };
}

export default function BillingPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/org/dashboard/stats');
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = stats ? PLAN_FEATURES[stats.plan.tier] : null;

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Billing & Usage
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your subscription and track your usage
        </p>
      </div>

      {/* Current Plan */}
      {currentPlan && stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Current Plan: {currentPlan.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentPlan.price > 0
                  ? `$${(currentPlan.price / 100).toFixed(0)}/month`
                  : 'Free forever'}
              </p>
            </div>
            <div className="flex gap-3">
              {stats.plan.tier !== PlanTier.FREE && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
              {stats.plan.tier !== PlanTier.ENTERPRISE && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
                >
                  {stats.plan.tier === PlanTier.FREE ? 'Upgrade' : 'Change Plan'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conversations/month
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentPlan.conversationsPerMonth.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bots
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentPlan.botsLimit}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analytics
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentPlan.analyticsWindowDays} days
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Team members
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentPlan.teamSeatsLimit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Recommendation */}
      {stats?.plan.shouldUpgrade && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Upgrade Recommended
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            {stats.plan.upgradeReason}
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            View Plans
          </button>
        </div>
      )}

      {/* Usage Meters */}
      {stats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current Usage
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <UsageMeter
              label="Bots"
              current={stats.bots.total}
              limit={stats.bots.limit}
              usagePercent={stats.bots.usagePercent}
              unit="bots"
              showUpgradeButton
              onUpgrade={() => setShowUpgradeModal(true)}
            />
            <UsageMeter
              label="Conversations This Month"
              current={stats.conversations.thisMonth}
              limit={stats.conversations.limit}
              usagePercent={stats.conversations.usagePercent}
              unit="conversations"
              showUpgradeButton
              onUpgrade={() => setShowUpgradeModal(true)}
            />
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {stats && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentTier={stats.plan.tier}
          recommendedTier={stats.plan.recommendedTier || undefined}
        />
      )}
    </div>
  );
}
