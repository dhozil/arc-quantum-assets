// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleToken
 * @dev Simple ERC20 token for testing escrow functionality
 */
contract SimpleToken is ERC20, Ownable {
    
    constructor() Ownable(msg.sender) ERC20("Test Token", "TEST") {
        // Mint 1,000,000 tokens to deployer
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }
    
    /**
     * @dev Mint tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
