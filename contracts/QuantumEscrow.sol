// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuantumEscrow
 * @dev Post-quantum resistant escrow contract for long-term holding
 * Designed for real estate, inheritance, and long-term business contracts
 * Leverages Arc's post-quantum signature scheme for quantum-resistant security
 */
contract QuantumEscrow is Ownable, ReentrancyGuard {
    
    // Escrow status
    enum EscrowStatus { PENDING, ACTIVE, COMPLETED, CANCELLED, EXPIRED }
    
    // Escrow struct
    struct Escrow {
        uint256 id;
        address depositor;
        address beneficiary;
        address tokenAddress;
        uint256 amount;
        uint256 releaseTime;
        uint256 createdAt;
        EscrowStatus status;
        string metadata; // IPFS hash or reference to off-chain metadata
        bool quantumEnabled; // Whether quantum-resistant wallet is used
    }
    
    // State variables
    uint256 private _escrowIdCounter;
    mapping(uint256 => Escrow) public escrows;
    uint256[] public activeEscrowIds;
    mapping(address => uint256[]) public userEscrows;
    
    // USDC token address (Arc testnet)
    address public usdcToken;
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 50; // 0.5%
    
    // Minimum escrow duration (in seconds) - 30 days
    uint256 public minEscrowDuration = 30 days;
    
    // Maximum escrow duration (in seconds) - 10 years
    uint256 public maxEscrowDuration = 3650 days;
    
    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed depositor,
        address indexed beneficiary,
        address tokenAddress,
        uint256 amount,
        uint256 releaseTime,
        bool quantumEnabled
    );
    
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed beneficiary,
        uint256 amount,
        uint256 timestamp
    );
    
    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed depositor,
        uint256 amount,
        uint256 timestamp
    );
    
    event EscrowExpired(
        uint256 indexed escrowId,
        address indexed depositor,
        uint256 amount,
        uint256 timestamp
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        _escrowIdCounter = 1;
    }
    
    /**
     * @dev Set USDC token address (only owner)
     */
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
    }
    
    /**
     * @dev Create a new escrow
     * @param beneficiary Address that will receive the funds
     * @param tokenAddress Token address to escrow
     * @param amount Amount to escrow
     * @param releaseTime Unix timestamp when funds can be released
     * @param metadata IPFS hash or reference to off-chain metadata
     * @param quantumEnabled Whether quantum-resistant wallet is used
     */
    function createEscrow(
        address beneficiary,
        address tokenAddress,
        uint256 amount,
        uint256 releaseTime,
        string memory metadata,
        bool quantumEnabled
    ) external nonReentrant returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(beneficiary != msg.sender, "Cannot be own beneficiary");
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(releaseTime > block.timestamp, "Release time must be in future");
        
        uint256 duration = releaseTime - block.timestamp;
        require(duration >= minEscrowDuration, "Duration too short");
        require(duration <= maxEscrowDuration, "Duration too long");
        
        // Transfer tokens from depositor to escrow
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        
        // Create escrow
        uint256 escrowId = _escrowIdCounter++;
        escrows[escrowId] = Escrow({
            id: escrowId,
            depositor: msg.sender,
            beneficiary: beneficiary,
            tokenAddress: tokenAddress,
            amount: amount,
            releaseTime: releaseTime,
            createdAt: block.timestamp,
            status: EscrowStatus.ACTIVE,
            metadata: metadata,
            quantumEnabled: quantumEnabled
        });
        
        // Track escrow
        activeEscrowIds.push(escrowId);
        userEscrows[msg.sender].push(escrowId);
        
        emit EscrowCreated(
            escrowId,
            msg.sender,
            beneficiary,
            tokenAddress,
            amount,
            releaseTime,
            quantumEnabled
        );
        
        return escrowId;
    }
    
    /**
     * @dev Release escrow funds to beneficiary
     * @param escrowId Escrow ID to release
     */
    function releaseEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.status == EscrowStatus.ACTIVE, "Escrow not active");
        require(block.timestamp >= escrow.releaseTime, "Release time not reached");
        require(msg.sender == escrow.beneficiary, "Only beneficiary can release");
        
        // Calculate platform fee
        uint256 fee = (escrow.amount * platformFee) / 10000;
        uint256 beneficiaryAmount = escrow.amount - fee;
        
        // Transfer tokens to beneficiary
        IERC20(escrow.tokenAddress).transfer(escrow.beneficiary, beneficiaryAmount);
        
        // Update status
        escrow.status = EscrowStatus.COMPLETED;
        
        // Remove from active escrows
        _removeActiveEscrow(escrowId);
        
        emit EscrowReleased(escrowId, escrow.beneficiary, beneficiaryAmount, block.timestamp);
    }
    
    /**
     * @dev Cancel escrow and return funds to depositor
     * Only possible before release time
     * @param escrowId Escrow ID to cancel
     */
    function cancelEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.status == EscrowStatus.ACTIVE, "Escrow not active");
        require(msg.sender == escrow.depositor, "Only depositor can cancel");
        require(block.timestamp < escrow.releaseTime, "Cannot cancel after release time");
        
        // Return tokens to depositor
        IERC20(escrow.tokenAddress).transfer(escrow.depositor, escrow.amount);
        
        // Update status
        escrow.status = EscrowStatus.CANCELLED;
        
        // Remove from active escrows
        _removeActiveEscrow(escrowId);
        
        emit EscrowCancelled(escrowId, escrow.depositor, escrow.amount, block.timestamp);
    }
    
    /**
     * @dev Check if escrow has expired (optional - for auto-expiration)
     * @param escrowId Escrow ID to check
     */
    function checkExpiration(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.status == EscrowStatus.ACTIVE, "Escrow not active");
        require(block.timestamp > escrow.releaseTime + 30 days, "Not expired yet");
        
        // Return tokens to depositor after 30 days past release time
        IERC20(escrow.tokenAddress).transfer(escrow.depositor, escrow.amount);
        
        // Update status
        escrow.status = EscrowStatus.EXPIRED;
        
        // Remove from active escrows
        _removeActiveEscrow(escrowId);
        
        emit EscrowExpired(escrowId, escrow.depositor, escrow.amount, block.timestamp);
    }
    
    /**
     * @dev Get escrow details
     * @param escrowId Escrow ID
     */
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    /**
     * @dev Get all active escrows
     */
    function getActiveEscrows() external view returns (uint256[] memory) {
        return activeEscrowIds;
    }
    
    /**
     * @dev Get escrows for a user
     * @param user User address
     */
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
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
     * @dev Update minimum escrow duration (only owner)
     * @param newDuration New minimum duration in seconds
     */
    function updateMinEscrowDuration(uint256 newDuration) external onlyOwner {
        require(newDuration >= 1 days, "Duration too short");
        minEscrowDuration = newDuration;
    }
    
    /**
     * @dev Update maximum escrow duration (only owner)
     * @param newDuration New maximum duration in seconds
     */
    function updateMaxEscrowDuration(uint256 newDuration) external onlyOwner {
        require(newDuration <= 36500 days, "Duration too long"); // Max 100 years
        maxEscrowDuration = newDuration;
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
     * @dev Internal function to remove escrow from active escrows
     */
    function _removeActiveEscrow(uint256 escrowId) internal {
        for (uint256 i = 0; i < activeEscrowIds.length; i++) {
            if (activeEscrowIds[i] == escrowId) {
                activeEscrowIds[i] = activeEscrowIds[activeEscrowIds.length - 1];
                activeEscrowIds.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Get escrow statistics
     */
    function getEscrowStats() external view returns (
        uint256 totalEscrows,
        uint256 activeEscrowsCount,
        uint256 totalEscrowedAmount,
        uint256 quantumEnabledCount
    ) {
        uint256 totalAmount = 0;
        uint256 quantumCount = 0;
        
        for (uint256 i = 0; i < activeEscrowIds.length; i++) {
            Escrow memory escrow = escrows[activeEscrowIds[i]];
            totalAmount += escrow.amount;
            if (escrow.quantumEnabled) {
                quantumCount++;
            }
        }
        
        return (
            _escrowIdCounter - 1,
            activeEscrowIds.length,
            totalAmount,
            quantumCount
        );
    }
}
