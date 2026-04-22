import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, RWA_CONTRACT_ADDRESS, RWA_ABI } from '../lib/contracts'
import { ethers } from 'ethers'
import PriceChart from './PriceChart'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  assetSymbol: string
  assetAddress: string
}

const TradeModal = ({ isOpen, onClose, assetSymbol, assetAddress }: TradeModalProps) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [userBalance, setUserBalance] = useState('0')

  // Mock price data for each token
  const mockPriceData: Record<string, number[]> = {
    'QT-BOND': [1000, 1015, 1010, 1025, 1020, 1030, 1025, 1040, 1035, 1050, 1045, 1060, 1055, 1070, 1065, 1080, 1075, 1090, 1085, 1100, 1095, 1110, 1105, 1120, 1115, 1130, 1125, 1140, 1135, 1150],
    'NEX-RE': [2400, 2420, 2410, 2440, 2430, 2450, 2440, 2460, 2450, 2470, 2460, 2480, 2470, 2490, 2480, 2500, 2490, 2510, 2500, 2520, 2510, 2530, 2520, 2540, 2530, 2550, 2540, 2560, 2550, 2570],
    'STL-GOLD': [2100, 2120, 2110, 2140, 2130, 2150, 2140, 2160, 2150, 2170, 2160, 2180, 2170, 2190, 2180, 2200, 2190, 2210, 2200, 2220, 2210, 2230, 2220, 2240, 2230, 2250, 2240, 2260, 2250, 2270, 2260, 2280],
    'HEL-ENG': [700, 710, 705, 720, 715, 730, 725, 740, 735, 750, 745, 760, 755, 770, 765, 780, 775, 790, 785, 800, 795, 810, 805, 820, 815, 830, 825, 840, 835, 850, 845, 860, 855, 870]
  }

  const tokenColor: Record<string, string> = {
    'QT-BOND': '#00d4ff',
    'NEX-RE': '#b829dd',
    'STL-GOLD': '#ff00ff',
    'HEL-ENG': '#00ff88'
  }

  const priceData = mockPriceData[assetSymbol] || []
  const color = tokenColor[assetSymbol] || '#00d4ff'

  const getMarketplaceContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer)
  }

  const getRWAContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(RWA_CONTRACT_ADDRESS, RWA_ABI, signer)
  }

  const loadOrders = async () => {
    try {
      const marketplace = await getMarketplaceContract()
      if (!marketplace) return

      const orderIds = await marketplace.getOrdersByToken(assetAddress)
      const orderPromises = orderIds.map((id: bigint) => marketplace.getOrder(id))
      const orderData = await Promise.all(orderPromises)
      
      setOrders(orderData.filter((order: any) => order.active))
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const loadBalance = async () => {
    try {
      const rwa = await getRWAContract()
      if (!rwa) return

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const bal = await rwa.balanceOf(accounts[0])
      setUserBalance(ethers.formatEther(bal))
    } catch (error) {
      console.error('Error loading balance:', error)
    }
  }

  const createOrder = async () => {
    try {
      setLoading(true)
      const marketplace = await getMarketplaceContract()
      if (!marketplace) {
        alert('Please connect wallet first')
        return
      }

      const tokenAmount = ethers.parseEther(amount || '1')
      const pricePerToken = ethers.parseUnits(price || '1', 6) // USDC uses 6 decimals

      // First approve the marketplace to spend tokens
      const rwa = await getRWAContract()
      if (!rwa) return

      await rwa.approve(MARKETPLACE_CONTRACT_ADDRESS, tokenAmount)

      // Create the order
      const tx = await marketplace.createOrder(assetAddress, tokenAmount, pricePerToken)
      await tx.wait()

      alert('Order created successfully!')
      setAmount('')
      setPrice('')
      loadOrders()
      loadBalance()
    } catch (error: any) {
      console.error('Error creating order:', error)
      alert(`Error creating order: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const fillOrder = async (orderId: bigint) => {
    try {
      setLoading(true)
      const marketplace = await getMarketplaceContract()
      if (!marketplace) {
        alert('Please connect wallet first')
        return
      }

      const tx = await marketplace.fillOrder(orderId)
      await tx.wait()

      alert('Order filled successfully!')
      loadOrders()
      loadBalance()
    } catch (error: any) {
      console.error('Error filling order:', error)
      alert(`Error filling order: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Load orders when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrders()
      loadBalance()
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
        className="glass-effect rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Trade {assetSymbol}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Price Chart */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Price History (30 Days)</h3>
            <PriceChart data={priceData} color={color} />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setTab('buy')}
              className={`flex-1 py-3 px-6 hexagon font-semibold transition-all ${
                tab === 'buy'
                  ? 'quantum-gradient neon-glow text-white'
                  : 'glass-effect text-gray-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTab('sell')}
              className={`flex-1 py-3 px-6 hexagon font-semibold transition-all ${
                tab === 'sell'
                  ? 'quantum-gradient neon-glow text-white'
                  : 'glass-effect text-gray-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Balance Display */}
          <div className="p-4 bg-gray-900/50 rounded-xl mb-6">
            <p className="text-sm text-gray-400">Your {assetSymbol} Balance</p>
            <p className="text-2xl font-bold">{userBalance} {assetSymbol}</p>
          </div>

          {tab === 'buy' ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp size={20} />
                Available Orders
              </h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No active orders for this asset</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order, index) => (
                    <div
                      key={index}
                      className="glass-effect rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">{ethers.formatEther(order.tokenAmount)} {assetSymbol}</p>
                        <p className="text-sm text-gray-400">
                          ${ethers.formatUnits(order.pricePerToken, 6)} per token
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: ${ethers.formatUnits(order.totalPrice, 6)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => fillOrder(order.id)}
                          disabled={loading}
                          className="px-4 py-2 hexagon quantum-gradient text-white font-semibold text-sm
                            disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Buy
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign size={20} />
                Create Sell Order
              </h3>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount to Sell</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Amount (max: ${userBalance})`}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Price per Token (USDC)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price in USDC"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-sm text-gray-400">Estimated Total</p>
                <p className="text-xl font-bold">
                  ${amount && price ? ethers.formatUnits((BigInt(Math.floor(parseFloat(amount) * 1e18)) * BigInt(Math.floor(parseFloat(price) * 1e6))) / BigInt(1e18), 6) : '0.00'}
                </p>
              </div>

              <motion.button
                onClick={createOrder}
                disabled={loading || !amount || !price}
                className="w-full py-4 hexagon quantum-gradient neon-glow text-white font-bold text-lg
                  disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </motion.button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Contract: {MARKETPLACE_CONTRACT_ADDRESS.slice(0, 6)}...{MARKETPLACE_CONTRACT_ADDRESS.slice(-4)}
            </p>
            <p className="text-xs text-gray-500 text-center">
              Network: Arc Testnet | Platform Fee: 2%
            </p>
          </div>
        </motion.div>
      </motion.div>
  )
}

export default TradeModal
