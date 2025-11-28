import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition Module para deploy completo de Numisma
 * 
 * Orden de deploy:
 * 1. NumismaToken (token ERC-20)
 * 2. TradingPool (usando address de NumismaToken)
 * 3. PioneerVault
 * 4. LoanManager (pendiente)
 */

const NumismaModule = buildModule("NumismaModule", (m) => {
  // 1. Deploy NumismaToken
  const numaToken = m.contract("NumismaToken");

  // 2. Deploy TradingPool (requiere address de NumismaToken)
  const tradingPool = m.contract("TradingPool", [numaToken]);

  // 3. Deploy PioneerVault
  const pioneerVault = m.contract("PioneerVault");

  // 4. Configuración inicial
  
  // Fondear el TradingPool con liquidez inicial (opcional)
  // m.call(numaToken, "transfer", [tradingPool, m.getParameter("initialPoolLiquidity", 1_000_000n * 10n ** 18n)]);

  return {
    numaToken,
    tradingPool,
    pioneerVault,
  };
});

export default NumismaModule;
