// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MembershipManager
 * @notice Gestiona las membresías del sistema Numisma
 * @dev Tres niveles: Free (5x), Plus (50x), VIP (500x)
 * 
 * Niveles de Membresía:
 * - FREE: Leverage 5x, gratis, default para todos
 * - PLUS: Leverage 50x, costo 5 WLD
 * - VIP: Leverage 500x, costo 15 WLD
 * 
 * Características:
 * - Una vez comprada, la membresía es permanente
 * - No se puede bajar de nivel, solo subir
 * - Los fondos de membresías van al treasury
 * - Owner puede cambiar precios
 */
contract MembershipManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token WLD para pagos
    IERC20 public wldToken;

    // Treasury donde van los fondos
    address public treasury;

    // Enumeración de niveles
    enum MembershipTier {
        FREE,   // 0: Leverage 5x, gratis
        PLUS,   // 1: Leverage 50x, 5 WLD
        VIP     // 2: Leverage 500x, 15 WLD
    }

    // Estructura de membresía
    struct Membership {
        MembershipTier tier;
        uint256 purchasedAt;
        bool isActive;
    }

    // Mapping de usuario a membresía
    mapping(address => Membership) public memberships;

    // Precios de cada tier (en WLD con 18 decimals)
    uint256 public constant FREE_PRICE = 0;
    uint256 public plusPrice = 5 * 10**18;  // 5 WLD
    uint256 public vipPrice = 15 * 10**18;  // 15 WLD

    // Leverage de cada tier
    uint256 public constant FREE_LEVERAGE = 5;
    uint256 public constant PLUS_LEVERAGE = 50;
    uint256 public constant VIP_LEVERAGE = 500;

    // Estadísticas
    uint256 public totalMembers;
    uint256 public totalPlusMembers;
    uint256 public totalVIPMembers;

    // Eventos
    event MembershipPurchased(
        address indexed user,
        MembershipTier tier,
        uint256 price,
        uint256 timestamp
    );
    
    event MembershipUpgraded(
        address indexed user,
        MembershipTier oldTier,
        MembershipTier newTier,
        uint256 timestamp
    );

    event PriceUpdated(
        MembershipTier tier,
        uint256 oldPrice,
        uint256 newPrice
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    /**
     * @notice Constructor
     * @param _wldToken Address del token WLD
     * @param _treasury Address del treasury
     */
    constructor(address _wldToken, address _treasury) Ownable(msg.sender) {
        require(_wldToken != address(0), "Invalid WLD token");
        require(_treasury != address(0), "Invalid treasury");
        
        wldToken = IERC20(_wldToken);
        treasury = _treasury;
    }

    /**
     * @notice Comprar o mejorar membresía
     * @param tier Nivel de membresía deseado
     */
    function buyMembership(MembershipTier tier) external nonReentrant {
        require(tier != MembershipTier.FREE, "FREE tier is default");
        
        Membership storage userMembership = memberships[msg.sender];
        
        // Si es primera vez, inicializar como FREE
        if (!userMembership.isActive) {
            userMembership.tier = MembershipTier.FREE;
            userMembership.isActive = true;
            totalMembers++;
        }

        // No se puede bajar de nivel
        require(tier > userMembership.tier, "Cannot downgrade membership");

        // Obtener precio del tier
        uint256 price = getTierPrice(tier);
        require(price > 0, "Invalid tier");

        // Transferir WLD al treasury
        wldToken.safeTransferFrom(msg.sender, treasury, price);

        // Actualizar membresía
        MembershipTier oldTier = userMembership.tier;
        userMembership.tier = tier;
        userMembership.purchasedAt = block.timestamp;

        // Actualizar estadísticas
        if (tier == MembershipTier.PLUS) {
            totalPlusMembers++;
        } else if (tier == MembershipTier.VIP) {
            totalVIPMembers++;
            // Si upgrade desde PLUS, decrementar contador
            if (oldTier == MembershipTier.PLUS) {
                totalPlusMembers--;
            }
        }

        if (oldTier == MembershipTier.FREE) {
            emit MembershipPurchased(msg.sender, tier, price, block.timestamp);
        } else {
            emit MembershipUpgraded(msg.sender, oldTier, tier, block.timestamp);
        }
    }

    /**
     * @notice Obtener nivel de membresía de un usuario
     * @param user Address del usuario
     * @return MembershipTier del usuario
     */
    function getMembershipLevel(address user) external view returns (MembershipTier) {
        if (!memberships[user].isActive) {
            return MembershipTier.FREE; // Default
        }
        return memberships[user].tier;
    }

    /**
     * @notice Obtener leverage máximo permitido para un usuario
     * @param user Address del usuario
     * @return Leverage máximo (5, 50, o 500)
     */
    function getMaxLeverage(address user) external view returns (uint256) {
        if (!memberships[user].isActive) {
            return FREE_LEVERAGE; // Default
        }

        if (memberships[user].tier == MembershipTier.FREE) {
            return FREE_LEVERAGE;
        } else if (memberships[user].tier == MembershipTier.PLUS) {
            return PLUS_LEVERAGE;
        } else {
            return VIP_LEVERAGE;
        }
    }

    /**
     * @notice Obtener información completa de membresía
     * @param user Address del usuario
     * @return tier Nivel de membresía
     * @return purchasedAt Timestamp de compra
     * @return maxLeverage Leverage máximo permitido
     * @return isActive Si la membresía está activa
     */
    function getMembershipInfo(address user) 
        external 
        view 
        returns (
            MembershipTier tier,
            uint256 purchasedAt,
            uint256 maxLeverage,
            bool isActive
        ) 
    {
        Membership memory userMembership = memberships[user];
        
        if (!userMembership.isActive) {
            return (MembershipTier.FREE, 0, FREE_LEVERAGE, false);
        }

        uint256 leverage;
        if (userMembership.tier == MembershipTier.FREE) {
            leverage = FREE_LEVERAGE;
        } else if (userMembership.tier == MembershipTier.PLUS) {
            leverage = PLUS_LEVERAGE;
        } else {
            leverage = VIP_LEVERAGE;
        }

        return (
            userMembership.tier,
            userMembership.purchasedAt,
            leverage,
            userMembership.isActive
        );
    }

    /**
     * @notice Obtener precio de un tier
     * @param tier Nivel de membresía
     * @return Precio en WLD (18 decimals)
     */
    function getTierPrice(MembershipTier tier) public view returns (uint256) {
        if (tier == MembershipTier.FREE) {
            return FREE_PRICE;
        } else if (tier == MembershipTier.PLUS) {
            return plusPrice;
        } else if (tier == MembershipTier.VIP) {
            return vipPrice;
        }
        return 0;
    }

    /**
     * @notice Verificar si un usuario tiene membresía activa
     * @param user Address del usuario
     * @return true si tiene membresía activa
     */
    function hasMembership(address user) external view returns (bool) {
        return memberships[user].isActive;
    }

    /**
     * @notice Verificar si un usuario tiene al menos un tier específico
     * @param user Address del usuario
     * @param minTier Tier mínimo requerido
     * @return true si el usuario tiene ese tier o superior
     */
    function hasMinimumTier(address user, MembershipTier minTier) 
        external 
        view 
        returns (bool) 
    {
        if (!memberships[user].isActive) {
            return minTier == MembershipTier.FREE;
        }
        return memberships[user].tier >= minTier;
    }

    // ========== FUNCIONES DE ADMINISTRACIÓN ==========

    /**
     * @notice Actualizar precio de membresía PLUS
     * @param newPrice Nuevo precio en WLD (18 decimals)
     */
    function setPlusPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be > 0");
        uint256 oldPrice = plusPrice;
        plusPrice = newPrice;
        emit PriceUpdated(MembershipTier.PLUS, oldPrice, newPrice);
    }

    /**
     * @notice Actualizar precio de membresía VIP
     * @param newPrice Nuevo precio en WLD (18 decimals)
     */
    function setVIPPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be > 0");
        require(newPrice > plusPrice, "VIP must be more expensive than PLUS");
        uint256 oldPrice = vipPrice;
        vipPrice = newPrice;
        emit PriceUpdated(MembershipTier.VIP, oldPrice, newPrice);
    }

    /**
     * @notice Actualizar dirección del treasury
     * @param newTreasury Nueva dirección del treasury
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Otorgar membresía manualmente (solo owner, para promociones)
     * @param user Address del usuario
     * @param tier Nivel a otorgar
     */
    function grantMembership(address user, MembershipTier tier) external onlyOwner {
        require(user != address(0), "Invalid user");
        
        Membership storage userMembership = memberships[user];
        
        if (!userMembership.isActive) {
            userMembership.isActive = true;
            totalMembers++;
        }

        MembershipTier oldTier = userMembership.tier;
        userMembership.tier = tier;
        userMembership.purchasedAt = block.timestamp;

        // Actualizar estadísticas
        if (tier == MembershipTier.PLUS && oldTier != MembershipTier.PLUS) {
            totalPlusMembers++;
        } else if (tier == MembershipTier.VIP && oldTier != MembershipTier.VIP) {
            totalVIPMembers++;
            if (oldTier == MembershipTier.PLUS) {
                totalPlusMembers--;
            }
        }

        emit MembershipPurchased(user, tier, 0, block.timestamp);
    }

    /**
     * @notice Obtener estadísticas generales
     * @return total Total de miembros
     * @return plus Total de miembros PLUS
     * @return vip Total de miembros VIP
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 total,
            uint256 plus,
            uint256 vip
        ) 
    {
        return (totalMembers, totalPlusMembers, totalVIPMembers);
    }
}
