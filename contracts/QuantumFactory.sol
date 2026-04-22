// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QuantumRWA.sol";

/**
 * @title QuantumFactory
 * @dev Factory contract to deploy new RWA tokens
 */
contract QuantumFactory {
    address[] public deployedTokens;
    mapping(address => bool) public isTokenDeployed;
    
    event TokenDeployed(address indexed tokenAddress, string indexed assetName, address indexed deployer);
    
    /**
     * @dev Deploy a new RWA token
     */
    function deployToken(
        string memory _name,
        string memory _symbol,
        string memory _assetName,
        string memory _assetType,
        uint256 _totalAssetValue,
        uint256 _apy,
        uint256 _maturityDate,
        uint256 _maxSupply
    ) external returns (address) {
        QuantumRWA token = new QuantumRWA(
            _name,
            _symbol,
            _assetName,
            _assetType,
            _totalAssetValue,
            _apy,
            _maturityDate,
            _maxSupply
        );
        
        address tokenAddress = address(token);
        deployedTokens.push(tokenAddress);
        isTokenDeployed[tokenAddress] = true;
        
        emit TokenDeployed(tokenAddress, _assetName, msg.sender);
        
        return tokenAddress;
    }
    
    /**
     * @dev Get all deployed tokens
     */
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
    
    /**
     * @dev Get number of deployed tokens
     */
    function getDeployedTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }
}
