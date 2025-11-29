/**
 * Referral System
 * Sistema de referencias para invitar amigos
 */

export interface ReferralReward {
  forReferrer: {
    numa: number;
    xp: number;
  };
  forReferred: {
    numa: number;
    xp: number;
  };
}

export const REFERRAL_REWARDS: ReferralReward = {
  forReferrer: {
    numa: 500,
    xp: 200,
  },
  forReferred: {
    numa: 300,
    xp: 100,
  },
};

/**
 * Milestones de referidos con bonos extra
 */
export const REFERRAL_MILESTONES = [
  { count: 5, bonus: { numa: 1000, xp: 500 }, title: 'Social Butterfly 🦋' },
  { count: 10, bonus: { numa: 2500, xp: 1000 }, title: 'Networker 🌐' },
  { count: 20, bonus: { numa: 5000, xp: 2000 }, title: 'Influencer 🌟' },
  { count: 50, bonus: { numa: 15000, xp: 5000 }, title: 'Ambassador 👑' },
  { count: 100, bonus: { numa: 50000, xp: 10000 }, title: 'Legend 💎' },
];

/**
 * Genera código de referido único
 */
export function generateReferralCode(userId: number): string {
  // Base36 encoding del userId + checksum
  const base = userId.toString(36).toUpperCase();
  const checksum = (userId * 7) % 36;
  return `NUMA-${base}${checksum.toString(36).toUpperCase()}`;
}

/**
 * Valida código de referido
 */
export function validateReferralCode(code: string): { valid: boolean; userId?: number } {
  if (!code.startsWith('NUMA-')) {
    return { valid: false };
  }

  const parts = code.slice(5); // Remove 'NUMA-'
  if (parts.length < 2) {
    return { valid: false };
  }

  try {
    const base = parts.slice(0, -1);
    const checksum = parts.slice(-1);
    
    const userId = parseInt(base, 36);
    const expectedChecksum = ((userId * 7) % 36).toString(36).toUpperCase();
    
    if (checksum === expectedChecksum) {
      return { valid: true, userId };
    }
  } catch (e) {
    return { valid: false };
  }

  return { valid: false };
}

/**
 * Obtiene el milestone actual y siguiente
 */
export function getReferralMilestone(referralCount: number): {
  current: typeof REFERRAL_MILESTONES[0] | null;
  next: typeof REFERRAL_MILESTONES[0] | null;
  progress: number;
} {
  let current = null;
  let next = REFERRAL_MILESTONES[0];

  for (let i = 0; i < REFERRAL_MILESTONES.length; i++) {
    const milestone = REFERRAL_MILESTONES[i];
    
    if (referralCount >= milestone.count) {
      current = milestone;
      next = REFERRAL_MILESTONES[i + 1] || null;
    } else {
      if (!current) {
        next = milestone;
      }
      break;
    }
  }

  const progress = next 
    ? ((referralCount - (current?.count || 0)) / (next.count - (current?.count || 0))) * 100
    : 100;

  return { current, next, progress };
}

/**
 * Calcula recompensas totales por referidos
 */
export function calculateReferralRewards(referralCount: number): {
  totalNuma: number;
  totalXp: number;
  milestoneBonus: { numa: number; xp: number };
} {
  const baseNuma = referralCount * REFERRAL_REWARDS.forReferrer.numa;
  const baseXp = referralCount * REFERRAL_REWARDS.forReferrer.xp;

  let milestoneNuma = 0;
  let milestoneXp = 0;

  for (const milestone of REFERRAL_MILESTONES) {
    if (referralCount >= milestone.count) {
      milestoneNuma += milestone.bonus.numa;
      milestoneXp += milestone.bonus.xp;
    }
  }

  return {
    totalNuma: baseNuma + milestoneNuma,
    totalXp: baseXp + milestoneXp,
    milestoneBonus: { numa: milestoneNuma, xp: milestoneXp },
  };
}
