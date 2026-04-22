import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import ParticleBackground from './components/ParticleBackground'
import AssetCard from './components/AssetCard'
import HexButton from './components/HexButton'
import QuantumHeader from './components/QuantumHeader'
import LandingPage from './components/LandingPage'
import TradingPage from './components/TradingPage'
import AdminPanel from './components/AdminPanel'
import ViewAllAssets from './components/ViewAllAssets'
import AssetInteraction from './components/AssetInteraction'
import DashboardStats from './components/DashboardStats'
import { ToastProvider } from './contexts/ToastContext'
import { RWA_CONTRACT_ADDRESS } from './lib/contracts'

const ARC_CHAIN_ID = '0x4cef52' // 316450 in hex

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isTrading, setIsTrading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [selectedAssetForInteraction, setSelectedAssetForInteraction] = useState<any>(null)
  const [isViewAllAssetsOpen, setIsViewAllAssetsOpen] = useState(false)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const ASSET_CATEGORIES = [
    { id: 'ALL', name: 'All Assets', icon: '🌐' },
    { id: 'REAL_ESTATE', name: 'Real Estate', icon: '🏠' },
    { id: 'ENERGY', name: 'Energy', icon: '⚡' },
    { id: 'COMMODITY', name: 'Commodity', icon: '💎' },
    { id: 'TREASURY', name: 'Treasury', icon: '📊' }
  ]

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      setIsWalletConnected(accounts.length > 0)
    }

    const handleChainChanged = (chainId: string) => {
      console.log('Chain changed to:', chainId, 'Expected:', ARC_CHAIN_ID)
      setWrongNetwork(chainId !== ARC_CHAIN_ID)
    }

    const checkNetwork = async () => {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        console.log('Current chain ID:', chainId, 'Expected:', ARC_CHAIN_ID)
        setWrongNetwork(chainId !== ARC_CHAIN_ID)
      }
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      // Check initial state
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        setIsWalletConnected(accounts.length > 0)
      })
      
      checkNetwork()
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_CHAIN_ID }],
      })
    } catch (error: any) {
      console.error('Error switching network:', error)
      // Only try to add network if error code is 4902 (network doesn't exist)
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ARC_CHAIN_ID,
                chainName: 'Arc Network',
                nativeCurrency: {
                  name: 'USDC',
                  symbol: 'USDC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.testnet.arc.network'],
                blockExplorerUrls: ['https://explorer.arc.testnet.io'],
              },
            ],
          })
        } catch (addError) {
          console.error('Error adding network:', addError)
          alert('Failed to add Arc Testnet to your wallet')
        }
      } else {
        alert('Failed to switch network. Network may already exist in your wallet.')
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Sample asset data
  const assets = [
    {
      id: 1,
      name: 'Quantum Treasury',
      symbol: 'QT-BOND',
      type: 'TREASURY',
      value: 1000000,
      apy: 6.5,
      price: 750.00,
      change: 3.1,
      color: '#00ff88',
      contractAddress: RWA_CONTRACT_ADDRESS,
      description: 'Government-backed treasury bonds tokenized on the blockchain. Secure investment with guaranteed returns.'
    },
    {
      id: 2,
      name: 'Solar Farm Token',
      symbol: 'SOLAR',
      type: 'ENERGY',
      value: 2500000,
      apy: 8.2,
      price: 1250.00,
      change: 5.4,
      color: '#ffaa00',
      contractAddress: '0x1234567890123456789012345678901234567890',
      description: 'Fractional ownership of a large-scale solar farm generating clean energy and steady returns.'
    },
    {
      id: 3,
      name: 'Stellar Gold',
      symbol: 'STL-GOLD',
      type: 'COMMODITY',
      value: 500000,
      apy: 3.2,
      price: 2150.00,
      change: 0.8,
      color: '#ff00ff',
      contractAddress: '0x2345678901234567890123456789012345678901',
      description: 'Tokenized gold reserves backed by physical gold bullion stored in secure vaults.'
    },
    {
      id: 4,
      name: 'Helios Energy',
      symbol: 'HEL-ENG',
      type: 'ENERGY',
      value: 750000,
      apy: 6.5,
      price: 750.00,
      change: 3.1,
      color: '#00ff88',
      contractAddress: '0x3456789012345678901234567890123456789012',
      description: 'Renewable energy infrastructure including wind and hydroelectric power plants.'
    },
    {
      id: 5,
      name: 'Urban Real Estate',
      symbol: 'URE-EST',
      type: 'REAL_ESTATE',
      value: 5000000,
      apy: 7.5,
      price: 2500.00,
      change: 4.2,
      color: '#ff6b6b',
      contractAddress: '0x4567890123456789012345678901234567890123',
      description: 'Premium commercial real estate in major metropolitan areas with high rental yields.'
    }
  ]

  // Filter assets based on selected category
  const filteredAssets = selectedCategory === 'ALL' 
    ? assets 
    : assets.filter(asset => asset.type === selectedCategory)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <ToastProvider>
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        
        <div className="relative z-10">
        {!isWalletConnected ? (
          <>
            <QuantumHeader />
            <LandingPage />
          </>
        ) : (
          <>
            <QuantumHeader />
            
            {isTrading && selectedAsset ? (
              <TradingPage 
                asset={selectedAsset}
                onBack={() => setIsTrading(false)}
              />
            ) : (
              <main className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                  <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold mb-4 text-glow animate-float">
                      Quantum Asset Hub
                    </h1>
                    <p className="text-xl text-gray-300">
                      Tokenize Reality. Own the Future.
                    </p>
                  </div>

                  <DashboardStats 
                    contractAddress={selectedAssetForInteraction?.contractAddress}
                    assetSymbol={selectedAssetForInteraction?.symbol || 'QT-BOND'}
                  />

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {ASSET_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          selectedCategory === category.id
                            ? 'quantum-gradient text-white'
                            : 'glass-effect hover:neon-glow text-gray-300'
                        }`}
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>

                  {wrongNetwork && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={20} className="text-red-400" />
                          <div>
                            <p className="text-sm text-red-400 font-semibold">Wrong Network</p>
                            <p className="text-xs text-gray-400">Please switch to Arc Network (Chain ID: 5042002)</p>
                          </div>
                        </div>
                        <button
                          onClick={switchNetwork}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Switch Network
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredAssets.map((asset) => (
                      <AssetCard 
                        key={asset.id} 
                        asset={asset}
                        mousePosition={mousePosition}
                        onClick={() => setSelectedAssetForInteraction(asset)}
                        onTrade={() => {
                          setSelectedAsset(asset)
                          setIsTrading(true)
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-8">
                    <AssetInteraction 
                      asset={selectedAssetForInteraction}
                      contractAddress={RWA_CONTRACT_ADDRESS}
                    />
                  </div>

                  <div className="mt-8">
                    <AdminPanel />
                  </div>

                  <div className="flex justify-center mt-8">
                    <HexButton 
                      variant="primary" 
                      size="large"
                      onClick={() => setIsViewAllAssetsOpen(true)}
                    >
                      View All Assets
                    </HexButton>
                  </div>
                </div>
              </main>
            )}
          </>
        )}
        
        <ViewAllAssets 
          isOpen={isViewAllAssetsOpen}
          onClose={() => setIsViewAllAssetsOpen(false)}
        />
      </div>
    </div>
    </ToastProvider>
  )
}

export default App
