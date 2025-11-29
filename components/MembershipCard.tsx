"use client"

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  useMembershipInfo, 
  useBuyMembership, 
  MembershipTier, 
  TIER_INFO 
} from '@/hooks/useMembership'
import { useApproveWLD, useWLDBalance, useWLDAllowance } from '@/hooks/useTokens'
import { MEMBERSHIP_CONTRACT_ADDRESS } from '@/hooks/useMembership'
import { parseEther } from 'viem'
import { Zap, Crown, Shield, Check } from 'lucide-react'

export default function MembershipCard() {
  const { address, isConnected } = useAccount()
  const { tier, tierInfo, maxLeverage, isActive, refetch } = useMembershipInfo(address)
  const { buyMembership, isPending: isBuying, isSuccess: buySuccess } = useBuyMembership()
  const { balance: wldBalance } = useWLDBalance(address)
  const { allowance: wldAllowance } = useWLDAllowance(address, MEMBERSHIP_CONTRACT_ADDRESS)
  const { approve: approveWLD, isPending: isApproving } = useApproveWLD(MEMBERSHIP_CONTRACT_ADDRESS)
  
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null)

  if (!isConnected) {
    return (
      <div className="card-modern p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Membresías</h3>
        <p className="text-sm text-gray-500">Conecta tu wallet para ver membresías</p>
      </div>
    )
  }

  const handleBuyMembership = async (targetTier: MembershipTier) => {
    if (targetTier === MembershipTier.FREE) return

    const tierPrice = TIER_INFO[targetTier].price
    const priceWei = parseEther(tierPrice.toString())
    const allowanceWei = parseEther(wldAllowance || "0")

    // Si no hay allowance suficiente, aprobar primero
    if (allowanceWei < priceWei) {
      approveWLD(tierPrice.toString())
      return
    }

    // Comprar membresía
    buyMembership(targetTier)
  }

  // Refetch después de compra exitosa
  if (buySuccess) {
    setTimeout(() => refetch(), 2000)
  }

  const tiers = [
    {
      tier: MembershipTier.FREE,
      icon: Shield,
      gradient: 'from-gray-500 to-gray-600',
      features: ['5x Leverage', 'Trading básico', 'Sin costo'],
    },
    {
      tier: MembershipTier.PLUS,
      icon: Zap,
      gradient: 'from-blue-500 to-blue-600',
      features: ['50x Leverage', 'Trading avanzado', '5 WLD único pago'],
      popular: true,
    },
    {
      tier: MembershipTier.VIP,
      icon: Crown,
      gradient: 'from-purple-500 to-purple-600',
      features: ['500x Leverage', 'Trading profesional', '15 WLD único pago'],
    },
  ]

  return (
    <div className="space-y-4">
      {/* Current Membership */}
      <div className="card-modern p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Tu Membresía Actual</h3>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
            tier === MembershipTier.VIP ? 'from-purple-500 to-purple-600' :
            tier === MembershipTier.PLUS ? 'from-blue-500 to-blue-600' :
            'from-gray-500 to-gray-600'
          } flex items-center justify-center`}>
            {tier === MembershipTier.VIP ? (
              <Crown className="w-6 h-6 text-white" />
            ) : tier === MembershipTier.PLUS ? (
              <Zap className="w-6 h-6 text-white" />
            ) : (
              <Shield className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {tierInfo?.name}
            </div>
            <div className="text-sm text-gray-600">
              Leverage máximo: <span className="font-bold text-indigo-600">{maxLeverage}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      {tier !== MembershipTier.VIP && (
        <div className="card-modern p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Mejorar Membresía</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers
              .filter(t => t.tier > tier)
              .map((tierData) => {
                const Icon = tierData.icon
                const tierPrice = TIER_INFO[tierData.tier].price
                const hasEnoughBalance = parseFloat(wldBalance) >= tierPrice
                const hasEnoughAllowance = parseFloat(wldAllowance) >= tierPrice
                const needsApproval = !hasEnoughAllowance && hasEnoughBalance

                return (
                  <div
                    key={tierData.tier}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      tierData.popular ? 'border-blue-500' : 'border-gray-200'
                    } hover:shadow-lg`}
                  >
                    {tierData.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                        Más Popular
                      </div>
                    )}
                    
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierData.gradient} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {TIER_INFO[tierData.tier].name}
                    </h4>

                    <div className="text-2xl font-bold text-gray-900 mb-3">
                      {tierPrice === 0 ? 'Gratis' : `${tierPrice} WLD`}
                    </div>

                    <ul className="space-y-2 mb-4">
                      {tierData.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!hasEnoughBalance ? (
                      <div className="text-sm text-red-600 font-medium mb-2">
                        ⚠️ Balance insuficiente ({parseFloat(wldBalance).toFixed(2)} WLD)
                      </div>
                    ) : null}

                    <button
                      onClick={() => handleBuyMembership(tierData.tier)}
                      disabled={!hasEnoughBalance || isBuying || isApproving}
                      className={`w-full py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        tierData.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isApproving ? 'Aprobando...' :
                       isBuying ? 'Comprando...' :
                       needsApproval ? `Aprobar ${tierPrice} WLD` :
                       'Comprar Ahora'}
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
