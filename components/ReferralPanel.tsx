"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { generateReferralCode, getReferralMilestone, calculateReferralRewards, REFERRAL_REWARDS } from "@/lib/referrals";
import { Copy, Check, Users, Gift, TrendingUp, Share2 } from "lucide-react";

export default function ReferralPanel() {
  const user = useAppStore((state) => state.user);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  // TODO: Obtener referrals count real de la base de datos
  const referralCount = 0;
  
  const referralCode = generateReferralCode(user.id);
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  const { current, next, progress } = getReferralMilestone(referralCount);
  const rewards = calculateReferralRewards(referralCount);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a Numisma',
          text: `¡Únete a Numisma con mi código de referido y obtén ${REFERRAL_REWARDS.forReferred.numa} NUMA gratis!`,
          url: referralLink,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Tu Código de Referido</h2>
        </div>

        <div className="bg-black/40 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">Código</p>
          <p className="text-2xl font-mono font-bold text-white tracking-wider">
            {referralCode}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyLink}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Link
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{referralCount}</p>
          <p className="text-sm text-gray-400">Amigos Invitados</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-center">
          <Gift className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{rewards.totalNuma.toLocaleString()}</p>
          <p className="text-sm text-gray-400">NUMA Ganados</p>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="bg-white/5 rounded-xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-400" />
          Recompensas por Referido
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Tu amigo recibe</p>
              <p className="text-xs text-gray-400">Al registrarse con tu código</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-400">+{REFERRAL_REWARDS.forReferred.numa} NUMA</p>
              <p className="text-xs text-gray-400">+{REFERRAL_REWARDS.forReferred.xp} XP</p>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Tú recibes</p>
              <p className="text-xs text-gray-400">Por cada amigo que invitas</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-400">+{REFERRAL_REWARDS.forReferrer.numa} NUMA</p>
              <p className="text-xs text-gray-400">+{REFERRAL_REWARDS.forReferrer.xp} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      {next && (
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Próximo Milestone
              </h3>
              <p className="text-sm text-gray-400 mt-1">{next.title}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{next.count}</p>
              <p className="text-xs text-gray-400">referidos</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{referralCount} / {next.count}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Bonus al alcanzar {next.count} referidos:</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xl font-bold text-yellow-400">+{next.bonus.numa.toLocaleString()} NUMA</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-400">+{next.bonus.xp.toLocaleString()} XP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Milestone */}
      {current && (
        <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✅</div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Milestone Completado</p>
              <p className="font-bold text-white">{current.title}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-400">+{current.bonus.numa.toLocaleString()} NUMA</p>
              <p className="text-xs text-gray-400">+{current.bonus.xp.toLocaleString()} XP</p>
            </div>
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="font-bold text-white mb-4">Cómo Funciona</h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <p className="text-white font-medium">Comparte tu código</p>
              <p className="text-sm text-gray-400">Envía tu link de referido a tus amigos</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <p className="text-white font-medium">Ellos se registran</p>
              <p className="text-sm text-gray-400">Reciben {REFERRAL_REWARDS.forReferred.numa} NUMA gratis al registrarse</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <p className="text-white font-medium">Todos ganan</p>
              <p className="text-sm text-gray-400">Tú recibes {REFERRAL_REWARDS.forReferrer.numa} NUMA por cada amigo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
