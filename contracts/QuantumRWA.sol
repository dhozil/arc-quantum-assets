// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title QuantumRWA
 * @dev Real-World Asset Token for Arc Blockchain
 * Tokenizes real-world assets like treasury bonds, real estate, commodities
 */
contract QuantumRWA is ERC20, ERC20Burnable, Ownable {
    // Asset metadata
    string public assetName;
    string public assetType; // TREASURY, REAL_ESTATE, COMMODITY, etc.
    uint256 public totalAssetValue; // In USDC (6 decimals)
    uint256 public apy; // Annual percentage yield in basis points (100 = 1%)
    uint256 public maturityDate; // 0 if no maturity
    
    // Minting
    bool public mintingEnabled = true;
    uint256 public maxSupply;
    
    // Events
    event AssetMinted(address indexed to, uint256 amount, uint256 timestamp);
    event AssetRedeemed(address indexed from, uint256 amount, uint256 timestamp);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    event MaturityDateUpdated(uint256 oldDate, uint256 newDate);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _assetName,
        string memory _assetType,
        uint256 _totalAssetValue,
        uint256 _apy,
        uint256 _maturityDate,
        uint256 _maxSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        assetName = _assetName;
        assetType = _assetType;
        totalAssetValue = _totalAssetValue;
        apy = _apy;
        maturityDate = _maturityDate;
        maxSupply = _maxSupply;
    }
    
    /**
     * @dev Mint new RWA tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting is disabled");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        
        _mint(to, amount);
        emit AssetMinted(to, amount, block.timestamp);
    }
    
    /**
     * @dev Redeem RWA tokens for underlying asset
     */
    function redeem(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        if (maturityDate > 0) {
            require(block.timestamp >= maturityDate, "Asset not matured yet");
        }
        
        burn(amount);
        emit AssetRedeemed(msg.sender, amount, block.timestamp);
        
        // In production, this would trigger USDC transfer
        // For testnet, we just burn the tokens
    }
    
    /**
     * @dev Update APY (only owner)
     */
    function updateAPY(uint256 newAPY) external onlyOwner {
        uint256 oldAPY = apy;
        apy = newAPY;
        emit APYUpdated(oldAPY, newAPY);
    }
    
    /**
     * @dev Update maturity date (only owner)
     */
    function updateMaturityDate(uint256 newMaturityDate) external onlyOwner {
        uint256 oldDate = maturityDate;
        maturityDate = newMaturityDate;
        emit MaturityDateUpdated(oldDate, newMaturityDate);
    }
    
    /**
     * @dev Enable/disable minting (only owner)
     */
    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
    }
    
    /**
     * @dev Get asset information
     */
    function getAssetInfo() external view returns (
        string memory _assetName,
        string memory _assetType,
        uint256 _totalAssetValue,
        uint256 _apy,
        uint256 _maturityDate,
        uint256 _totalSupply,
        uint256 _maxSupply
    ) {
        return (
            assetName,
            assetType,
            totalAssetValue,
            apy,
            maturityDate,
            totalSupply(),
            maxSupply
        );
    }
}
