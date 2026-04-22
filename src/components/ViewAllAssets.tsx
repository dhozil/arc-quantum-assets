import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Wallet, Layers, ArrowUpRight } from 'lucide-react'
import { FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, RWA_ABI } from '../lib/contracts'
import { ethers } from 'ethers'

interface ViewAllAssetsProps {
  isOpen: boolean
  onClose: () => void
}

interface TokenInfo {
  address: string
  name: string
  symbol: string
  assetName: string
  assetType: string
  balance: string
}

const ViewAllAssets = ({ isOpen, onClose }: ViewAllAssetsProps) => {
  const [loading, setLoading] = useState(false)
  const [tokens, setTokens] = useState<TokenInfo[]>([])

  const getFactoryContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, signer)
  }

  const getTokenContract = async (address: string) => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(address, RWA_ABI, signer)
  }

  const loadAllTokens = async () => {
    try {
      setLoading(true)
      const factory = await getFactoryContract()
      if (!factory) {
        alert('Please connect wallet first')
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      
      // Get all deployed tokens from factory
      const deployedTokens = await factory.getDeployedTokens()
      
      // Get balance for each token
      const tokenPromises = deployedTokens.map(async (address: string) => {
        try {
          const token = await getTokenContract(address)
          if (!token) return null

          const [assetInfo, balance] = await Promise.all([
            token.getAssetInfo(),
            token.balanceOf(accounts[0])
          ])

          return {
            address,
            name: await token.name(),
            symbol: await token.symbol(),
            assetName: assetInfo.assetName,
            assetType: assetInfo.assetType,
            balance: ethers.formatEther(balance)
          }
        } catch (error) {
          console.error('Error loading token info:', error)
          return null
        }
      })

      const tokenResults = await Promise.all(tokenPromises)
      setTokens(tokenResults.filter((t): t is TokenInfo => t !== null))
    } catch (error) {
      console.error('Error loading tokens:', error)
      alert('Error loading tokens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadAllTokens()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="glass-effect rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers size={24} />
            All Your Assets
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="text-gray-400">Loading assets...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12">
            <Wallet size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">No assets found</p>
            <p className="text-sm text-gray-500 mt-2">Deploy tokens using the Admin Panel</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-xl p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 hexagon flex items-center justify-center quantum-gradient">
                      <span className="text-lg font-bold">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{token.name}</h3>
                      <p className="text-sm text-gray-400">{token.assetName} ({token.assetType})</p>
                      <p className="text-xs text-gray-500">{token.address.slice(0, 8)}...{token.address.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Balance</p>
                    <p className="text-xl font-bold">{parseFloat(token.balance).toFixed(4)} {token.symbol}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Factory Contract: {FACTORY_CONTRACT_ADDRESS.slice(0, 6)}...{FACTORY_CONTRACT_ADDRESS.slice(-4)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ViewAllAssets
