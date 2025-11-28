// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PioneerVault
 * @notice Sistema de Pioneros con Vesting y Retiro Parcial del 30%
 * @dev Reglas:
 * - 100 pioneros máximo ordenados por capital bloqueado
 * - 1 año de vesting obligatorio
 * - Retiro anticipado: penalización del 20%
 * - Retiro post-vesting: máximo 30% del capital, el 70% sigue bloqueado
 * - Si retira más del 30%: penalización del 20% total
 * - 5% de ganancias distribuidas cada 15 días
 */
contract PioneerVault is Ownable, ReentrancyGuard {
    struct Pioneer {
        address wallet;
        uint256 capitalLocked;
        uint256 lockedUntil;
        uint256 earningsAccumulated;
        uint256 lastPaymentTimestamp;
        bool hasActiveLoan;
        uint256 rank;
        uint256 totalWithdrawnAfterVesting; // Track withdrawals post-vesting
    }
    
    mapping(address => Pioneer) public pioneers;
    address[] public pioneerList;
    
    uint256 public constant MAX_PIONEERS = 100;
    uint256 public constant LOCK_PERIOD = 365 days;
    uint256 public constant EARNINGS_SHARE = 5; // 5%
    uint256 public constant PAYMENT_INTERVAL = 15 days;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 20; // 20%
    uint256 public constant MAX_VESTED_WITHDRAWAL_PERCENT = 30; // 30% máximo
    
    uint256 public totalEarningsPool;
    
    event PioneerJoined(address indexed pioneer, uint256 capitalLocked, uint256 rank);
    event EarningsDistributed(uint256 totalAmount);
    event EarlyWithdrawal(address indexed pioneer, uint256 penalty);
    event VestedWithdrawal(address indexed pioneer, uint256 amount, uint256 remaining);
    event PenalizedWithdrawal(address indexed pioneer, uint256 penalty);
    
    constructor() Ownable(msg.sender) {}
    
    function joinPioneers() external payable {
        require(msg.value > 0, "Must lock capital");
        require(pioneers[msg.sender].capitalLocked == 0, "Already a pioneer");
        
        pioneers[msg.sender] = Pioneer({
            wallet: msg.sender,
            capitalLocked: msg.value,
            lockedUntil: block.timestamp + LOCK_PERIOD,
            earningsAccumulated: 0,
            lastPaymentTimestamp: block.timestamp,
            hasActiveLoan: false,
            rank: 0,
            totalWithdrawnAfterVesting: 0
        });
        
        pioneerList.push(msg.sender);
        _updateRankings();
        
        // Verificar límite de 100 pioneros
        if (pioneerList.length > MAX_PIONEERS) {
            // Expulsar al último (rank 101)
            address lastPioneer = pioneerList[pioneerList.length - 1];
            uint256 returnAmount = pioneers[lastPioneer].capitalLocked;
            delete pioneers[lastPioneer];
            pioneerList.pop();
            
            payable(lastPioneer).transfer(returnAmount);
        }
        
        emit PioneerJoined(msg.sender, msg.value, pioneers[msg.sender].rank);
    }
    
    function _updateRankings() internal {
        // Ordenar pioneros por capital bloqueado (bubble sort)
        for (uint i = 0; i < pioneerList.length; i++) {
            for (uint j = i + 1; j < pioneerList.length; j++) {
                if (pioneers[pioneerList[j]].capitalLocked > pioneers[pioneerList[i]].capitalLocked) {
                    address temp = pioneerList[i];
                    pioneerList[i] = pioneerList[j];
                    pioneerList[j] = temp;
                }
            }
        }
        
        // Actualizar ranks
        for (uint i = 0; i < pioneerList.length; i++) {
            pioneers[pioneerList[i]].rank = i + 1;
        }
    }
    
    function distributeEarnings() external onlyOwner {
        require(pioneerList.length > 0, "No pioneers");
        
        uint256 amountPerPioneer = (totalEarningsPool * EARNINGS_SHARE) / (100 * pioneerList.length);
        
        for (uint i = 0; i < pioneerList.length; i++) {
            Pioneer storage pioneer = pioneers[pioneerList[i]];
            
            if (block.timestamp >= pioneer.lastPaymentTimestamp + PAYMENT_INTERVAL) {
                pioneer.earningsAccumulated += amountPerPioneer;
                pioneer.lastPaymentTimestamp = block.timestamp;
            }
        }
        
        emit EarningsDistributed(totalEarningsPool * EARNINGS_SHARE / 100);
    }
    
    function withdrawEarnings() external nonReentrant {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.earningsAccumulated > 0, "No earnings");
        
        uint256 amount = pioneer.earningsAccumulated;
        pioneer.earningsAccumulated = 0;
        
        payable(msg.sender).transfer(amount);
    }
    
    /**
     * @notice Retiro anticipado con penalización del 20%
     */
    function withdrawEarly() external nonReentrant {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.capitalLocked > 0, "Not a pioneer");
        require(block.timestamp < pioneer.lockedUntil, "Lock period ended");
        require(!pioneer.hasActiveLoan, "Has active loan");
        
        uint256 penalty = (pioneer.capitalLocked * EARLY_WITHDRAWAL_PENALTY) / 100;
        uint256 returnAmount = pioneer.capitalLocked - penalty;
        
        delete pioneers[msg.sender];
        
        // Remover de lista
        _removePioneer(msg.sender);
        _updateRankings();
        
        payable(owner()).transfer(penalty);
        payable(msg.sender).transfer(returnAmount);
        
        emit EarlyWithdrawal(msg.sender, penalty);
    }
    
    /**
     * @notice Retiro DESPUÉS del vesting (1 año cumplido)
     * @dev REGLA: Máximo 30% del capital original
     * - Si retira <= 30%: sin penalización, mantiene estatus Pioneer
     * - Si retira > 30%: penalización del 20% total y pierde estatus
     * @param amount Cantidad a retirar en WLD
     */
    function withdrawAfterVesting(uint256 amount) external nonReentrant {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.capitalLocked > 0, "Not a pioneer");
        require(block.timestamp >= pioneer.lockedUntil, "Still locked");
        require(!pioneer.hasActiveLoan, "Has active loan");
        require(amount > 0, "Amount must be > 0");
        
        uint256 originalCapital = pioneer.capitalLocked + pioneer.totalWithdrawnAfterVesting;
        uint256 maxAllowed = (originalCapital * MAX_VESTED_WITHDRAWAL_PERCENT) / 100;
        uint256 totalWithdrawn = pioneer.totalWithdrawnAfterVesting + amount;
        
        // Caso 1: Retira <= 30% acumulado - SIN PENALIZACIÓN
        if (totalWithdrawn <= maxAllowed) {
            require(amount <= pioneer.capitalLocked, "Insufficient balance");
            
            pioneer.capitalLocked -= amount;
            pioneer.totalWithdrawnAfterVesting += amount;
            
            // Actualizar rankings (su capital disminuyó)
            _updateRankings();
            
            payable(msg.sender).transfer(amount);
            
            emit VestedWithdrawal(msg.sender, amount, pioneer.capitalLocked);
        } 
        // Caso 2: Retira > 30% - PENALIZACIÓN DEL 20% SOBRE TODO
        else {
            uint256 totalCapital = pioneer.capitalLocked + pioneer.earningsAccumulated;
            uint256 penalty = (totalCapital * EARLY_WITHDRAWAL_PENALTY) / 100;
            uint256 returnAmount = totalCapital - penalty;
            
            delete pioneers[msg.sender];
            _removePioneer(msg.sender);
            _updateRankings();
            
            payable(owner()).transfer(penalty);
            payable(msg.sender).transfer(returnAmount);
            
            emit PenalizedWithdrawal(msg.sender, penalty);
        }
    }
    
    /**
     * @notice Retiro TOTAL después del vesting (pierde estatus Pioneer)
     */
    function withdrawFullAfterVesting() external nonReentrant {
        Pioneer storage pioneer = pioneers[msg.sender];
        require(pioneer.capitalLocked > 0, "Not a pioneer");
        require(block.timestamp >= pioneer.lockedUntil, "Still locked");
        require(!pioneer.hasActiveLoan, "Has active loan");
        
        uint256 amount = pioneer.capitalLocked + pioneer.earningsAccumulated;
        delete pioneers[msg.sender];
        
        _removePioneer(msg.sender);
        _updateRankings();
        
        payable(msg.sender).transfer(amount);
    }
    
    function _removePioneer(address pioneerAddress) internal {
        for (uint i = 0; i < pioneerList.length; i++) {
            if (pioneerList[i] == pioneerAddress) {
                pioneerList[i] = pioneerList[pioneerList.length - 1];
                pioneerList.pop();
                break;
            }
        }
    }
    
    function setActiveLoan(address pioneer, bool status) external onlyOwner {
        pioneers[pioneer].hasActiveLoan = status;
    }
    
    function addToEarningsPool() external payable onlyOwner {
        totalEarningsPool += msg.value;
    }
    
    function getPioneerCount() external view returns (uint256) {
        return pioneerList.length;
    }
    
    function getPioneerInfo(address pioneerAddress) external view returns (Pioneer memory) {
        return pioneers[pioneerAddress];
    }
    
    function getTopPioneers(uint256 count) external view returns (address[] memory) {
        uint256 limit = count > pioneerList.length ? pioneerList.length : count;
        address[] memory top = new address[](limit);
        
        for (uint i = 0; i < limit; i++) {
            top[i] = pioneerList[i];
        }
        
        return top;
    }
    
    receive() external payable {
        totalEarningsPool += msg.value;
    }
}
