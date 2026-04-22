import { useState } from 'react'
import { motion } from 'framer-motion'
import { RWA_CONTRACT_ADDRESS, RWA_ABI } from '../lib/contracts'
import { Wallet, ArrowDownRight } from 'lucide-react'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: any
  }
}

const ContractInteractions = () => {
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [burnAmount, setBurnAmount] = useState("")

  const getContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(RWA_CONTRACT_ADDRESS, RWA_ABI, signer)
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

  return (
    <div className="glass-effect rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Wallet size={20} />
          Contract Interactions
        </h3>
        <motion.button
          onClick={checkBalance}
          disabled={loading}
          className="px-4 py-2 hexagon glass-effect hover:neon-glow text-sm font-semibold
            disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? "Loading..." : "Check Balance"}
        </motion.button>
      </div>

      <div className="p-4 bg-gray-900/50 rounded-xl">
        <p className="text-sm text-gray-400">Your Balance</p>
        <p className="text-2xl font-bold">{balance} QT-BOND</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Burn Tokens</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            placeholder="Amount"
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

      <div className="text-xs text-gray-500">
        <p>Contract: {RWA_CONTRACT_ADDRESS.slice(0, 6)}...{RWA_CONTRACT_ADDRESS.slice(-4)}</p>
        <p>Network: Arc Testnet (Chain ID: 5042002)</p>
      </div>
    </div>
  )
}

export default ContractInteractions
