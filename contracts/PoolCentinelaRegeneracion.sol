// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PoolCentinelaRegeneracion
 * @notice Pool de Riesgo del Predictor con Doble Par de Trading
 * @dev Implementa:
 * - Par WLD/USDT: Precio simulado con oráculo actualizable
 * - Par NUMA/WLD: Tasa fija interna (10 NUMA = 1 WLD)
 * - Comisión de Trading: 0.2% sobre tamaño total al abrir
 * - Tasa de Financiamiento: 0.01% cada 8 horas sobre tamaño total
 * - 100% de comisiones y colateral liquidado fluyen al Pool
 */
contract PoolCentinelaRegeneracion is Ownable, ReentrancyGuard {
    
    // ========== ESTRUCTURAS ==========
    
    enum TradingPair { WLD_USDT, NUMA_WLD }
    enum PositionType { LONG, SHORT }
    
    struct Position {
        address trader;
        TradingPair pair;
        PositionType positionType;
        uint256 collateral;          // Colateral depositado
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
    
    // Precios y tasas
    uint256 public wldPriceUSDT;              // Precio WLD/USDT (actualizable por owner)
    uint256 public constant NUMA_WLD_RATE = 10; // Tasa fija: 10 NUMA = 1 WLD
    
    // Comisiones (en basis points, 100 = 1%)
    uint256 public constant TRADING_FEE = 20;        // 0.2% = 20 basis points
    uint256 public constant FUNDING_RATE = 1;        // 0.01% = 1 basis point
    uint256 public constant FUNDING_INTERVAL = 8 hours;
    
    // Pool de Riesgo (acumula comisiones y liquidaciones)
    uint256 public poolBalance;
    
    // Precio de liquidación (90% del colateral perdido)
    uint256 public constant LIQUIDATION_THRESHOLD = 90; // 90%
    
    // ========== EVENTOS ==========
    
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
    event PoolFunded(uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(uint256 _initialWLDPrice) Ownable(msg.sender) {
        wldPriceUSDT = _initialWLDPrice; // Ej: 2.50 USDT = 2500000 (6 decimales)
    }
    
    // ========== FUNCIONES DE ORÁCULO ==========
    
    /**
     * @notice Actualiza el precio WLD/USDT (simula oráculo)
     * @dev Solo el owner puede actualizar (creador)
     * @param _newPrice Nuevo precio con 6 decimales (ej: 2.50 USDT = 2500000)
     */
    function updateWLDPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Invalid price");
        wldPriceUSDT = _newPrice;
        emit WLDPriceUpdated(_newPrice);
    }
    
    /**
     * @notice Obtiene el precio actual de WLD/USDT
     * @return Precio con 6 decimales
     */
    function getWLDPrice() public view returns (uint256) {
        return wldPriceUSDT;
    }
    
    /**
     * @notice Obtiene la tasa NUMA/WLD (fija)
     * @return Tasa fija (10 NUMA = 1 WLD)
     */
    function getNUMAWLDRate() public pure returns (uint256) {
        return NUMA_WLD_RATE;
    }
    
    /**
     * @notice Convierte NUMA a WLD usando tasa fija
     * @param numaAmount Cantidad de NUMA
     * @return Cantidad equivalente en WLD
     */
    function convertNUMAtoWLD(uint256 numaAmount) public pure returns (uint256) {
        return numaAmount / NUMA_WLD_RATE;
    }
    
    /**
     * @notice Convierte WLD a NUMA usando tasa fija
     * @param wldAmount Cantidad de WLD
     * @return Cantidad equivalente en NUMA
     */
    function convertWLDtoNUMA(uint256 wldAmount) public pure returns (uint256) {
        return wldAmount * NUMA_WLD_RATE;
    }
    
    // ========== FUNCIONES DE TRADING ==========
    
    /**
     * @notice Abre una posición de trading
     * @param _pair Par de trading (WLD_USDT o NUMA_WLD)
     * @param _positionType Tipo (LONG o SHORT)
     * @param _leverage Apalancamiento (ej: 10 = 10x)
     */
    function openPosition(
        TradingPair _pair,
        PositionType _positionType,
        uint256 _leverage
    ) external payable nonReentrant {
        require(msg.value > 0, "Must deposit collateral");
        require(_leverage > 0 && _leverage <= 500, "Invalid leverage");
        
        uint256 positionSize = msg.value * _leverage;
        
        // Calcular comisión de trading: 0.2% sobre tamaño total
        uint256 tradingFee = (positionSize * TRADING_FEE) / 10000;
        require(msg.value > tradingFee, "Insufficient collateral for fee");
        
        // Deducir comisión del colateral
        uint256 effectiveCollateral = msg.value - tradingFee;
        
        // Agregar comisión al pool
        poolBalance += tradingFee;
        
        // Obtener precio de entrada según el par
        uint256 entryPrice;
        if (_pair == TradingPair.WLD_USDT) {
            entryPrice = getWLDPrice();
        } else {
            entryPrice = NUMA_WLD_RATE; // Tasa fija para NUMA/WLD
        }
        
        // Crear posición
        uint256 positionId = positionCount[msg.sender];
        positions[msg.sender][positionId] = Position({
            trader: msg.sender,
            pair: _pair,
            positionType: _positionType,
            collateral: effectiveCollateral,
            leverage: _leverage,
            positionSize: effectiveCollateral * _leverage,
            entryPrice: entryPrice,
            openTimestamp: block.timestamp,
            lastFundingTimestamp: block.timestamp,
            isOpen: true
        });
        
        positionCount[msg.sender]++;
        
        emit PositionOpened(
            msg.sender,
            positionId,
            _pair,
            _positionType,
            effectiveCollateral,
            _leverage,
            entryPrice,
            tradingFee
        );
    }
    
    /**
     * @notice Cierra una posición de trading
     * @param _positionId ID de la posición a cerrar
     */
    function closePosition(uint256 _positionId) external nonReentrant {
        Position storage position = positions[msg.sender][_positionId];
        require(position.isOpen, "Position not open");
        require(position.trader == msg.sender, "Not your position");
        
        // Calcular y cobrar tasas de financiamiento pendientes
        uint256 fundingFees = _chargeFundingFees(msg.sender, _positionId);
        
        // Obtener precio de salida
        uint256 exitPrice;
        if (position.pair == TradingPair.WLD_USDT) {
            exitPrice = getWLDPrice();
        } else {
            exitPrice = NUMA_WLD_RATE;
        }
        
        // Calcular PnL
        int256 pnl = _calculatePnL(position, exitPrice);
        
        // Calcular payout
        uint256 payout;
        if (pnl >= 0) {
            // Ganancia
            uint256 profit = uint256(pnl);
            payout = position.collateral + profit;
        } else {
            // Pérdida
            uint256 loss = uint256(-pnl);
            if (loss >= position.collateral) {
                payout = 0; // Pérdida total
                poolBalance += position.collateral; // Pool se queda con todo
            } else {
                payout = position.collateral - loss;
                poolBalance += loss; // Pool recibe la pérdida
            }
        }
        
        // Cerrar posición
        position.isOpen = false;
        
        // Transferir payout al trader
        if (payout > 0) {
            payable(msg.sender).transfer(payout);
        }
        
        emit PositionClosed(msg.sender, _positionId, exitPrice, pnl, fundingFees);
    }
    
    /**
     * @notice Liquida una posición si alcanza el umbral de liquidación
     * @param _trader Dirección del trader
     * @param _positionId ID de la posición
     */
    function liquidatePosition(address _trader, uint256 _positionId) external nonReentrant {
        Position storage position = positions[_trader][_positionId];
        require(position.isOpen, "Position not open");
        
        // Obtener precio actual
        uint256 currentPrice;
        if (position.pair == TradingPair.WLD_USDT) {
            currentPrice = getWLDPrice();
        } else {
            currentPrice = NUMA_WLD_RATE;
        }
        
        // Calcular PnL actual
        int256 pnl = _calculatePnL(position, currentPrice);
        
        // Verificar si debe liquidarse (pérdida >= 90% del colateral)
        uint256 liquidationThreshold = (position.collateral * LIQUIDATION_THRESHOLD) / 100;
        require(pnl < 0 && uint256(-pnl) >= liquidationThreshold, "Not liquidatable");
        
        // Liquidar: 100% del colateral va al pool
        poolBalance += position.collateral;
        
        // Cerrar posición
        position.isOpen = false;
        
        emit PositionLiquidated(_trader, _positionId, position.collateral);
    }
    
    // ========== FUNCIONES DE COMISIONES ==========
    
    /**
     * @notice Cobra tasas de financiamiento pendientes (0.01% cada 8 horas)
     * @param _trader Dirección del trader
     * @param _positionId ID de la posición
     * @return Total de fees cobrados
     */
    function _chargeFundingFees(address _trader, uint256 _positionId) internal returns (uint256) {
        Position storage position = positions[_trader][_positionId];
        
        uint256 timeElapsed = block.timestamp - position.lastFundingTimestamp;
        uint256 intervals = timeElapsed / FUNDING_INTERVAL;
        
        if (intervals == 0) {
            return 0;
        }
        
        // Calcular fee: 0.01% por intervalo sobre tamaño total
        uint256 feePerInterval = (position.positionSize * FUNDING_RATE) / 10000;
        uint256 totalFee = feePerInterval * intervals;
        
        // Deducir del colateral
        if (totalFee >= position.collateral) {
            // Fee excede colateral - liquidación automática
            totalFee = position.collateral;
            position.collateral = 0;
        } else {
            position.collateral -= totalFee;
        }
        
        // Agregar fee al pool
        poolBalance += totalFee;
        
        // Actualizar timestamp
        position.lastFundingTimestamp = block.timestamp;
        
        emit FundingFeePaid(_trader, _positionId, totalFee);
        
        return totalFee;
    }
    
    /**
     * @notice Cobra funding fees manualmente (puede llamar cualquiera)
     * @param _trader Dirección del trader
     * @param _positionId ID de la posición
     */
    function chargeFundingFees(address _trader, uint256 _positionId) external {
        Position storage position = positions[_trader][_positionId];
        require(position.isOpen, "Position not open");
        
        _chargeFundingFees(_trader, _positionId);
    }
    
    // ========== FUNCIONES DE CÁLCULO ==========
    
    /**
     * @notice Calcula el PnL de una posición
     * @param position Estructura de la posición
     * @param currentPrice Precio actual
     * @return PnL (puede ser negativo)
     */
    function _calculatePnL(Position memory position, uint256 currentPrice) internal pure returns (int256) {
        int256 priceDiff;
        
        if (position.positionType == PositionType.LONG) {
            // LONG: ganancia si precio sube
            priceDiff = int256(currentPrice) - int256(position.entryPrice);
        } else {
            // SHORT: ganancia si precio baja
            priceDiff = int256(position.entryPrice) - int256(currentPrice);
        }
        
        // PnL = (priceDiff / entryPrice) * positionSize
        int256 pnl = (priceDiff * int256(position.positionSize)) / int256(position.entryPrice);
        
        return pnl;
    }
    
    /**
     * @notice Calcula el PnL actual de una posición abierta
     * @param _trader Dirección del trader
     * @param _positionId ID de la posición
     * @return PnL actual
     */
    function getCurrentPnL(address _trader, uint256 _positionId) external view returns (int256) {
        Position memory position = positions[_trader][_positionId];
        require(position.isOpen, "Position not open");
        
        uint256 currentPrice;
        if (position.pair == TradingPair.WLD_USDT) {
            currentPrice = getWLDPrice();
        } else {
            currentPrice = NUMA_WLD_RATE;
        }
        
        return _calculatePnL(position, currentPrice);
    }
    
    // ========== FUNCIONES DE POOL ==========
    
    /**
     * @notice Permite al owner financiar el pool
     */
    function fundPool() external payable onlyOwner {
        require(msg.value > 0, "Must send funds");
        poolBalance += msg.value;
        emit PoolFunded(msg.value);
    }
    
    /**
     * @notice Permite al owner retirar del pool (solo excedentes)
     * @param _amount Cantidad a retirar
     */
    function withdrawFromPool(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount <= poolBalance, "Insufficient pool balance");
        poolBalance -= _amount;
        payable(owner()).transfer(_amount);
    }
    
    /**
     * @notice Obtiene el balance del pool
     */
    function getPoolBalance() external view returns (uint256) {
        return poolBalance;
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @notice Obtiene información de una posición
     */
    function getPosition(address _trader, uint256 _positionId) external view returns (Position memory) {
        return positions[_trader][_positionId];
    }
    
    /**
     * @notice Obtiene el número de posiciones de un trader
     */
    function getPositionCount(address _trader) external view returns (uint256) {
        return positionCount[_trader];
    }
    
    /**
     * @notice Calcula funding fees pendientes
     */
    function getPendingFundingFees(address _trader, uint256 _positionId) external view returns (uint256) {
        Position memory position = positions[_trader][_positionId];
        
        if (!position.isOpen) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - position.lastFundingTimestamp;
        uint256 intervals = timeElapsed / FUNDING_INTERVAL;
        
        if (intervals == 0) {
            return 0;
        }
        
        uint256 feePerInterval = (position.positionSize * FUNDING_RATE) / 10000;
        return feePerInterval * intervals;
    }
    
    // ========== FALLBACK ==========
    
    receive() external payable {
        poolBalance += msg.value;
    }
}
