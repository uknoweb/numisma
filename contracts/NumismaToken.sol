// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NumismaToken
 * @dev Token ERC-20 para el ecosistema Numisma
 * 
 * Supply Total: 1,000,000,000 NUMA
 * 
 * Distribución:
 * - TradingPool:     400,000,000 NUMA (40%) - Liquidez para ganancias
 * - StakingRewards:  300,000,000 NUMA (30%) - Recompensas diarias
 * - PioneerVault:    100,000,000 NUMA (10%) - Pagos pioneros
 * - TeamVesting:     100,000,000 NUMA (10%) - Equipo (lock 1 año)
 * - Treasury:        100,000,000 NUMA (10%) - Reserva emergencia
 */
contract NumismaToken is ERC20, ERC20Burnable, Ownable {
    
    // Supply total: 1 mil millones de NUMA
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // Distribución de tokens
    uint256 public constant TRADING_POOL_ALLOCATION = 400_000_000 * 10**18;  // 40%
    uint256 public constant STAKING_REWARDS_ALLOCATION = 300_000_000 * 10**18; // 30%
    uint256 public constant PIONEER_VAULT_ALLOCATION = 100_000_000 * 10**18;   // 10%
    uint256 public constant TEAM_VESTING_ALLOCATION = 100_000_000 * 10**18;    // 10%
    uint256 public constant TREASURY_ALLOCATION = 100_000_000 * 10**18;        // 10%
    
    // Direcciones para la distribución inicial
    address public tradingPool;
    address public stakingRewards;
    address public pioneerVault;
    address public teamVesting;
    address public treasury;
    
    // Control de distribución inicial
    bool public initialDistributionCompleted;
    
    /**
     * @dev Constructor - Mint del supply total al deployer
     * La distribución se hace después con setDistributionAddresses()
     */
    constructor() ERC20("Numisma", "NUMA") Ownable(msg.sender) {
        // Mint del supply total al deployer
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    /**
     * @dev Configurar las direcciones de distribución y transferir tokens
     * Solo puede llamarse una vez por el owner
     */
    function setDistributionAddresses(
        address _tradingPool,
        address _stakingRewards,
        address _pioneerVault,
        address _teamVesting,
        address _treasury
    ) external onlyOwner {
        require(!initialDistributionCompleted, "Distribution already completed");
        require(_tradingPool != address(0), "Invalid trading pool address");
        require(_stakingRewards != address(0), "Invalid staking rewards address");
        require(_pioneerVault != address(0), "Invalid pioneer vault address");
        require(_teamVesting != address(0), "Invalid team vesting address");
        require(_treasury != address(0), "Invalid treasury address");
        
        tradingPool = _tradingPool;
        stakingRewards = _stakingRewards;
        pioneerVault = _pioneerVault;
        teamVesting = _teamVesting;
        treasury = _treasury;
        
        // Distribuir tokens según tokenomics
        _transfer(msg.sender, tradingPool, TRADING_POOL_ALLOCATION);
        _transfer(msg.sender, stakingRewards, STAKING_REWARDS_ALLOCATION);
        _transfer(msg.sender, pioneerVault, PIONEER_VAULT_ALLOCATION);
        _transfer(msg.sender, teamVesting, TEAM_VESTING_ALLOCATION);
        _transfer(msg.sender, treasury, TREASURY_ALLOCATION);
        
        initialDistributionCompleted = true;
        
        emit DistributionCompleted(
            tradingPool,
            stakingRewards,
            pioneerVault,
            teamVesting,
            treasury
        );
    }
    
    /**
     * @dev Permite al owner hacer mint adicional en caso de necesidad
     * (Por ejemplo, para rewards extras o correcciones)
     * IMPORTANTE: Usar con precaución para no inflar el supply
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Override para agregar lógica personalizada si es necesario
     * Por ahora solo hereda de ERC20
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        super._update(from, to, value);
    }
    
    // Events
    event DistributionCompleted(
        address indexed tradingPool,
        address indexed stakingRewards,
        address indexed pioneerVault,
        address teamVesting,
        address treasury
    );
}
