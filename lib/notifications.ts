/**
 * Push Notifications Manager
 * Maneja suscripciones y envío de notificaciones
 */

export type NotificationType =
  | 'membership_expiring'
  | 'membership_expired'
  | 'position_liquidation_warning'
  | 'position_liquidated'
  | 'pioneer_rank_changed'
  | 'daily_reward_available'
  | 'referral_signup'
  | 'achievement_unlocked';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  requireInteraction?: boolean;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

class NotificationsManager {
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Verifica si las notificaciones están soportadas
   */
  isSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Obtiene el estado del permiso de notificaciones
   */
  getPermissionState(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Solicita permiso para notificaciones
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('[Notifications] Not supported in this browser');
      return false;
    }

    if (this.getPermissionState() === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Registra el Service Worker
   */
  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers not supported');
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[Notifications] Service Worker registered');
      
      // Esperar a que esté activo
      await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('[Notifications] Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Obtiene la suscripción actual de push
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      return null;
    }

    try {
      return await this.swRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Notifications] Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Suscribe al usuario para recibir push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    // Solicitar permiso primero
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return null;
    }

    // Registrar SW si no está registrado
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      return null;
    }

    try {
      // Verificar si ya existe una suscripción
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        return subscription;
      }

      // Crear nueva suscripción
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('[Notifications] VAPID public key not configured');
        return null;
      }

      subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('[Notifications] Subscribed successfully');
      
      // Enviar la suscripción al backend
      await this.sendSubscriptionToBackend(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[Notifications] Error subscribing:', error);
      return null;
    }
  }

  /**
   * Desuscribe al usuario de las notificaciones
   */
  async unsubscribe(): Promise<boolean> {
    const subscription = await this.getSubscription();
    
    if (!subscription) {
      return true;
    }

    try {
      await subscription.unsubscribe();
      
      // Eliminar del backend
      await this.removeSubscriptionFromBackend(subscription);
      
      console.log('[Notifications] Unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('[Notifications] Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Muestra una notificación local (sin push)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (this.getPermissionState() !== 'granted') {
      return;
    }

    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      return;
    }

    try {
      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: '/badge-72.png',
        data: payload.url || '/',
        requireInteraction: payload.requireInteraction || false,
        tag: payload.tag || 'local',
        vibrate: [200, 100, 200],
        actions: payload.actions,
      });
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error);
    }
  }

  /**
   * Envía la suscripción al backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to backend');
      }
    } catch (error) {
      console.error('[Notifications] Error sending subscription to backend:', error);
    }
  }

  /**
   * Elimina la suscripción del backend
   */
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from backend');
      }
    } catch (error) {
      console.error('[Notifications] Error removing subscription from backend:', error);
    }
  }

  /**
   * Convierte VAPID key de base64 a Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Helpers para notificaciones específicas
   */

  async notifyMembershipExpiring(daysLeft: number): Promise<void> {
    await this.showLocalNotification({
      title: '⚠️ Membresía por Vencer',
      body: `Tu membresía vence en ${daysLeft} días. ¡Renueva ahora!`,
      url: '/profile',
      requireInteraction: true,
      tag: 'membership_expiring',
    });
  }

  async notifyMembershipExpired(): Promise<void> {
    await this.showLocalNotification({
      title: '❌ Membresía Vencida',
      body: 'Tu membresía ha vencido. Renueva para seguir disfrutando los beneficios.',
      url: '/profile',
      requireInteraction: true,
      tag: 'membership_expired',
    });
  }

  async notifyPositionLiquidationWarning(leverage: number): Promise<void> {
    await this.showLocalNotification({
      title: '⚠️ Riesgo de Liquidación',
      body: `Tu posición con ${leverage}x leverage está cerca de liquidación. ¡Actúa ahora!`,
      url: '/trading',
      requireInteraction: true,
      tag: 'liquidation_warning',
    });
  }

  async notifyPioneerRankChanged(newRank: number, change: number): Promise<void> {
    const emoji = change > 0 ? '📈' : '📉';
    await this.showLocalNotification({
      title: `${emoji} Ranking Actualizado`,
      body: `Ahora eres el Pioneer #${newRank} ${change > 0 ? `(+${change})` : `(${change})`}`,
      url: '/pioneers',
      tag: 'pioneer_rank',
    });
  }

  async notifyDailyReward(amount: number): Promise<void> {
    await this.showLocalNotification({
      title: '🎁 Recompensa Diaria',
      body: `¡${amount} NUMA disponibles! Reclama tu recompensa.`,
      url: '/',
      tag: 'daily_reward',
    });
  }

  async notifyAchievementUnlocked(achievement: string): Promise<void> {
    await this.showLocalNotification({
      title: '🏆 Logro Desbloqueado',
      body: `¡Has desbloqueado: ${achievement}!`,
      url: '/profile',
      tag: 'achievement',
    });
  }
}

// Singleton instance
const notifications = new NotificationsManager();

export default notifications;
