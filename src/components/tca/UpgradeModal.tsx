'use client';

import { X, Check } from 'lucide-react';
import { PLAN_FEATURES, PlanTier } from '@/lib/plans/features';
import { useState } from 'react';
import { useToast } from './TcaToast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: PlanTier;
  recommendedTier?: PlanTier;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentTier = PlanTier.FREE,
  recommendedTier,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(
    recommendedTier || null
  );
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleUpgrade = async (tier: PlanTier) => {
    if (tier === PlanTier.FREE || tier === currentTier) return;

    setLoading(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: tier }),
      });

      const data = await response.json();

      if (data.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        showToast('error', 'Failed to create checkout session. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      showToast('error', 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const tiers: Array<{ tier: PlanTier; highlight?: boolean }> = [
    { tier: PlanTier.STARTER, highlight: recommendedTier === PlanTier.STARTER },
    { tier: PlanTier.PRO, highlight: recommendedTier === PlanTier.PRO },
    { tier: PlanTier.AGENCY, highlight: recommendedTier === PlanTier.AGENCY },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Upgrade Your Plan
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a plan that fits your needs
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(({ tier, highlight }) => {
            const features = PLAN_FEATURES[tier];
            const isCurrentTier = tier === currentTier;
            const price = features.price / 100; // Convert cents to dollars

            return (
              <div
                key={tier}
                className={`rounded-lg border-2 p-6 ${
                  highlight
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700'
                } ${isCurrentTier ? 'opacity-60' : ''}`}
              >
                {highlight && (
                  <div className="bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full inline-block mb-4">
                    Recommended
                  </div>
                )}
                {isCurrentTier && (
                  <div className="bg-gray-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full inline-block mb-4">
                    Current Plan
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {features.name}
                </h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    ${price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {features.conversationsPerMonth.toLocaleString()} conversations/month
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {features.botsLimit} bot{features.botsLimit > 1 ? 's' : ''}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {features.analyticsWindowDays} day analytics
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {features.teamSeatsLimit} team member{features.teamSeatsLimit > 1 ? 's' : ''}
                    </span>
                  </li>
                  {features.whiteLabelEnabled && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        White label branding
                      </span>
                    </li>
                  )}
                  {features.customDomainEnabled && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Custom domain
                      </span>
                    </li>
                  )}
                  {features.prioritySupport && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Priority support
                      </span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={loading || isCurrentTier}
                  className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                    isCurrentTier
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                      : highlight
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white'
                  }`}
                >
                  {loading
                    ? 'Loading...'
                    : isCurrentTier
                    ? 'Current Plan'
                    : `Upgrade to ${features.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Need more? Try Enterprise
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Unlimited conversations, 999 bots, dedicated support, and custom integrations
            </p>
            <a
              href="mailto:sales@treasurecoast.ai?subject=Enterprise Plan Inquiry"
              className="inline-block bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
