import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Clock, Activity, X, AlertCircle } from 'lucide-react'
import { MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, RWA_CONTRACT_ADDRESS, RWA_ABI } from '../lib/contracts'
import { ethers } from 'ethers'
import PriceChart from './PriceChart'

interface TradingPageProps {
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
    contractAddress?: string
    description?: string
  }
  onBack: () => void
}

const TradingPage = ({ asset, onBack }: TradingPageProps) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState(asset.price.toString())
  const [orders, setOrders] = useState<any[]>([])
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [userBalance, setUserBalance] = useState('0')

  // Check if contract address is a fake/sample address
  const isFakeAddress = asset.contractAddress && (
    asset.contractAddress === '0x1234567890123456789012345678901234567890' ||
    asset.contractAddress === '0x2345678901234567890123456789012345678901' ||
    asset.contractAddress === '0x3456789012345678901234567890123456789012' ||
    asset.contractAddress === '0x4567890123456789012345678901234567890123'
  )

  // Mock price data
  const mockPriceData: Record<string, number[]> = {
    'QT-BOND': [1000, 1015, 1010, 1025, 1020, 1030, 1025, 1040, 1035, 1050, 1045, 1060, 1055, 1070, 1065, 1080, 1075, 1090, 1085, 1100, 1095, 1110, 1105, 1120, 1115, 1130, 1125, 1140, 1135, 1150],
    'SOLAR': [1200, 1220, 1210, 1240, 1230, 1250, 1240, 1260, 1250, 1270, 1260, 1280, 1270, 1290, 1280, 1300, 1290, 1310, 1300, 1320, 1310, 1330, 1320, 1340, 1330, 1350, 1340, 1360, 1350, 1370],
    'STL-GOLD': [2100, 2120, 2110, 2140, 2130, 2150, 2140, 2160, 2150, 2170, 2160, 2180, 2170, 2190, 2180, 2200, 2190, 2210, 2200, 2220, 2210, 2230, 2220, 2240, 2230, 2250, 2240, 2260, 2250, 2270, 2260, 2280],
    'HEL-ENG': [700, 710, 705, 720, 715, 730, 725, 740, 735, 750, 745, 760, 755, 770, 765, 780, 775, 790, 785, 800, 795, 810, 805, 820, 815, 830, 825, 840, 835, 850, 845, 860, 855, 870],
    'URE-EST': [2400, 2420, 2410, 2440, 2430, 2450, 2440, 2460, 2450, 2470, 2460, 2480, 2470, 2490, 2480, 2500, 2490, 2510, 2500, 2520, 2510, 2530, 2520, 2540, 2530, 2550, 2540, 2560, 2550, 2570]
  }

  const priceData = mockPriceData[asset.symbol] || []
  const isPositive = asset.change >= 0

  const getMarketplaceContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer)
  }

  const getRWAContract = async (address?: string) => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(address || RWA_CONTRACT_ADDRESS, RWA_ABI, signer)
  }

  const loadOrders = async () => {
    try {
      const marketplace = await getMarketplaceContract()
      if (!marketplace) return

      const tokenAddress = asset.contractAddress || RWA_CONTRACT_ADDRESS
      const orderIds = await marketplace.getOrdersByToken(tokenAddress)
      const orderPromises = orderIds.map((id: bigint) => marketplace.getOrder(id))
      const orderData = await Promise.all(orderPromises)
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const userAddress = accounts[0]
      
      setOrders(orderData.filter((order: any) => order.active))
      setUserOrders(orderData.filter((order: any) => order.active && order.seller.toLowerCase() === userAddress.toLowerCase()))
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const cancelOrder = async (orderId: bigint) => {
    try {
      setLoading(true)
      const marketplace = await getMarketplaceContract()
      if (!marketplace) {
        alert('Please connect wallet first')
        return
      }

      const tx = await marketplace.cancelOrder(orderId)
      await tx.wait()

      alert('Order cancelled successfully! Tokens returned to your wallet.')
      loadOrders()
      loadBalance()
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      alert(`Error cancelling order: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadBalance = async () => {
    try {
      const rwa = await getRWAContract(asset.contractAddress)
      if (!rwa) return

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) return
      
      const bal = await rwa.balanceOf(accounts[0])
      setUserBalance(ethers.formatEther(bal))
    } catch (error) {
      console.error('Error loading balance:', error)
      setUserBalance('0')
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
      const pricePerToken = ethers.parseUnits(price || '1', 6)
      const tokenAddress = asset.contractAddress || RWA_CONTRACT_ADDRESS

      const rwa = await getRWAContract(tokenAddress)
      if (!rwa) return

      await rwa.approve(MARKETPLACE_CONTRACT_ADDRESS, tokenAmount)

      const tx = await marketplace.createOrder(tokenAddress, tokenAmount, pricePerToken)
      await tx.wait()

      alert('Order created successfully!')
      setAmount('')
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

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isFakeAddress) {
          setUserBalance('0')
          setOrders([])
          setUserOrders([])
          return
        }
        await Promise.all([loadOrders(), loadBalance()])
      } catch (error) {
        console.error('Error loading trading data:', error)
        setUserBalance('0')
        setOrders([])
        setUserOrders([])
      }
    }
    
    loadData()
  }, [asset.contractAddress])

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 glass-effect rounded-lg hover:bg-gray-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </motion.button>
      </div>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 hexagon flex items-center justify-center" style={{ background: asset.color }}>
              <span className="text-3xl font-bold">{asset.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{asset.name}</h2>
              <p className="text-sm text-gray-400">{asset.symbol} • {asset.type}</p>
              {asset.description && (
                <p className="text-xs text-gray-500 mt-1">{asset.description}</p>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="text-lg font-bold">{isPositive ? '+' : ''}{asset.change}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Chart & Info */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Price Chart */}
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Current Price</p>
                <p className="text-3xl font-bold">${asset.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">24h Change</p>
                <p className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}${(asset.price * asset.change / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <PriceChart data={priceData} color={asset.color} />
          </div>

          {/* Token Info */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity size={24} />
              Token Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Asset Type</p>
                <p className="font-semibold">{asset.type}</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Total Value</p>
                <p className="font-semibold">${(asset.value / 1000000).toFixed(2)}M</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">APY</p>
                <p className="font-semibold text-neon-green">{asset.apy}%</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Your Balance</p>
                <p className="font-semibold">{userBalance} {asset.symbol}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Trading Interface */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Trading Form */}
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTab('buy')}
                className={`flex-1 py-3 px-4 hexagon font-semibold transition-all ${
                  tab === 'buy'
                    ? 'quantum-gradient neon-glow text-white'
                    : 'glass-effect text-gray-400 hover:text-white'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTab('sell')}
                className={`flex-1 py-3 px-4 hexagon font-semibold transition-all ${
                  tab === 'sell'
                    ? 'quantum-gradient neon-glow text-white'
                    : 'glass-effect text-gray-400 hover:text-white'
                }`}
              >
                Sell
              </button>
            </div>

            {tab === 'buy' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price (USDC)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Amount (max: ${userBalance})`}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold">
                    ${amount && price ? ethers.formatUnits((BigInt(Math.floor(parseFloat(amount) * 1e18)) * BigInt(Math.floor(parseFloat(price) * 1e6))) / BigInt(1e18), 6) : '0.00'}
                  </p>
                </div>
                <motion.button
                  onClick={createOrder}
                  disabled={loading || !amount || !price || isFakeAddress}
                  className="w-full py-4 hexagon quantum-gradient neon-glow text-white font-bold text-lg
                    disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isFakeAddress ? 'Trading Disabled - Demo Asset' : (loading ? 'Processing...' : 'Place Buy Order')}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price (USDC)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-neon-blue"
                  />
                </div>
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
                <div className="p-4 bg-gray-900/50 rounded-xl">
                  <p className="text-sm text-gray-400">You'll Receive</p>
                  <p className="text-xl font-bold">
                    ${amount && price ? ethers.formatUnits((BigInt(Math.floor(parseFloat(amount) * 1e18)) * BigInt(Math.floor(parseFloat(price) * 1e6))) / BigInt(1e18), 6) : '0.00'}
                  </p>
                </div>
                <motion.button
                  onClick={createOrder}
                  disabled={loading || !amount || !price || isFakeAddress}
                  className="w-full py-4 hexagon glass-effect hover:neon-glow-purple text-white font-bold text-lg
                    disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isFakeAddress ? 'Trading Disabled - Demo Asset' : (loading ? 'Processing...' : 'Place Sell Order')}
                </motion.button>
              </div>
            )}
          </div>

          {/* Order Book */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock size={24} />
              Order Book
            </h2>
            
            {/* User's Orders */}
            {userOrders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-neon-blue">Your Orders</h3>
                <div className="space-y-2">
                  {userOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{ethers.formatEther(order.tokenAmount)} {asset.symbol}</p>
                        <p className="text-xs text-gray-400">
                          ${ethers.formatUnits(order.pricePerToken, 6)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => cancelOrder(order.id)}
                          disabled={loading}
                          className="px-3 py-1 hexagon glass-effect hover:neon-glow-purple text-white text-sm font-semibold
                            disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Orders */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-400">Market Orders</h3>
              {orders.filter((o) => !userOrders.includes(o)).length === 0 ? (
                <p className="text-center text-gray-400 py-4">No other active orders</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orders.filter((o) => !userOrders.includes(o)).slice(0, 10).map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{ethers.formatEther(order.tokenAmount)} {asset.symbol}</p>
                        <p className="text-xs text-gray-400">
                          ${ethers.formatUnits(order.pricePerToken, 6)}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => fillOrder(order.id)}
                        disabled={loading}
                        className="px-3 py-1 hexagon quantum-gradient text-white text-sm font-semibold
                          disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Buy
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradingPage
