// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @title QuantumMarketplace
 * @dev Marketplace for trading RWA tokens on Arc Blockchain
 * Features: Listing, Buying, Canceling Orders, Price Management
 */
contract QuantumMarketplace {
    // Order struct
    struct Order {
        uint256 id;
        address seller;
        address tokenAddress;
        uint256 tokenAmount;
        uint256 pricePerToken; // In USDC (6 decimals)
        uint256 totalPrice;   // In USDC (6 decimals)
        bool active;
        uint256 createdAt;
    }

    // State variables
    uint256 private _orderIdCounter;
    mapping(uint256 => Order) public orders;
    uint256[] public activeOrderIds;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256) public userOrderCount;

    // USDC token address (Arc testnet)
    address public usdcToken;
    address public owner;
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 200; // 2%
    
    // Reentrancy guard
    uint256 private _status;
    
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        address indexed tokenAddress,
        uint256 tokenAmount,
        uint256 pricePerToken,
        uint256 totalPrice
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed seller);
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenAmount,
        uint256 totalPrice
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier nonReentrant() {
        require(_status == 1, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() {
        owner = msg.sender;
        _orderIdCounter = 1;
        _status = 1;
    }

    /**
     * @dev Set USDC token address (only owner)
     * @param _usdcToken USDC token address
     */
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Create a new sell order
     * @param tokenAddress RWA token address
     * @param tokenAmount Amount of tokens to sell
     * @param pricePerToken Price per token in USDC (6 decimals)
     */
    function createOrder(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 pricePerToken
    ) external nonReentrant {
        require(tokenAmount > 0, "Invalid token amount");
        require(pricePerToken > 0, "Invalid price");
        
        // Calculate total price
        uint256 totalPrice = (tokenAmount * pricePerToken) / 1e18; // Adjust for token decimals
        
        // Transfer tokens from seller to marketplace
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        
        // Create order
        uint256 orderId = _orderIdCounter++;
        orders[orderId] = Order({
            id: orderId,
            seller: msg.sender,
            tokenAddress: tokenAddress,
            tokenAmount: tokenAmount,
            pricePerToken: pricePerToken,
            totalPrice: totalPrice,
            active: true,
            createdAt: block.timestamp
        });
        
        // Track order
        activeOrderIds.push(orderId);
        userOrders[msg.sender].push(orderId);
        userOrderCount[msg.sender]++;
        
        emit OrderCreated(
            orderId,
            msg.sender,
            tokenAddress,
            tokenAmount,
            pricePerToken,
            totalPrice
        );
    }

    /**
     * @dev Fill an existing order (buy tokens)
     * @param orderId Order ID to fill
     */
    function fillOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        
        require(order.active, "Order not active");
        require(order.seller != msg.sender, "Cannot buy own order");
        
        // Calculate platform fee
        uint256 fee = (order.totalPrice * platformFee) / 10000;
        uint256 sellerAmount = order.totalPrice - fee;
        
        // Transfer USDC from buyer to marketplace and seller
        IERC20(usdcToken).transferFrom(msg.sender, address(this), order.totalPrice);
        IERC20(usdcToken).transfer(order.seller, sellerAmount);
        
        // Transfer tokens from marketplace to buyer
        IERC20(order.tokenAddress).transfer(msg.sender, order.tokenAmount);
        
        // Deactivate order
        order.active = false;
        
        // Remove from active orders
        _removeActiveOrder(orderId);
        
        emit OrderFilled(
            orderId,
            msg.sender,
            order.seller,
            order.tokenAmount,
            order.totalPrice
        );
    }

    /**
     * @dev Cancel an order
     * @param orderId Order ID to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        
        require(order.active, "Order not active");
        require(order.seller == msg.sender, "Not your order");
        
        // Return tokens to seller
        IERC20(order.tokenAddress).transfer(order.seller, order.tokenAmount);
        
        // Deactivate order
        order.active = false;
        
        // Remove from active orders
        _removeActiveOrder(orderId);
        
        emit OrderCancelled(orderId, msg.sender);
    }

    /**
     * @dev Get order details
     * @param orderId Order ID
     */
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    /**
     * @dev Get all active orders
     */
    function getActiveOrders() external view returns (uint256[] memory) {
        return activeOrderIds;
    }

    /**
     * @dev Get orders for a specific token
     * @param tokenAddress Token address
     */
    function getOrdersByToken(address tokenAddress) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](activeOrderIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeOrderIds.length; i++) {
            if (orders[activeOrderIds[i]].tokenAddress == tokenAddress && 
                orders[activeOrderIds[i]].active) {
                result[count] = activeOrderIds[i];
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
     * @dev Get orders for a user
     * @param user User address
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    /**
     * @dev Update platform fee (only owner)
     * @param newFee New platform fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
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
     * @dev Internal function to remove order from active orders
     */
    function _removeActiveOrder(uint256 orderId) internal {
        for (uint256 i = 0; i < activeOrderIds.length; i++) {
            if (activeOrderIds[i] == orderId) {
                activeOrderIds[i] = activeOrderIds[activeOrderIds.length - 1];
                activeOrderIds.pop();
                break;
            }
        }
    }

    /**
     * @dev Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 totalOrders,
        uint256 activeOrdersCount,
        uint256 totalVolume,
        uint256 totalFees
    ) {
        return (
            _orderIdCounter - 1,
            activeOrderIds.length,
            0, // Would need to track this
            0  // Would need to track this
        );
    }
}
