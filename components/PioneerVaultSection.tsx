"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  usePioneerInfo,
  useTopPioneers,
  useVaultStats,
  useVaultConstants,
  useDepositCapital,
  useWithdrawCapital,
  useClaimProfits,
  formatPioneerInfo,
  formatVaultStats,
  formatTopPioneers,
} from "@/hooks/usePioneerVault";
import { useNUMABalance, useNUMAAllowance, useApproveNUMA } from "@/hooks/useTokens";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_PIONEER_VAULT_ADDRESS as `0x${string}`;

export default function PioneerVaultSection() {
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Datos del pioneer
  const { data: pioneerData } = usePioneerInfo(address);
  const pioneer = formatPioneerInfo(pioneerData);

  // Stats del vault
  const { data: statsData } = useVaultStats();
  const stats = formatVaultStats(statsData);

  // Top pioneers
  const { data: topData } = useTopPioneers(10);
  const topPioneers = formatTopPioneers(topData);

  // Constantes
  const constants = useVaultConstants();

  // Balance y allowance de NUMA
  const { data: numaBalance } = useNUMABalance(address);
  const { data: allowance } = useNUMAAllowance(address, VAULT_ADDRESS);

  // Funciones de escritura
  const { approve, isPending: isApproving } = useApproveNUMA();
  const { deposit, isPending: isDepositing } = useDepositCapital();
  const { withdraw, isPending: isWithdrawing } = useWithdrawCapital();
  const { claim, isPending: isClaiming } = useClaimProfits();

  // Verificar si necesita aprobar
  const depositAmountBigInt = depositAmount ? parseUnits(depositAmount, 18) : 0n;
  const needsApproval = allowance !== undefined && depositAmountBigInt > (allowance as bigint);

  const handleDeposit = () => {
    if (!depositAmount) return;
    const amount = parseUnits(depositAmount, 18);
    
    if (needsApproval) {
      approve(VAULT_ADDRESS, amount);
    } else {
      deposit(amount);
      setDepositAmount("");
    }
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) return;
    const amount = parseUnits(withdrawAmount, 18);
    withdraw(amount);
    setWithdrawAmount("");
  };

  const handleClaim = () => {
    claim();
  };

  return (
    <div className="space-y-6">
      {/* Header con stats generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pioneers</CardDescription>
            <CardTitle className="text-3xl">{stats?.activePioneers || 0}/100</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Locked</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalLocked ? formatUnits(stats.totalLocked, 18).slice(0, 8) : "0"} NUMA
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Distributed</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalDistributed ? formatUnits(stats.totalDistributed, 18).slice(0, 8) : "0"} NUMA
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Min Required</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.minCapital ? formatUnits(stats.minCapital, 18).slice(0, 8) : "0"} NUMA
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel del usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Your Pioneer Status</CardTitle>
            <CardDescription>
              Lock NUMA for 1 year and earn 5% of pool profits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pioneer?.isActive ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ranking</span>
                    <Badge variant={pioneer.ranking <= 10 ? "default" : "secondary"}>
                      #{pioneer.ranking}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Capital Locked</span>
                    <span className="font-mono">
                      {formatUnits(pioneer.capitalDeposited, 18).slice(0, 10)} NUMA
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Claimable Profits</span>
                    <span className="font-mono text-green-600">
                      {formatUnits(pioneer.claimableProfits, 18).slice(0, 10)} NUMA
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Lock Status</span>
                    {pioneer.canWithdrawWithoutPenalty ? (
                      <Badge variant="outline" className="text-green-600">Unlocked</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">
                        Locked until {pioneer.unlockDate.toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Claim Profits */}
                {pioneer.claimableProfits > 0n && (
                  <Button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full"
                    variant="default"
                  >
                    {isClaiming ? "Claiming..." : `Claim ${formatUnits(pioneer.claimableProfits, 18).slice(0, 8)} NUMA`}
                  </Button>
                )}

                {/* Withdraw Section */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">Withdraw Capital</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount NUMA"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !withdrawAmount}
                      variant="destructive"
                    >
                      {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                    </Button>
                  </div>
                  {!pioneer.canWithdrawWithoutPenalty && (
                    <p className="text-xs text-yellow-600">
                      ⚠️ Early withdrawal will incur 20% penalty
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Deposit Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deposit NUMA</label>
                    <Input
                      type="number"
                      placeholder="Amount NUMA"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Balance: {numaBalance ? formatUnits(numaBalance, 18).slice(0, 10) : "0"} NUMA
                    </p>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={!depositAmount || isApproving || isDepositing}
                    className="w-full"
                  >
                    {isApproving
                      ? "Approving..."
                      : isDepositing
                      ? "Depositing..."
                      : needsApproval
                      ? "Approve NUMA"
                      : "Deposit & Become Pioneer"}
                  </Button>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Lock Period</p>
                    <p className="text-sm font-bold">1 Year</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Profit Share</p>
                    <p className="text-sm font-bold">5%</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Early Penalty</p>
                    <p className="text-sm font-bold">20%</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Max Pioneers</p>
                    <p className="text-sm font-bold">100</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Pioneers</CardTitle>
            <CardDescription>Leaderboard by capital locked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPioneers.length > 0 ? (
                topPioneers.map((p, index) => (
                  <div
                    key={p.address}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      p.address.toLowerCase() === address?.toLowerCase()
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-mono text-sm">
                        {p.address.slice(0, 6)}...{p.address.slice(-4)}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold">
                      {formatUnits(p.capital, 18).slice(0, 10)} NUMA
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pioneers yet. Be the first!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
