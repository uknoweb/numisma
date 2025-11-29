// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PoolCentinelaRegeneracionV2
 * @notice Pool de Riesgo con soporte para tokens ERC-20 (NUMA y WLD)
 * @dev NUEVA VERSIÓN - Usa tokens reales en lugar de balances internos
 * 
 * Cambios principales:
 * - Usa NUMA token (ERC-20) para colateral en par NUMA/WLD
 * - Usa WLD token (ERC-20) para colateral en par WLD/USDT  
 * - Deposit/Withdraw de tokens
 * - Pool tiene liquidez en NUMA y WLD para pagar ganancias
 */
contract PoolCentinelaRegeneracionV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ========== TOKENS ==========
    
    IERC20 public numaToken;
    IERC20 public wldToken;
    
    // ========== ESTRUCTURAS ==========
    
    enum TradingPair { WLD_USDT, NUMA_WLD }
    enum PositionType { LONG, SHORT }
    
    struct Position {
        address trader;
        TradingPair pair;
        PositionType positionType;
        uint256 collateral;          // Colateral depositado (en tokens)
        uint256 leverage;             // Apalancamiento (ej. 10 = 10x)
        uint256 positionSize;         // Tamaño total (collateral * leverage)
        uint256 entryPrice;           // Precio de entrada
        uint256 openTimestamp;        // Timestamp de apertura
        uint256 lastFundingTimestamp; // Último cobro de funding
        bool isOpen;                  // Estado de la posición
    }
    
    // ========== VARIABLES DE ESTADO ==========
    
    // Mapeo de posiciones: trader => positionId => Position
    mapping(address => mapping(uint256 => Position)) public positions;
    mapping(address => uint256) public positionCount;
    
    // Balances de traders en el pool (después de cerrar posiciones)
    mapping(address => uint256) public traderBalanceNUMA;
    mapping(address => uint256) public traderBalanceWLD;
    
    // Precios y tasas
    uint256 public wldPriceUSDT;              // Precio WLD/USDT (actualizable por owner)
    uint256 public constant NUMA_WLD_RATE = 10; // Tasa fija: 10 NUMA = 1 WLD
    
    // Comisiones (en basis points, 100 = 1%)
    uint256 public constant TRADING_FEE = 20;        // 0.2% = 20 basis points
    uint256 public constant FUNDING_RATE = 1;        // 0.01% = 1 basis point
    uint256 public constant FUNDING_INTERVAL = 8 hours;
    
    // Pool de Riesgo (liquidez del pool)
    uint256 public poolBalanceNUMA;  // NUMA disponible en el pool
    uint256 public poolBalanceWLD;   // WLD disponible en el pool
    
    // Precio de liquidación (90% del colateral perdido)
    uint256 public constant LIQUIDATION_THRESHOLD = 90; // 90%
    
    // ========== EVENTOS ==========
    
    event TokensDeposited(address indexed trader, address token, uint256 amount);
    event TokensWithdrawn(address indexed trader, address token, uint256 amount);
    
    event PositionOpened(
        address indexed trader,
        uint256 indexed positionId,
        TradingPair pair,
        PositionType positionType,
        uint256 collateral,
        uint256 leverage,
        uint256 entryPrice,
        uint256 tradingFee
    );
    
    event PositionClosed(
        address indexed trader,
        uint256 indexed positionId,
        uint256 exitPrice,
        int256 pnl,
        uint256 fundingFeesPaid
    );
    
    event PositionLiquidated(
        address indexed trader,
        uint256 indexed positionId,
        uint256 collateralLiquidated
    );
    
    event FundingFeePaid(
        address indexed trader,
        uint256 indexed positionId,
        uint256 fee
    );
    
    event WLDPriceUpdated(uint256 newPrice);
    event PoolFunded(address token, uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        uint256 _initialWLDPrice,
        address _numaToken,
        address _wldToken
    ) Ownable(msg.sender) {
        require(_numaToken != address(0), "Invalid NUMA token");
        require(_wldToken != address(0), "Invalid WLD token");
        
        wldPriceUSDT = _initialWLDPrice; // Ej: 2.50 USDT = 2500000 (6 decimales)
        numaToken = IERC20(_numaToken);
        wldToken = IERC20(_wldToken);
    }
    
    // ========== FUNCIONES DE DEPÓSITO/RETIRO ==========
    
    /**
     * @notice Depositar tokens NUMA al pool del trader
     */
    function depositNUMA(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        numaToken.safeTransferFrom(msg.sender, address(this), amount);
        traderBalanceNUMA[msg.sender] += amount;
        
        emit TokensDeposited(msg.sender, address(numaToken), amount);
    }
    
    /**
     * @notice Depositar tokens WLD al pool del trader
     */
    function depositWLD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        wldToken.safeTransferFrom(msg.sender, address(this), amount);
        traderBalanceWLD[msg.sender] += amount;
        
        emit TokensDeposited(msg.sender, address(wldToken), amount);
    }
    
    /**
     * @notice Retirar tokens NUMA
     */
    function withdrawNUMA(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(traderBalanceNUMA[msg.sender] >= amount, "Insufficient balance");
        
        traderBalanceNUMA[msg.sender] -= amount;
        numaToken.safeTransfer(msg.sender, amount);
        
        emit TokensWithdrawn(msg.sender, address(numaToken), amount);
    }
    
    /**
     * @notice Retirar tokens WLD
     */
    function withdrawWLD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(traderBalanceWLD[msg.sender] >= amount, "Insufficient balance");
        
        traderBalanceWLD[msg.sender] -= amount;
        wldToken.safeTransfer(msg.sender, amount);
        
        emit TokensWithdrawn(msg.sender, address(wldToken), amount);
    }
    
    // ========== FUNCIONES DE ORÁCULO ==========
    
    /**
     * @notice Actualizar precio de WLD/USDT (solo owner u oráculo)
     */
    function updateWLDPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be > 0");
        wldPriceUSDT = newPrice;
        emit WLDPriceUpdated(newPrice);
    }
    
    /**
     * @notice Obtener precio actual según el par
     */
    function getCurrentPrice(TradingPair pair) public view returns (uint256) {
        if (pair == TradingPair.WLD_USDT) {
            return wldPriceUSDT;
        } else {
            // NUMA/WLD: precio de 1 NUMA en términos de WLD
            // Si 10 NUMA = 1 WLD, entonces 1 NUMA = 0.1 WLD
            // Retornamos con 6 decimales: 0.1 * 1e6 = 100000
            return 100000; // 0.1 WLD con 6 decimales
        }
    }
    
    // ========== FUNCIONES DE TRADING ==========
    
    /**
     * @notice Abrir una posición (usa balance del trader en el pool)
     */
    function openPosition(
        TradingPair pair,
        PositionType positionType,
        uint256 leverage
    ) external nonReentrant returns (uint256 positionId) {
        require(leverage >= 1 && leverage <= 500, "Leverage must be 1-500x");
        
        // Determinar colateral mínimo y balance según el par
        uint256 minCollateral;
        uint256 traderBalance;
        
        if (pair == TradingPair.WLD_USDT) {
            minCollateral = 100000; // 0.1 WLD (6 decimales)
            traderBalance = traderBalanceWLD[msg.sender];
        } else {
            minCollateral = 100000000000000000; // 0.1 NUMA (18 decimales)
            traderBalance = traderBalanceNUMA[msg.sender];
        }
        
        require(traderBalance >= minCollateral, "Insufficient balance");
        
        // Usar balance disponible como colateral (simplificado - podría ser parametrizable)
        uint256 collateral = traderBalance;
        
        // Calcular tamaño de posición
        uint256 positionSize = collateral * leverage;
        
        // Calcular comisión de trading (0.2% sobre positionSize)
        uint256 tradingFee = (positionSize * TRADING_FEE) / 10000;
        
        // Verificar que hay suficiente colateral para cubrir la comisión
        require(collateral > tradingFee, "Insufficient collateral for fees");
        
        // Descontar colateral del balance del trader
        if (pair == TradingPair.WLD_USDT) {
            traderBalanceWLD[msg.sender] = 0;
            poolBalanceWLD += tradingFee; // Comisión al pool
        } else {
            traderBalanceNUMA[msg.sender] = 0;
            poolBalanceNUMA += tradingFee; // Comisión al pool
        }
        
        // Crear posición
        positionId = positionCount[msg.sender];
        positions[msg.sender][positionId] = Position({
            trader: msg.sender,
            pair: pair,
            positionType: positionType,
            collateral: collateral - tradingFee, // Colateral neto
            leverage: leverage,
            positionSize: positionSize,
            entryPrice: getCurrentPrice(pair),
            openTimestamp: block.timestamp,
            lastFundingTimestamp: block.timestamp,
            isOpen: true
        });
        
        positionCount[msg.sender]++;
        
        uint256 priceAtOpen = getCurrentPrice(pair);
        emit PositionOpened(
            msg.sender,
            positionId,
            pair,
            positionType,
            collateral - tradingFee,
            leverage,
            priceAtOpen,
            tradingFee
        );
    }
    
    /**
     * @notice Cerrar una posición
     */
    function closePosition(uint256 positionId) external nonReentrant {
        Position storage position = positions[msg.sender][positionId];
        require(position.isOpen, "Position not open");
        
        // Cobrar funding fees pendientes
        uint256 fundingFees = _chargeFundingFees(msg.sender, positionId);
        
        // Calcular P&L con precio actual
        uint256 currentPrice = getCurrentPrice(position.pair);
        int256 pnl = _calculatePnL(position, currentPrice);
        int256 finalBalance = int256(position.collateral) + pnl;
        
        // Si hay ganancias, verificar que el pool tenga liquidez
        if (finalBalance > int256(position.collateral)) {
            uint256 profit = uint256(finalBalance) - position.collateral;
            
            if (position.pair == TradingPair.WLD_USDT) {
                require(poolBalanceWLD >= profit, "Insufficient pool liquidity");
                poolBalanceWLD -= profit;
                traderBalanceWLD[msg.sender] += uint256(finalBalance);
            } else {
                require(poolBalanceNUMA >= profit, "Insufficient pool liquidity");
                poolBalanceNUMA -= profit;
                traderBalanceNUMA[msg.sender] += uint256(finalBalance);
            }
        } else if (finalBalance > 0) {
            // Pérdidas pero aún queda algo
            if (position.pair == TradingPair.WLD_USDT) {
                uint256 loss = position.collateral - uint256(finalBalance);
                poolBalanceWLD += loss; // Pérdida va al pool
                traderBalanceWLD[msg.sender] += uint256(finalBalance);
            } else {
                uint256 loss = position.collateral - uint256(finalBalance);
                poolBalanceNUMA += loss; // Pérdida va al pool
                traderBalanceNUMA[msg.sender] += uint256(finalBalance);
            }
        } else {
            // Pérdida total - todo el colateral va al pool
            if (position.pair == TradingPair.WLD_USDT) {
                poolBalanceWLD += position.collateral;
            } else {
                poolBalanceNUMA += position.collateral;
            }
        }
        
        // Cerrar posición
        position.isOpen = false;
        
        emit PositionClosed(
            msg.sender,
            positionId,
            currentPrice,
            pnl,
            fundingFees
        );
    }
    
    /**
     * @notice Liquidar posición si pérdidas >= 90%
     */
    function liquidatePosition(address trader, uint256 positionId) external {
        Position storage position = positions[trader][positionId];
        require(position.isOpen, "Position not open");
        
        // Calcular P&L actual
        uint256 currentPrice = getCurrentPrice(position.pair);
        int256 pnl = _calculatePnL(position, currentPrice);
        int256 currentValue = int256(position.collateral) + pnl;
        
        // Verificar si califica para liquidación (pérdida >= 90%)
        int256 threshold = int256(position.collateral) * int256(LIQUIDATION_THRESHOLD) / 100;
        require(currentValue <= threshold, "Position not liquidatable");
        
        // Todo el colateral va al pool
        if (position.pair == TradingPair.WLD_USDT) {
            poolBalanceWLD += position.collateral;
        } else {
            poolBalanceNUMA += position.collateral;
        }
        
        // Cerrar posición
        position.isOpen = false;
        
        emit PositionLiquidated(trader, positionId, position.collateral);
    }
    
    /**
     * @notice Calcular P&L de una posición
     */
    function getCurrentPnL(address trader, uint256 positionId) 
        external 
        view 
        returns (int256 pnl) 
    {
        Position memory position = positions[trader][positionId];
        require(position.isOpen, "Position not open");
        
        uint256 currentPrice = getCurrentPrice(position.pair);
        return _calculatePnL(position, currentPrice);
    }
    
    // ========== FUNCIONES INTERNAS ==========
    
    function _calculatePnL(Position memory position, uint256 currentPrice) 
        internal 
        pure 
        returns (int256) 
    {
        int256 priceDiff;
        
        if (position.positionType == PositionType.LONG) {
            priceDiff = int256(currentPrice) - int256(position.entryPrice);
        } else {
            priceDiff = int256(position.entryPrice) - int256(currentPrice);
        }
        
        // P&L = (priceDiff / entryPrice) * positionSize
        return (priceDiff * int256(position.positionSize)) / int256(position.entryPrice);
    }
    
    function _chargeFundingFees(address trader, uint256 positionId) 
        internal 
        returns (uint256 totalFees) 
    {
        Position storage position = positions[trader][positionId];
        
        uint256 intervalsPassed = (block.timestamp - position.lastFundingTimestamp) / FUNDING_INTERVAL;
        
        if (intervalsPassed > 0) {
            // 0.01% por intervalo sobre positionSize
            uint256 feePerInterval = (position.positionSize * FUNDING_RATE) / 10000;
            totalFees = feePerInterval * intervalsPassed;
            
            // Descontar del colateral
            if (totalFees < position.collateral) {
                position.collateral -= totalFees;
                
                // Añadir al pool
                if (position.pair == TradingPair.WLD_USDT) {
                    poolBalanceWLD += totalFees;
                } else {
                    poolBalanceNUMA += totalFees;
                }
                
                position.lastFundingTimestamp = block.timestamp;
                emit FundingFeePaid(trader, positionId, totalFees);
            }
        }
    }
    
    // ========== FUNCIONES ADMINISTRATIVAS ==========
    
    /**
     * @notice Owner puede fondear el pool con liquidez
     */
    function fundPoolNUMA(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        numaToken.safeTransferFrom(msg.sender, address(this), amount);
        poolBalanceNUMA += amount;
        emit PoolFunded(address(numaToken), amount);
    }
    
    /**
     * @notice Owner puede fondear el pool con WLD
     */
    function fundPoolWLD(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        wldToken.safeTransferFrom(msg.sender, address(this), amount);
        poolBalanceWLD += amount;
        emit PoolFunded(address(wldToken), amount);
    }
    
    /**
     * @notice Ver balance total de tokens en el contrato
     */
    function getContractBalance() external view returns (uint256 numa, uint256 wld) {
        numa = numaToken.balanceOf(address(this));
        wld = wldToken.balanceOf(address(this));
    }
    
    /**
     * @notice Ver posición completa
     */
    function getPosition(address trader, uint256 positionId) 
        external 
        view 
        returns (Position memory) 
    {
        return positions[trader][positionId];
    }
}
