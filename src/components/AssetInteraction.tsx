import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowDownRight, RefreshCw } from 'lucide-react'
import { RWA_ABI } from '../lib/contracts'
import { ethers } from 'ethers'
import { useToast } from '../contexts/ToastContext'

interface AssetInteractionProps {
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
    description?: string
  } | null
  contractAddress: string
}

const AssetInteraction = ({ asset, contractAddress }: AssetInteractionProps) => {
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [burnAmount, setBurnAmount] = useState("")
  const [redeemAmount, setRedeemAmount] = useState("")
  const toast = useToast()

  const getContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, RWA_ABI, signer)
  }

  const checkBalance = async () => {
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        setLoading(true)
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        console.log('Current chain ID:', chainId, 'Expected: 0x4cef52 (316450)')
        
        const contract = await getContract()
        if (!contract) {
          toast.showError("Please connect wallet first")
          return
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (!accounts || accounts.length === 0) {
          toast.showError("Please connect wallet first")
          return
        }
        
        console.log('Checking balance for:', accounts[0], 'on contract:', contractAddress)
        const bal = await contract.balanceOf(accounts[0])
        setBalance(ethers.formatEther(bal))
        toast.showSuccess("Balance updated successfully")
        return
      } catch (error: any) {
        console.error(`Error checking balance (attempt ${retryCount + 1}/${maxRetries}):`, error)
        retryCount++
        
        if (retryCount >= maxRetries) {
          console.error("Max retries reached")
          toast.showError("RPC endpoint may be experiencing issues. Please try again in a few minutes.")
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const burnTokens = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      if (!contract) {
        toast.showError("Please connect wallet first")
        return
      }
      
      const amount = ethers.parseEther(burnAmount || "1")
      
      const tx = await contract.burn(amount)
      await tx.wait()
      
      toast.showSuccess("Tokens burned successfully!")
      checkBalance()
      setBurnAmount("")
    } catch (error: any) {
      console.error("Error burning:", error)
      toast.showError(`Error burning: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const redeemTokens = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      if (!contract) {
        toast.showError("Please connect wallet first")
        return
      }
      
      const amount = ethers.parseEther(redeemAmount || "1")
      
      const tx = await contract.redeem(amount)
      await tx.wait()
      
      toast.showSuccess("Tokens redeemed successfully!")
      checkBalance()
      setRedeemAmount("")
    } catch (error: any) {
      console.error("Error redeeming:", error)
      toast.showError(`Error redeeming: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (asset) {
      checkBalance()
    }
  }, [asset])

  if (!asset) {
    return (
      <div className="glass-effect rounded-2xl p-6 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Wallet size={20} />
          Asset Interaction
        </h3>
        <p className="text-gray-400">Select an asset to view its interaction panel</p>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hexagon flex items-center justify-center" style={{ background: asset.color }}>
            <span className="text-xl font-bold">{asset.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Wallet size={20} />
              {asset.name}
            </h3>
            <p className="text-xs text-gray-400">{asset.symbol} • {asset.type}</p>
            {asset.description && (
              <p className="text-xs text-gray-500 mt-1">{asset.description}</p>
            )}
          </div>
        </div>
        <motion.button
          onClick={checkBalance}
          disabled={loading}
          className="px-4 py-2 hexagon glass-effect hover:neon-glow text-sm font-semibold
            disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? "Loading..." : "Refresh Balance"}
        </motion.button>
      </div>

      <div className="p-4 bg-gray-900/50 rounded-xl">
        <p className="text-sm text-gray-400">Your Balance</p>
        <p className="text-2xl font-bold">{balance} {asset.symbol}</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Burn Tokens</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            placeholder={`Amount (max: ${balance})`}
            className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
          />
          <motion.button
            onClick={burnTokens}
            disabled={loading}
            className="px-4 py-2 hexagon glass-effect hover:neon-glow-purple text-white font-semibold
              disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowDownRight size={16} />
          </motion.button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
          <RefreshCw size={16} />
          Redeem Tokens
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder={`Amount (max: ${balance})`}
            className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
          />
          <motion.button
            onClick={redeemTokens}
            disabled={loading}
            className="px-4 py-2 hexagon glass-effect hover:neon-glow text-white font-semibold
              disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Redeem
          </motion.button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</p>
        <p>Network: Arc Testnet (Chain ID: 5042002)</p>
      </div>
    </div>
  )
}

export default AssetInteraction
