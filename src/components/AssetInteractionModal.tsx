import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Wallet, ArrowDownRight, Layers, TrendingUp } from 'lucide-react'
import { RWA_ABI } from '../lib/contracts'
import { ethers } from 'ethers'

interface AssetInteractionModalProps {
  isOpen: boolean
  onClose: () => void
  asset: {
    id: number
    name: string
    symbol: string
    type: string
    value: number
    apy: number
    price: number
    change: number
    color: string
  }
  contractAddress: string
}

const AssetInteractionModal = ({ isOpen, onClose, asset, contractAddress }: AssetInteractionModalProps) => {
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [burnAmount, setBurnAmount] = useState("")

  const getContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, RWA_ABI, signer)
  }

  const checkBalance = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      if (!contract) {
        alert("Please connect wallet first")
        return
      }
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const bal = await contract.balanceOf(accounts[0])
      setBalance(ethers.formatEther(bal))
    } catch (error) {
      console.error("Error checking balance:", error)
      alert("Error checking balance. Make sure you're connected to Arc testnet.")
    } finally {
      setLoading(false)
    }
  }

  const burnTokens = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      if (!contract) {
        alert("Please connect wallet first")
        return
      }
      
      const amount = ethers.parseEther(burnAmount || "1")
      
      const tx = await contract.burn(amount)
      await tx.wait()
      
      alert("Tokens burned successfully!")
      checkBalance()
      setBurnAmount("")
    } catch (error: any) {
      console.error("Error burning:", error)
      alert(`Error burning: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkBalance()
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
        className="glass-effect rounded-2xl p-8 max-w-lg w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 hexagon flex items-center justify-center" style={{ background: asset.color }}>
              <span className="text-xl font-bold">{asset.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{asset.name}</h2>
              <p className="text-sm text-gray-400">{asset.symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Balance Section */}
          <div className="p-4 bg-gray-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Wallet size={16} />
                Your Balance
              </p>
              <motion.button
                onClick={checkBalance}
                disabled={loading}
                className="px-3 py-1 hexagon glass-effect hover:neon-glow text-xs font-semibold
                  disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? "Loading..." : "Refresh"}
              </motion.button>
            </div>
            <p className="text-3xl font-bold">{balance} {asset.symbol}</p>
          </div>

          {/* Asset Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Price</p>
              <p className="font-semibold">${asset.price.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">APY</p>
              <p className="font-semibold text-neon-green">{asset.apy}%</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">24h Change</p>
              <p className={`font-semibold ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Total Value</p>
              <p className="font-semibold">${(asset.value / 1000000).toFixed(2)}M</p>
            </div>
          </div>

          {/* Burn Tokens */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <ArrowDownRight size={16} />
              Burn Tokens
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                placeholder={`Amount (max: ${balance})`}
                className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-neon-blue"
              />
              <motion.button
                onClick={burnTokens}
                disabled={loading || !burnAmount}
                className="px-6 py-3 hexagon glass-effect hover:neon-glow-purple text-white font-semibold
                  disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Burn
              </motion.button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          </p>
          <p className="text-xs text-gray-500">
            Network: Arc Testnet (Chain ID: 5042002)
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AssetInteractionModal
