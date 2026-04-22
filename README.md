# Arc Quantum Asset Hub

A visually stunning Real-World Asset (RWA) tokenization platform built for Arc Blockchain testnet. Features unique quantum-inspired UI with hexagonal buttons, particle effects, radial navigation, and 3D asset visualizations.

## 🎨 Unique Design Features

- **Hexagonal UI Elements**: All buttons and cards use hexagonal shapes with quantum-inspired gradients
- **Particle Background**: Animated particle system with connecting lines creating a network effect
- **Radial Navigation**: Bottom-center radial menu instead of traditional sidebar/topbar navigation
- **3D Parallax Effects**: Asset cards respond to mouse movement with 3D perspective transforms
- **Neon Glow Effects**: Quantum gradient colors with glow effects for visual impact
- **Glassmorphism**: Frosted glass effect on UI elements for modern aesthetic
- **Smooth Animations**: Framer Motion-powered animations throughout the interface

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom quantum color palette
- **Animations**: Framer Motion
- **3D Graphics**: Three.js + React Three Fiber + React Three Drei
- **Web3**: window.ethereum (MetaMask) integration
- **Smart Contracts**: Solidity (for RWA tokenization)

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔗 Connecting to Arc Testnet

1. Install MetaMask or another Web3 wallet
2. Click the "Connect" button in the top right
3. Approve the connection request
4. Your wallet will automatically switch to Arc Testnet (Chain ID: 316450)

### Arc Testnet Configuration

- **Chain ID**: 316450 (0x4cef52)
- **RPC URL**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app
- **Native Currency**: USDC (6 decimals)

## 💰 Get Testnet USDC

Visit the Arc faucet to get testnet USDC:
https://faucet.circle.com/

## 📜 Smart Contracts

### QuantumRWA.sol
Main RWA token contract with features:
- ERC20 compliant with burnable tokens
- Asset metadata (name, type, total value, APY)
- Minting controls (owner-only, max supply)
- Redemption functionality
- APY and maturity date updates

### QuantumFactory.sol
Factory contract to deploy new RWA tokens:
- Deploy new RWA tokens with custom parameters
- Track all deployed tokens
- Query deployed token addresses

## 🎯 Sample Assets

The dashboard includes sample RWA assets:
- **Quantum Treasury (QT-BOND)**: Tokenized treasury bonds, 6.5% APY (Real deployed contract)
- **Solar Farm Token (SOLAR)**: Energy sector assets, 8.2% APY (Demo asset)
- **Stellar Gold (STL-GOLD)**: Tokenized gold commodities, 3.2% APY (Demo asset)
- **Helios Energy (HEL-ENG)**: Energy sector assets, 6.5% APY (Demo asset)
- **Urban Real Estate (URE-EST)**: Fractional real estate ownership, 7.5% APY (Demo asset)

*Demo assets have fake contract addresses for testing purposes. Only QT-BOND has a real deployed contract.*

## ✨ Key Features

### Category Filter
- Filter assets by category: All Assets, Real Estate, Energy, Commodity, Treasury
- Dynamic filtering with instant UI updates
- Category-specific asset discovery

### Network Switching
- Automatic detection of Arc Testnet
- One-click network switching
- Auto-add Arc Testnet if not configured in wallet
- Chain ID validation (0x4cef52)

### Trading Interface
- Full trading page with price charts
- Buy/Sell order placement
- Order book with market and user orders
- Order cancellation functionality
- Support for multiple assets with individual contract addresses

### Admin Panel
- Token minting functionality
- Platform fee updates
- New token deployment via factory
- Owner-only operations

### Toast Notifications
- Success and error notifications
- Smooth animations with Framer Motion
- Context-based state management
- Reusable across all components

### Dashboard Statistics
- Real-time balance display for selected asset
- Total assets owned count
- Network status indicator
- Dynamic updates based on selected asset

## 🎨 UI Components

### ParticleBackground
Canvas-based particle system with:
- 100 animated particles
- Dynamic color scheme (cyan, purple, magenta, green)
- Connection lines between nearby particles
- Responsive to window resize

### AssetCard
3D parallax asset cards with:
- Mouse-tracking 3D transforms
- Gradient glow effects
- Asset metadata display
- Interactive trade buttons

### HexButton
Custom hexagonal button with:
- Quantum gradient styling
- Neon glow on hover
- Scale animations
- Multiple size variants

### WalletConnect
Wallet integration with:
- MetaMask connection
- Automatic chain switching to Arc testnet
- Chain addition if not configured
- Address display and disconnect

### TradingPage
Full trading interface with:
- Price chart visualization
- Buy/Sell order placement
- Order book display
- User order management
- Support for multiple assets

### DashboardStats
Dashboard statistics display:
- Total Balance for selected asset
- Total Assets Owned count
- Network status indicator
- Real-time data fetching

### ToastNotifications
Toast notification system with:
- Success/error message display
- Framer Motion animations
- Context-based state management
- Reusable toast components

## 🚢 Deployment

### Deploy Frontend

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel deploy

# Or deploy to Netlify
netlify deploy --prod
```

### Deploy Smart Contracts

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash

# Initialize Foundry project
foundryup

# Create contracts directory
mkdir contracts
cd contracts

# Initialize Foundry
forge init

# Copy QuantumRWA.sol and QuantumFactory.sol to contracts/src/

# Deploy to Arc Testnet
forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.arc.network --broadcast
```

## 📝 Usage

1. **Connect Wallet**: Click "Connect" button in header
2. **View Assets**: Browse tokenized assets on dashboard with category filter
3. **Trade**: Click "Trade" on asset cards to access trading interface
4. **Interact**: Click asset cards to view details and mint/redeem tokens
5. **Mint**: Use AdminPanel to mint tokens and deploy new RWA tokens

## 🔮 Future Features

- [ ] Portfolio management dashboard
- [ ] Market data integration with real-time price feeds
- [ ] Advanced 3D asset visualizations
- [ ] Real-time price updates via oracles
- [ ] Mobile app version
- [ ] Advanced trading features (limit orders, stop-loss)
- [ ] Multi-chain support

## 🎯 Arc Testnet Program

This project is built for the Arc testnet program to demonstrate:
- Unique UI/UX design patterns
- RWA tokenization concept
- Web3 integration with Arc blockchain
- Creative use of blockchain features

## 📄 License

MIT

## 👨‍💻 Built by

@dhozil - https://x.com/cobersky

## 🙏 Acknowledgments

- Arc Blockchain by Circle
- Framer Motion
- Three.js
- TailwindCSS
- React
