import { useState, useEffect } from 'react';
import notifications from '@/lib/notifications';

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar soporte
    const supported = notifications.isSupported();
    setIsSupported(supported);

    if (supported) {
      // Verificar permiso actual
      setPermission(notifications.getPermissionState());

      // Verificar si ya está suscrito
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    const subscription = await notifications.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notifications.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      return granted;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const subscription = await notifications.subscribe();
      setIsSubscribed(!!subscription);
      return !!subscription;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await notifications.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = async (title: string, body: string, url?: string) => {
    await notifications.showLocalNotification({
      title,
      body,
      url,
    });
  };

  return {
    // State
    isSupported,
    permission,
    isSubscribed,
    isLoading,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,

    // Helpers para notificaciones específicas
    notifyMembershipExpiring: notifications.notifyMembershipExpiring.bind(notifications),
    notifyMembershipExpired: notifications.notifyMembershipExpired.bind(notifications),
    notifyPositionLiquidationWarning: notifications.notifyPositionLiquidationWarning.bind(notifications),
    notifyPioneerRankChanged: notifications.notifyPioneerRankChanged.bind(notifications),
    notifyDailyReward: notifications.notifyDailyReward.bind(notifications),
    notifyAchievementUnlocked: notifications.notifyAchievementUnlocked.bind(notifications),
  };
}
