import { useEffect } from 'react';
import analytics from '@/lib/analytics';
import { useAppStore } from '@/lib/store';

/**
 * Hook para trackear analytics automáticamente
 */
export function useAnalytics() {
  const user = useAppStore((state) => state.user);

  // Identificar usuario cuando hace login
  useEffect(() => {
    if (user) {
      analytics.identify(user.id.toString(), {
        walletAddress: user.walletAddress,
        membershipTier: user.membershipTier,
        balanceNuma: user.balanceNuma,
        balanceWld: user.balanceWld,
      });
    }
  }, [user]);

  return {
    // User events
    trackLogin: (userId: string, walletAddress: string) => {
      analytics.trackLogin(userId, walletAddress);
    },
    
    trackLogout: () => {
      analytics.trackLogout();
    },

    // Onboarding events
    trackOnboardingStarted: () => {
      analytics.trackOnboardingStarted();
    },

    trackOnboardingStep: (step: number, stepName: string) => {
      analytics.trackOnboardingStep(step, stepName);
    },

    trackOnboardingCompleted: (bonusAmount: number) => {
      analytics.trackOnboardingCompleted(bonusAmount);
    },

    trackOnboardingSkipped: (step: number) => {
      analytics.trackOnboardingSkipped(step);
    },

    // Trading events
    trackPositionOpened: (type: 'long' | 'short', amount: number, leverage: number) => {
      analytics.trackPositionOpened(type, amount, leverage);
    },

    trackPositionClosed: (pnl: number, winRate?: number) => {
      analytics.trackPositionClosed(pnl, winRate);
    },

    // Payment events
    trackMembershipPurchase: (tier: 'plus' | 'vip', duration: number, amount: number) => {
      analytics.trackMembershipPurchase(tier, duration, amount);
    },

    trackPaymentFailed: (error: string) => {
      analytics.track('payment_failed', { error });
    },

    // Navigation events
    trackTabChange: (from: string, to: string) => {
      analytics.trackTabChange(from, to);
    },

    trackViewChange: (view: string) => {
      analytics.trackViewChange(view);
    },

    // Generic track
    track: (event: string, properties?: Record<string, any>) => {
      analytics.track(event as any, properties);
    },

    // Error tracking
    trackError: (error: Error, context?: Record<string, any>) => {
      analytics.trackError(error, context);
    },
  };
}
