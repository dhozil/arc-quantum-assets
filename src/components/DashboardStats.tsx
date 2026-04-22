import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Layers } from 'lucide-react'
import { RWA_ABI, FACTORY_CONTRACT_ADDRESS, FACTORY_ABI } from '../lib/contracts'
import { ethers } from 'ethers'

interface DashboardStatsProps {
  contractAddress?: string
  assetSymbol?: string
}

const DashboardStats = ({ contractAddress, assetSymbol }: DashboardStatsProps) => {
  const [totalValue, setTotalValue] = useState<string>("0")
  const [totalAssets, setTotalAssets] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const getContract = async (address: string) => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(address, RWA_ABI, signer)
  }

  const getFactoryContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, signer)
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) {
        return
      }

      // Get balance from selected contract
      if (contractAddress) {
        try {
          const contract = await getContract(contractAddress)
          if (contract) {
            const balance = await contract.balanceOf(accounts[0])
            setTotalValue(ethers.formatEther(balance))
          }
        } catch (error) {
          console.error('Error getting balance for contract:', contractAddress, error)
          setTotalValue('0')
        }
      }

      // Get deployed tokens from factory and count assets user owns
      const factory = await getFactoryContract()
      if (factory) {
        try {
          const deployedTokens = await factory.getDeployedTokens()
          let ownedCount = 0
          
          for (const tokenAddress of deployedTokens) {
            try {
              const token = await getContract(tokenAddress)
              if (token) {
                const balance = await token.balanceOf(accounts[0])
                if (balance > 0) {
                  ownedCount++
                }
              }
            } catch (error) {
              console.error('Error checking balance for token:', tokenAddress, error)
            }
          }
          
          setTotalAssets(ownedCount)
        } catch (error) {
          console.error('Error getting deployed tokens:', error)
          setTotalAssets(0)
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [contractAddress])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <motion.div
        className="glass-effect rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 hexagon quantum-gradient">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-sm text-gray-400">Total Balance</span>
        </div>
        <p className="text-2xl font-bold">
          {loading ? '...' : parseFloat(totalValue).toFixed(2)} <span className="text-sm text-gray-400 ml-1">{assetSymbol || 'QT-BOND'}</span>
        </p>
      </motion.div>

      <motion.div
        className="glass-effect rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 hexagon glass-effect hover:neon-glow">
            <Layers size={20} className="text-neon-blue" />
          </div>
          <span className="text-sm text-gray-400">Total Assets Owned</span>
        </div>
        <p className="text-2xl font-bold">
          {loading ? '...' : totalAssets} <span className="text-sm text-gray-400 ml-1">assets</span>
        </p>
      </motion.div>

      <motion.div
        className="glass-effect rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 hexagon glass-effect hover:neon-glow-purple">
            <TrendingUp size={20} className="text-neon-purple" />
          </div>
          <span className="text-sm text-gray-400">Network</span>
        </div>
        <p className="text-2xl font-bold">
          Arc Network
        </p>
      </motion.div>
    </div>
  )
}

export default DashboardStats
