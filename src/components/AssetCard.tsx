import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface AssetCardProps {
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
  }
  mousePosition: { x: number; y: number }
  onTrade?: () => void
  onClick?: () => void
}

const AssetCard = ({ asset, mousePosition, onTrade, onClick }: AssetCardProps) => {
  const isPositive = asset.change >= 0

  return (
    <motion.div
      className="glass-effect rounded-2xl p-6 relative overflow-hidden cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateX(${
          (mousePosition.y - window.innerHeight / 2) / 50
        }deg) rotateY(${
          (mousePosition.x - window.innerWidth / 2) / 50
        }deg)`,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.05, rotateX: 0, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${asset.color}, transparent 50%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 hexagon flex items-center justify-center" style={{ background: asset.color }}>
            <span className="text-2xl font-bold">{asset.symbol.slice(0, 2)}</span>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm font-semibold">{isPositive ? '+' : ''}{asset.change}%</span>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-1">{asset.name}</h3>
        <p className="text-sm text-gray-400 mb-2">{asset.type}</p>
        {asset.description && (
          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{asset.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Price</span>
            <span className="font-semibold">${asset.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">APY</span>
            <span className="font-semibold text-neon-green">{asset.apy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Value</span>
            <span className="font-semibold">${(asset.value / 1000000).toFixed(2)}M</span>
          </div>
        </div>

        <motion.button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onTrade?.()
          }}
          className="w-full mt-4 py-2 hexagon quantum-gradient text-white font-semibold text-sm
            hover:neon-glow transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Trade
        </motion.button>
      </div>

      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-30" style={{ background: asset.color }} />
    </motion.div>
  )
}

export default AssetCard
