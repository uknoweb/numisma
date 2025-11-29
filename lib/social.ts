/**
 * Social Sharing Utilities
 * Funciones para compartir en redes sociales
 */

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  image?: string;
}

export type SharePlatform = 'twitter' | 'telegram' | 'whatsapp' | 'native';

/**
 * Comparte contenido usando Web Share API o fallback
 */
export async function shareContent(data: ShareData, platform: SharePlatform = 'native'): Promise<boolean> {
  // Intentar usar Web Share API nativa
  if (platform === 'native' && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Usuario canceló, no es un error
        return false;
      }
      console.error('Error sharing:', error);
      return false;
    }
  }

  // Fallback a plataformas específicas
  const shareUrl = getShareUrl(data, platform);
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    return true;
  }

  return false;
}

/**
 * Genera URL de compartir para cada plataforma
 */
function getShareUrl(data: ShareData, platform: SharePlatform): string | null {
  const encodedText = encodeURIComponent(data.text);
  const encodedUrl = data.url ? encodeURIComponent(data.url) : '';

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    
    default:
      return null;
  }
}

/**
 * Templates de mensajes para compartir
 */
export const SHARE_TEMPLATES = {
  position_win: (profit: number, asset: string, leverage: number) => ({
    title: '¡Gané en Numisma! 🎯',
    text: `¡Acabo de ganar ${profit.toLocaleString()} NUMA en una operación de ${asset} con ${leverage}x leverage! 💰\n\n¿Quieres tradear también? Únete a Numisma:`,
    url: window.location.origin,
  }),

  milestone_reached: (milestone: string, value: number) => ({
    title: '¡Nuevo Milestone! 🏆',
    text: `¡Alcancé ${milestone} en Numisma con ${value.toLocaleString()}! 🎉\n\nÚnete y compite conmigo:`,
    url: window.location.origin,
  }),

  achievement_unlocked: (achievement: string) => ({
    title: '¡Logro Desbloqueado! ✨',
    text: `Acabo de desbloquear "${achievement}" en Numisma! 🏅\n\n¿Puedes superarlo? Únete:`,
    url: window.location.origin,
  }),

  pioneer_rank: (rank: number) => ({
    title: '¡Soy Pioneer! 🚀',
    text: `¡Soy Pioneer #${rank} en Numisma! 👑\n\nÚnete a la revolución del trading:`,
    url: window.location.origin,
  }),

  referral: (code: string) => ({
    title: 'Únete a Numisma 🎁',
    text: `¡Tradea cripto con apalancamiento directo desde World App!\n\nÚsame mi código ${code} y recibe 300 NUMA gratis al registrarte 💎`,
    url: `${window.location.origin}?ref=${code}`,
  }),

  general_invite: () => ({
    title: '¡Descubre Numisma! 🚀',
    text: `Tradea BTC, ETH y SOL con hasta 100x leverage, directo desde World App 📱\n\nPagos con World ID verificado ✅\nCero comisiones de gas ⚡\n\n¡Únete ahora!`,
    url: window.location.origin,
  }),
};

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    
    // Fallback para navegadores sin clipboard API
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Genera imagen para compartir (Open Graph)
 */
export function generateShareImage(data: {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: string;
}): string {
  // TODO: Implementar generación de imagen dinámica con Canvas API
  // Por ahora retornar imagen estática
  return '/og-image.png';
}
