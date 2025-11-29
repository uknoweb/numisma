// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PioneerVault
 * @notice Vault para los top 100 holders con capital bloqueado en NUMA
 * @dev Sistema de recompensas para early adopters
 * 
 * Características:
 * - Solo los top 100 holders por capital depositado
 * - Lock period de 1 año desde el depósito
 * - Ganan 5% de las ganancias del pool de trading
 * - Penalty de 20% por retiro anticipado (antes de 1 año)
 * - Ranking automático basado en capital
 * - Capital depositado en NUMA tokens
 */
contract PioneerVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ========== CONSTANTES ==========
    
    uint256 public constant MAX_PIONEERS = 100;
    uint256 public constant LOCK_PERIOD = 365 days;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 20; // 20%
    uint256 public constant PROFIT_SHARE = 5; // 5% de profits del pool
    
    // ========== TOKENS ==========
    
    IERC20 public numaToken;
    
    // ========== ESTRUCTURAS ==========
    
    struct Pioneer {
        uint256 capitalDeposited;
        uint256 depositTimestamp;
        uint256 profitsAccumulated;
        uint256 profitsClaimed;
        bool isActive;
        uint256 ranking; // 1-100
    }
    
    // ========== VARIABLES DE ESTADO ==========
    
    mapping(address => Pioneer) public pioneers;
    address[] public pioneerAddresses; // Lista ordenada por capital
    
    uint256 public totalCapitalLocked;
    uint256 public totalProfitsDistributed;
    uint256 public minCapitalRequired; // Mínimo para entrar al top 100
    
    // Pool address que distribuye profits
    address public tradingPool;
    
    // ========== EVENTOS ==========
    
    event CapitalDeposited(
        address indexed pioneer,
        uint256 amount,
        uint256 newRanking,
        uint256 timestamp
    );
    
    event CapitalWithdrawn(
        address indexed pioneer,
        uint256 amount,
        uint256 penalty,
        bool isEarly
    );
    
    event ProfitsDistributed(
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event ProfitsClaimed(
        address indexed pioneer,
        uint256 amount
    );
    
    event RankingUpdated(
        address indexed pioneer,
        uint256 oldRanking,
        uint256 newRanking
    );
    
    event TradingPoolUpdated(
        address indexed oldPool,
        address indexed newPool
    );
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _numaToken,
        address _tradingPool
    ) Ownable(msg.sender) {
        require(_numaToken != address(0), "Invalid NUMA token");
        require(_tradingPool != address(0), "Invalid trading pool");
        
        numaToken = IERC20(_numaToken);
        tradingPool = _tradingPool;
    }
    
    // ========== FUNCIONES PRINCIPALES ==========
    
    /**
     * @notice Depositar capital para convertirse en Pioneer
     * @param amount Cantidad de NUMA a depositar
     */
    function depositCapital(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        Pioneer storage pioneer = pioneers[msg.sender];
        
        // Transferir tokens
        numaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Si es nuevo pioneer
        if (!pioneer.isActive) {
            // Verificar si hay espacio o si tiene suficiente capital
            if (pioneerAddresses.length >= MAX_PIONEERS) {
                require(
                    pioneer.capitalDeposited + amount > minCapitalRequired,
                    "Insufficient capital to enter top 100"
                );
            }
            
            pioneer.isActive = true;
            pioneer.depositTimestamp = block.timestamp;
            pioneerAddresses.push(msg.sender);
        }
        
        // Actualizar capital
        uint256 oldRanking = pioneer.ranking;
        pioneer.capitalDeposited += amount;
        totalCapitalLocked += amount;
        
        // Recalcular rankings
        _updateRankings();
        
        // Si cayó fuera del top 100, desactivar
        if (pioneerAddresses.length > MAX_PIONEERS && pioneer.ranking > MAX_PIONEERS) {
            _removePioneer(msg.sender);
            revert("Pushed out of top 100");
        }
        
        emit CapitalDeposited(msg.sender, amount, pioneer.ranking, block.timestamp);
        
        if (oldRanking != pioneer.ranking) {
            emit RankingUpdated(msg.sender, oldRanking, pioneer.ranking);
        }
    }
    
    /**
     * @notice Retirar capital (puede tener penalty si es antes de 1 año)
     * @param amount Cantidad a retirar
     */
    function withdrawCapital(uint256 amount) external nonReentrant {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.isActive, "Not a pioneer");
        require(amount > 0 && amount <= pioneer.capitalDeposited, "Invalid amount");
        
        bool isEarlyWithdrawal = block.timestamp < pioneer.depositTimestamp + LOCK_PERIOD;
        uint256 penalty = 0;
        uint256 amountToSend = amount;
        
        // Calcular penalty si es retiro anticipado
        if (isEarlyWithdrawal) {
            penalty = (amount * EARLY_WITHDRAWAL_PENALTY) / 100;
            amountToSend = amount - penalty;
            // Penalty va al vault (redistribuido a otros pioneers)
        }
        
        // Actualizar balances
        pioneer.capitalDeposited -= amount;
        totalCapitalLocked -= amount;
        
        // Si retira todo, desactivar
        if (pioneer.capitalDeposited == 0) {
            _removePioneer(msg.sender);
        } else {
            // Recalcular rankings
            _updateRankings();
        }
        
        // Transferir tokens
        numaToken.safeTransfer(msg.sender, amountToSend);
        
        emit CapitalWithdrawn(msg.sender, amountToSend, penalty, isEarlyWithdrawal);
    }
    
    /**
     * @notice Reclamar profits acumulados
     */
    function claimProfits() external nonReentrant {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.isActive, "Not a pioneer");
        require(pioneer.profitsAccumulated > pioneer.profitsClaimed, "No profits to claim");
        
        uint256 claimable = pioneer.profitsAccumulated - pioneer.profitsClaimed;
        pioneer.profitsClaimed += claimable;
        
        numaToken.safeTransfer(msg.sender, claimable);
        
        emit ProfitsClaimed(msg.sender, claimable);
    }
    
    /**
     * @notice Distribuir profits del pool entre pioneers (llamado por pool o owner)
     * @param amount Cantidad total a distribuir
     */
    function distributeProfits(uint256 amount) external {
        require(msg.sender == tradingPool || msg.sender == owner(), "Unauthorized");
        require(amount > 0, "Amount must be > 0");
        require(totalCapitalLocked > 0, "No capital locked");
        
        // Transferir tokens al vault
        numaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Distribuir proporcionalmente según capital
        for (uint256 i = 0; i < pioneerAddresses.length && i < MAX_PIONEERS; i++) {
            address pioneerAddr = pioneerAddresses[i];
            Pioneer storage pioneer = pioneers[pioneerAddr];
            
            if (pioneer.isActive && pioneer.capitalDeposited > 0) {
                uint256 share = (amount * pioneer.capitalDeposited) / totalCapitalLocked;
                pioneer.profitsAccumulated += share;
            }
        }
        
        totalProfitsDistributed += amount;
        
        emit ProfitsDistributed(amount, block.timestamp);
    }
    
    // ========== FUNCIONES DE LECTURA ==========
    
    /**
     * @notice Obtener ranking de un pioneer
     */
    function getRanking(address pioneer) external view returns (uint256) {
        return pioneers[pioneer].ranking;
    }
    
    /**
     * @notice Obtener información completa de un pioneer
     */
    function getPioneerInfo(address pioneer) 
        external 
        view 
        returns (
            uint256 capitalDeposited,
            uint256 depositTimestamp,
            uint256 profitsAccumulated,
            uint256 profitsClaimed,
            uint256 ranking,
            bool isActive,
            bool canWithdrawWithoutPenalty,
            uint256 claimableProfits
        ) 
    {
        Pioneer memory p = pioneers[pioneer];
        return (
            p.capitalDeposited,
            p.depositTimestamp,
            p.profitsAccumulated,
            p.profitsClaimed,
            p.ranking,
            p.isActive,
            block.timestamp >= p.depositTimestamp + LOCK_PERIOD,
            p.profitsAccumulated - p.profitsClaimed
        );
    }
    
    /**
     * @notice Obtener top N pioneers
     */
    function getTopPioneers(uint256 n) 
        external 
        view 
        returns (
            address[] memory addresses,
            uint256[] memory capitals,
            uint256[] memory rankings
        ) 
    {
        uint256 count = n > pioneerAddresses.length ? pioneerAddresses.length : n;
        count = count > MAX_PIONEERS ? MAX_PIONEERS : count;
        
        addresses = new address[](count);
        capitals = new uint256[](count);
        rankings = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address addr = pioneerAddresses[i];
            addresses[i] = addr;
            capitals[i] = pioneers[addr].capitalDeposited;
            rankings[i] = pioneers[addr].ranking;
        }
        
        return (addresses, capitals, rankings);
    }
    
    /**
     * @notice Obtener estadísticas generales
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 activePioneers,
            uint256 totalLocked,
            uint256 totalDistributed,
            uint256 minCapital
        ) 
    {
        uint256 active = 0;
        for (uint256 i = 0; i < pioneerAddresses.length && i < MAX_PIONEERS; i++) {
            if (pioneers[pioneerAddresses[i]].isActive) {
                active++;
            }
        }
        
        return (
            active,
            totalCapitalLocked,
            totalProfitsDistributed,
            minCapitalRequired
        );
    }
    
    // ========== FUNCIONES INTERNAS ==========
    
    /**
     * @notice Recalcular rankings basado en capital
     */
    function _updateRankings() internal {
        // Ordenar por capital (bubble sort - OK para 100 elementos)
        for (uint256 i = 0; i < pioneerAddresses.length; i++) {
            for (uint256 j = i + 1; j < pioneerAddresses.length; j++) {
                if (pioneers[pioneerAddresses[j]].capitalDeposited > 
                    pioneers[pioneerAddresses[i]].capitalDeposited) {
                    address temp = pioneerAddresses[i];
                    pioneerAddresses[i] = pioneerAddresses[j];
                    pioneerAddresses[j] = temp;
                }
            }
        }
        
        // Asignar rankings
        for (uint256 i = 0; i < pioneerAddresses.length; i++) {
            pioneers[pioneerAddresses[i]].ranking = i + 1;
        }
        
        // Actualizar mínimo requerido (capital del #100)
        if (pioneerAddresses.length >= MAX_PIONEERS) {
            minCapitalRequired = pioneers[pioneerAddresses[MAX_PIONEERS - 1]].capitalDeposited;
        }
    }
    
    /**
     * @notice Remover pioneer de la lista
     */
    function _removePioneer(address pioneer) internal {
        pioneers[pioneer].isActive = false;
        pioneers[pioneer].ranking = 0;
        
        // Encontrar y remover de array
        for (uint256 i = 0; i < pioneerAddresses.length; i++) {
            if (pioneerAddresses[i] == pioneer) {
                pioneerAddresses[i] = pioneerAddresses[pioneerAddresses.length - 1];
                pioneerAddresses.pop();
                break;
            }
        }
        
        _updateRankings();
    }
    
    // ========== FUNCIONES ADMINISTRATIVAS ==========
    
    /**
     * @notice Actualizar dirección del trading pool
     */
    function setTradingPool(address newPool) external onlyOwner {
        require(newPool != address(0), "Invalid pool");
        address oldPool = tradingPool;
        tradingPool = newPool;
        emit TradingPoolUpdated(oldPool, newPool);
    }
    
    /**
     * @notice Emergency withdraw (solo owner, solo si no hay pioneers activos)
     */
    function emergencyWithdraw() external onlyOwner {
        require(pioneerAddresses.length == 0, "Active pioneers exist");
        uint256 balance = numaToken.balanceOf(address(this));
        numaToken.safeTransfer(owner(), balance);
    }
}
