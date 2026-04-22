export const RWA_CONTRACT_ADDRESS = import.meta.env.VITE_RWA_CONTRACT || "0xe6c03C961944cc233a6a149d20D35e7Be7957Ab0";
export const FACTORY_CONTRACT_ADDRESS = import.meta.env.VITE_FACTORY_CONTRACT || "0x412bfE938761528B3f282dba97Fb4105204181BE";
export const MARKETPLACE_CONTRACT_ADDRESS = import.meta.env.VITE_MARKETPLACE_CONTRACT || "0xEdD654301aB1fa591b4d502E18A7275cC3863896";

// QuantumRWA ABI (simplified for essential functions)
export const RWA_ABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function redeem(uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function getAssetInfo() external view returns (string assetName, string assetType, uint256 totalAssetValue, uint256 apy, uint256 maturityDate, uint256 totalSupply, uint256 maxSupply)",
  "event AssetMinted(address indexed to, uint256 amount, uint256 timestamp)",
  "event AssetRedeemed(address indexed from, uint256 amount, uint256 timestamp)"
];

// QuantumFactory ABI
export const FACTORY_ABI = [
  "function deployToken(string memory _name, string memory _symbol, string memory _assetName, string memory _assetType, uint256 _totalAssetValue, uint256 _apy, uint256 _maturityDate, uint256 _maxSupply) external returns (address)",
  "function getDeployedTokens() external view returns (address[] memory)",
  "function getDeployedTokenCount() external view returns (uint256)",
  "event TokenDeployed(address indexed tokenAddress, string indexed assetName, address indexed deployer)"
];

// QuantumMarketplace ABI
export const MARKETPLACE_ABI = [
  "function createOrder(address tokenAddress, uint256 tokenAmount, uint256 pricePerToken) external",
  "function fillOrder(uint256 orderId) external",
  "function cancelOrder(uint256 orderId) external",
  "function getOrder(uint256 orderId) external view returns (uint256 id, address seller, address tokenAddress, uint256 tokenAmount, uint256 pricePerToken, uint256 totalPrice, bool active, uint256 createdAt)",
  "function getActiveOrders() external view returns (uint256[] memory)",
  "function getOrdersByToken(address tokenAddress) external view returns (uint256[] memory)",
  "function getUserOrders(address user) external view returns (uint256[] memory)",
  "function setUSDCToken(address _usdcToken) external",
  "function usdcToken() external view returns (address)",
  "function owner() external view returns (address)",
  "function platformFee() external view returns (uint256)",
  "function updatePlatformFee(uint256 newFee) external",
  "function withdrawFees() external",
  "event OrderCreated(uint256 indexed orderId, address indexed seller, address indexed tokenAddress, uint256 tokenAmount, uint256 pricePerToken, uint256 totalPrice)",
  "event OrderCancelled(uint256 indexed orderId, address indexed seller)",
  "event OrderFilled(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 tokenAmount, uint256 totalPrice)"
];
