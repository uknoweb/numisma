/**
 * MiniKit Integration
 * SDK oficial de Worldcoin para mini apps
 */

import { MiniKit, type VerificationLevel } from '@worldcoin/minikit-js';

// Configuración de MiniKit
export const initMiniKit = () => {
  if (typeof window === 'undefined') return;
  
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_staging_xxxxx';
  MiniKit.install(appId);
};

/**
 * Verificar usuario con World ID
 */
export async function verifyWithWorldID(
  signal?: string,
  actionId: string = process.env.NEXT_PUBLIC_WORLD_ACTION_ID || 'verify_human'
): Promise<{
  success: boolean;
  proof?: any;
  merkle_root?: string;
  nullifier_hash?: string;
  verification_level?: VerificationLevel;
  error?: string;
}> {
  try {
    // Solicitar verificación con World ID
    const { finalPayload } = await MiniKit.commandsAsync.verify({
      action: actionId,
      signal: signal || Date.now().toString(),
      verification_level: 'orb' as VerificationLevel, // Requerir verificación con Orb
    });

    if (!finalPayload || finalPayload.status === 'error') {
      return {
        success: false,
        error: 'Verification failed or was cancelled',
      };
    }

    // Verificar el proof en el backend
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof: finalPayload.proof,
        merkle_root: finalPayload.merkle_root,
        nullifier_hash: finalPayload.nullifier_hash,
        verification_level: finalPayload.verification_level,
        action: actionId,
        signal: signal || Date.now().toString(),
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Backend verification failed',
      };
    }

    return {
      success: true,
      proof: finalPayload.proof,
      merkle_root: finalPayload.merkle_root,
      nullifier_hash: finalPayload.nullifier_hash,
      verification_level: finalPayload.verification_level,
    };
  } catch (error) {
    console.error('World ID verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enviar transacción a través de MiniKit
 * (El wallet de World App firma automáticamente)
 */
export async function sendTransaction(params: {
  to: `0x${string}`;
  value: string; // en wei
  data?: `0x${string}`;
}) {
  try {
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: params.to,
          abi: [],
          functionName: '',
          args: [],
        },
      ],
    });

    if (!finalPayload || finalPayload.status === 'error') {
      throw new Error('Transaction failed or was cancelled');
    }

    return {
      success: true,
      transactionId: finalPayload.transaction_id,
    };
  } catch (error) {
    console.error('Transaction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Obtener información del wallet del usuario
 */
export function getWalletInfo() {
  if (typeof window === 'undefined') return null;
  
  const walletAddress = MiniKit.walletAddress;
  
  return {
    address: walletAddress,
    isConnected: !!walletAddress,
  };
}

/**
 * Verificar si la app está corriendo dentro de World App
 */
export function isInsideWorldApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  return MiniKit.isInstalled();
}

/**
 * Copiar al clipboard (útil para compartir referidos)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await MiniKit.commandsAsync.copyToClipboard({
      value: text,
    });
    return true;
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    return false;
  }
}

/**
 * Compartir contenido (para invitaciones de Pioneros)
 */
export async function shareContent(params: {
  title: string;
  description: string;
  url?: string;
}): Promise<boolean> {
  try {
    await MiniKit.commandsAsync.share({
      title: params.title,
      description: params.description,
      url: params.url,
    });
    return true;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
}

/**
 * Obtener información de pago (para compras de membresías)
 */
export async function requestPayment(params: {
  to: `0x${string}`;
  value: string; // en WLD (ether)
  description: string;
}) {
  try {
    const { finalPayload } = await MiniKit.commandsAsync.pay({
      reference: `payment_${Date.now()}`,
      to: params.to,
      tokens: [
        {
          symbol: 'WLD',
          token_amount: params.value,
        },
      ],
      description: params.description,
    });

    if (!finalPayload || finalPayload.status === 'error') {
      return {
        success: false,
        error: 'Payment failed or was cancelled',
      };
    }

    return {
      success: true,
      transactionId: finalPayload.transaction_id,
    };
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
