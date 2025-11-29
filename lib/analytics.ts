import posthog from 'posthog-js'

// Tipos de eventos que trackearemos
export type AnalyticsEvent =
  // User Events
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'world_id_verified'
  
  // Onboarding Events
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  
  // Trading Events
  | 'position_opened'
  | 'position_closed'
  | 'position_liquidated'
  | 'trade_view_opened'
  
  // Payment Events
  | 'membership_modal_opened'
  | 'membership_selected'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  
  // Pioneer Events
  | 'pioneer_staked'
  | 'pioneer_unstaked'
  | 'pioneer_rank_updated'
  
  // Navigation Events
  | 'tab_changed'
  | 'view_changed'
  
  // Error Events
  | 'error_occurred'
  | 'api_error';

export interface AnalyticsProperties {
  // User properties
  userId?: string;
  walletAddress?: string;
  membershipTier?: 'free' | 'plus' | 'vip';
  
  // Event-specific properties
  [key: string]: any;
}

class Analytics {
  private isInitialized = false;

  /**
   * Inicializa PostHog
   * Solo en producción o cuando se habilita explícitamente
   */
  init() {
    if (this.isInitialized) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    // Solo inicializar si tenemos la key
    if (!posthogKey) {
      console.log('[Analytics] PostHog key not found - analytics disabled');
      return;
    }

    // Inicializar PostHog
    posthog.init(posthogKey, {
      api_host: posthogHost,
      
      // Configuración de privacidad
      autocapture: false, // No capturar clicks automáticamente
      capture_pageview: true, // Capturar page views
      capture_pageleave: true, // Capturar cuando sale de la página
      
      // Persistence
      persistence: 'localStorage',
      
      // Session recording (deshabilitado por defecto)
      disable_session_recording: true,
      
      // Configuración de red
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      },
    });

    this.isInitialized = true;
    console.log('[Analytics] PostHog initialized');
  }

  /**
   * Identifica al usuario actual
   */
  identify(userId: string, properties?: AnalyticsProperties) {
    if (!this.isInitialized) return;

    posthog.identify(userId, {
      ...properties,
      platform: 'world-app',
      app_version: '1.0.0',
    });
  }

  /**
   * Trackea un evento
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.isInitialized) {
      console.log(`[Analytics] ${event}`, properties);
      return;
    }

    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      platform: 'world-app',
    });
  }

  /**
   * Trackea page view manualmente
   */
  pageview(path: string, properties?: AnalyticsProperties) {
    if (!this.isInitialized) return;

    posthog.capture('$pageview', {
      ...properties,
      $current_url: path,
    });
  }

  /**
   * Registra propiedades del usuario que persisten
   */
  setUserProperties(properties: AnalyticsProperties) {
    if (!this.isInitialized) return;

    posthog.people.set(properties);
  }

  /**
   * Incrementa una propiedad numérica del usuario
   */
  incrementUserProperty(property: string, value: number = 1) {
    if (!this.isInitialized) return;

    posthog.people.increment(property, value);
  }

  /**
   * Resetea la sesión (en logout)
   */
  reset() {
    if (!this.isInitialized) return;

    posthog.reset();
  }

  /**
   * Guarda en la base de datos local también
   */
  async saveToDatabase(
    event: AnalyticsEvent,
    properties?: AnalyticsProperties
  ) {
    // Esto se puede usar para guardar eventos críticos en nuestra DB
    // Por ahora solo trackea con PostHog
    this.track(event, properties);
  }

  /**
   * Trackea errores
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Helpers para eventos comunes
   */
  
  // User events
  trackLogin(userId: string, walletAddress: string) {
    this.identify(userId, { walletAddress });
    this.track('user_login', { walletAddress });
  }

  trackLogout() {
    this.track('user_logout');
    this.reset();
  }

  // Onboarding events
  trackOnboardingStarted() {
    this.track('onboarding_started');
  }

  trackOnboardingStep(step: number, stepName: string) {
    this.track('onboarding_step_completed', { step, stepName });
  }

  trackOnboardingCompleted(bonusAmount: number) {
    this.track('onboarding_completed', { bonusAmount });
    this.incrementUserProperty('onboardings_completed');
  }

  trackOnboardingSkipped(step: number) {
    this.track('onboarding_skipped', { step });
  }

  // Trading events
  trackPositionOpened(
    type: 'long' | 'short',
    amount: number,
    leverage: number
  ) {
    this.track('position_opened', { type, amount, leverage });
    this.incrementUserProperty('positions_opened');
  }

  trackPositionClosed(pnl: number, winRate?: number) {
    this.track('position_closed', { pnl, winRate });
    this.incrementUserProperty('positions_closed');
    
    if (pnl > 0) {
      this.incrementUserProperty('winning_trades');
    } else {
      this.incrementUserProperty('losing_trades');
    }
  }

  // Payment events
  trackMembershipPurchase(
    tier: 'plus' | 'vip',
    duration: number,
    amount: number
  ) {
    this.track('payment_completed', { tier, duration, amount });
    this.setUserProperties({ membershipTier: tier });
    this.incrementUserProperty('memberships_purchased');
  }

  // Navigation events
  trackTabChange(from: string, to: string) {
    this.track('tab_changed', { from, to });
  }

  trackViewChange(view: string) {
    this.track('view_changed', { view });
  }
}

// Singleton instance
const analytics = new Analytics();

// Auto-init en cliente
if (typeof window !== 'undefined') {
  analytics.init();
}

export default analytics;
