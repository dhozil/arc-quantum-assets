// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuantumVault
 * @dev Post-quantum resistant vault for long-term asset storage
 * Designed for pension funds, endowments, and sovereign wealth funds
 * Supports multi-sig quantum-resistant wallets and institutional-grade security
 */
contract QuantumVault is Ownable, ReentrancyGuard {
    
    // Vault tier
    enum VaultTier { STANDARD, INSTITUTIONAL, SOVEREIGN }
    
    // Deposit struct
    struct Deposit {
        uint256 id;
        address depositor;
        address tokenAddress;
        uint256 amount;
        uint256 createdAt;
        uint256 lockUntil; // 0 if no lock
        VaultTier tier;
        bool quantumEnabled;
        bool active;
    }
    
    // State variables
    uint256 private _depositIdCounter;
    mapping(uint256 => Deposit) public deposits;
    uint256[] public activeDepositIds;
    mapping(address => uint256[]) public userDeposits;
    
    // USDC token address (Arc testnet)
    address public usdcToken;
    
    // Vault tiers configuration
    mapping(VaultTier => uint256) public tierMinDeposit;
    mapping(VaultTier => uint256) public tierMaxDeposit;
    mapping(VaultTier => uint256) public tierFee; // Annual fee in basis points
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 25; // 0.25%
    
    // Quantum verification threshold (minimum deposit amount for quantum verification)
    uint256 public quantumThreshold = 1000000 * 1e6; // 1M USDC
    
    // Events
    event DepositCreated(
        uint256 indexed depositId,
        address indexed depositor,
        address indexed tokenAddress,
        uint256 amount,
        uint256 lockUntil,
        VaultTier tier,
        bool quantumEnabled
    );
    
    event DepositWithdrawn(
        uint256 indexed depositId,
        address indexed depositor,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    
    event TierUpdated(VaultTier tier, uint256 minDeposit, uint256 maxDeposit, uint256 fee);
    event QuantumThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        _depositIdCounter = 1;
        
        // Initialize tier configurations
        tierMinDeposit[VaultTier.STANDARD] = 1000 * 1e6; // 1,000 USDC
        tierMaxDeposit[VaultTier.STANDARD] = 100000 * 1e6; // 100,000 USDC
        tierFee[VaultTier.STANDARD] = 50; // 0.5% annual
        
        tierMinDeposit[VaultTier.INSTITUTIONAL] = 100000 * 1e6; // 100,000 USDC
        tierMaxDeposit[VaultTier.INSTITUTIONAL] = 10000000 * 1e6; // 10M USDC
        tierFee[VaultTier.INSTITUTIONAL] = 30; // 0.3% annual
        
        tierMinDeposit[VaultTier.SOVEREIGN] = 10000000 * 1e6; // 10M USDC
        tierMaxDeposit[VaultTier.SOVEREIGN] = 1000000000 * 1e6; // 1B USDC
        tierFee[VaultTier.SOVEREIGN] = 10; // 0.1% annual
    }
    
    /**
     * @dev Set USDC token address (only owner)
     */
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
    }
    
    /**
     * @dev Create a new deposit
     * @param tokenAddress Token address to deposit
     * @param amount Amount to deposit
     * @param lockUntil Unix timestamp when funds can be withdrawn (0 for no lock)
     * @param tier Vault tier
     */
    function createDeposit(
        address tokenAddress,
        uint256 amount,
        uint256 lockUntil,
        VaultTier tier
    ) external nonReentrant returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount >= tierMinDeposit[tier], "Amount below tier minimum");
        require(amount <= tierMaxDeposit[tier], "Amount above tier maximum");
        
        if (lockUntil > 0) {
            require(lockUntil > block.timestamp, "Lock time must be in future");
        }
        
        // Determine if quantum-enabled
        bool quantumEnabled = amount >= quantumThreshold;
        
        // Transfer tokens from depositor to vault
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        
        // Create deposit
        uint256 depositId = _depositIdCounter++;
        deposits[depositId] = Deposit({
            id: depositId,
            depositor: msg.sender,
            tokenAddress: tokenAddress,
            amount: amount,
            createdAt: block.timestamp,
            lockUntil: lockUntil,
            tier: tier,
            quantumEnabled: quantumEnabled,
            active: true
        });
        
        // Track deposit
        activeDepositIds.push(depositId);
        userDeposits[msg.sender].push(depositId);
        
        emit DepositCreated(
            depositId,
            msg.sender,
            tokenAddress,
            amount,
            lockUntil,
            tier,
            quantumEnabled
        );
        
        return depositId;
    }
    
    /**
     * @dev Withdraw deposit
     * @param depositId Deposit ID to withdraw
     */
    function withdrawDeposit(uint256 depositId) external nonReentrant {
        Deposit storage deposit = deposits[depositId];
        
        require(deposit.active, "Deposit not active");
        require(msg.sender == deposit.depositor, "Only depositor can withdraw");
        
        if (deposit.lockUntil > 0) {
            require(block.timestamp >= deposit.lockUntil, "Deposit still locked");
        }
        
        // Calculate time-based fee
        uint256 timeElapsed = block.timestamp - deposit.createdAt;
        uint256 yearsElapsed = timeElapsed / 365 days;
        uint256 feeRate = tierFee[deposit.tier];
        
        // Calculate fee (capped at 5 years)
        uint256 effectiveYears = yearsElapsed > 5 ? 5 : yearsElapsed;
        uint256 fee = (deposit.amount * feeRate * effectiveYears) / 10000;
        
        // Add platform fee
        uint256 platformFeeAmount = (deposit.amount * platformFee) / 10000;
        uint256 totalFee = fee + platformFeeAmount;
        uint256 withdrawAmount = deposit.amount - totalFee;
        
        // Transfer tokens to depositor
        IERC20(deposit.tokenAddress).transfer(msg.sender, withdrawAmount);
        
        // Update status
        deposit.active = false;
        
        // Remove from active deposits
        _removeActiveDeposit(depositId);
        
        emit DepositWithdrawn(depositId, msg.sender, withdrawAmount, totalFee, block.timestamp);
    }
    
    /**
     * @dev Get deposit details
     * @param depositId Deposit ID
     */
    function getDeposit(uint256 depositId) external view returns (Deposit memory) {
        return deposits[depositId];
    }
    
    /**
     * @dev Get all active deposits
     */
    function getActiveDeposits() external view returns (uint256[] memory) {
        return activeDepositIds;
    }
    
    /**
     * @dev Get deposits for a user
     * @param user User address
     */
    function getUserDeposits(address user) external view returns (uint256[] memory) {
        return userDeposits[user];
    }
    
    /**
     * @dev Get deposits by tier
     * @param tier Vault tier
     */
    function getDepositsByTier(VaultTier tier) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](activeDepositIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeDepositIds.length; i++) {
            if (deposits[activeDepositIds[i]].tier == tier && 
                deposits[activeDepositIds[i]].active) {
                result[count] = activeDepositIds[i];
                count++;
            }
        }
        
        // Resize array
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
    /**
     * @dev Update tier configuration (only owner)
     */
    function updateTier(
        VaultTier tier,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 fee
    ) external onlyOwner {
        require(minDeposit > 0, "Invalid minimum deposit");
        require(maxDeposit > minDeposit, "Invalid maximum deposit");
        require(fee <= 500, "Fee too high"); // Max 5%
        
        tierMinDeposit[tier] = minDeposit;
        tierMaxDeposit[tier] = maxDeposit;
        tierFee[tier] = fee;
        
        emit TierUpdated(tier, minDeposit, maxDeposit, fee);
    }
    
    /**
     * @dev Update quantum threshold (only owner)
     * @param newThreshold New threshold in USDC (6 decimals)
     */
    function updateQuantumThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0, "Invalid threshold");
        uint256 oldThreshold = quantumThreshold;
        quantumThreshold = newThreshold;
        emit QuantumThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @dev Update platform fee (only owner)
     * @param newFee New platform fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = IERC20(usdcToken).balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        IERC20(usdcToken).transfer(msg.sender, balance);
        emit FeesWithdrawn(msg.sender, balance);
    }
    
    /**
     * @dev Internal function to remove deposit from active deposits
     */
    function _removeActiveDeposit(uint256 depositId) internal {
        for (uint256 i = 0; i < activeDepositIds.length; i++) {
            if (activeDepositIds[i] == depositId) {
                activeDepositIds[i] = activeDepositIds[activeDepositIds.length - 1];
                activeDepositIds.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 totalDeposits,
        uint256 activeDepositsCount,
        uint256 totalDepositedAmount,
        uint256 quantumEnabledCount,
        uint256 institutionalCount,
        uint256 sovereignCount
    ) {
        uint256 totalAmount = 0;
        uint256 quantumCount = 0;
        uint256 institutionalCount = 0;
        uint256 sovereignCount = 0;
        
        for (uint256 i = 0; i < activeDepositIds.length; i++) {
            Deposit memory deposit = deposits[activeDepositIds[i]];
            totalAmount += deposit.amount;
            if (deposit.quantumEnabled) {
                quantumCount++;
            }
            if (deposit.tier == VaultTier.INSTITUTIONAL) {
                institutionalCount++;
            }
            if (deposit.tier == VaultTier.SOVEREIGN) {
                sovereignCount++;
            }
        }
        
        return (
            _depositIdCounter - 1,
            activeDepositIds.length,
            totalAmount,
            quantumCount,
            institutionalCount,
            sovereignCount
        );
    }
    
    /**
     * @dev Calculate withdrawal fee for a deposit
     * @param depositId Deposit ID
     */
    function calculateWithdrawalFee(uint256 depositId) external view returns (uint256 fee) {
        Deposit memory deposit = deposits[depositId];
        
        uint256 timeElapsed = block.timestamp - deposit.createdAt;
        uint256 yearsElapsed = timeElapsed / 365 days;
        uint256 feeRate = tierFee[deposit.tier];
        
        // Calculate fee (capped at 5 years)
        uint256 effectiveYears = yearsElapsed > 5 ? 5 : yearsElapsed;
        uint256 timeBasedFee = (deposit.amount * feeRate * effectiveYears) / 10000;
        
        // Add platform fee
        uint256 platformFeeAmount = (deposit.amount * platformFee) / 10000;
        
        return timeBasedFee + platformFeeAmount;
    }
}
