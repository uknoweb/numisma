// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWLD
 * @notice Mock Worldcoin token para testing en World Chain Sepolia
 * @dev Este es SOLO para testing. En mainnet usar el WLD token oficial.
 */
contract MockWLD is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 * 10**18; // 10B WLD

    constructor() ERC20("Worldcoin (Mock)", "WLD") Ownable(msg.sender) {
        // Mint initial supply al deployer para testing
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Mint tokens (solo owner, para testing)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function para que traders obtengan WLD de prueba
     */
    function faucet() external {
        // Da 1000 WLD a quien llame el faucet
        _mint(msg.sender, 1000 * 10**18);
    }
}
