import { motion } from 'framer-motion'

interface PriceChartProps {
  data: number[]
  color: string
}

const PriceChart = ({ data, color }: PriceChartProps) => {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 80 - 10
    return `${x},${y}`
  }).join(' ')

  const gradientId = `gradient-${color.replace('#', '')}`

  return (
    <div className="w-full h-48 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#${gradientId})`}
        />
        
        {/* Line */}
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Current price dot */}
        <circle
          cx="100"
          cy={100 - ((data[data.length - 1] - min) / range) * 80 - 10}
          r="3"
          fill={color}
        >
          <animate
            attributeName="r"
            values="3;5;3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      
      {/* Price labels */}
      <div className="absolute top-0 left-0 text-xs text-gray-400">
        ${max.toFixed(2)}
      </div>
      <div className="absolute bottom-0 left-0 text-xs text-gray-400">
        ${min.toFixed(2)}
      </div>
      <div className="absolute bottom-0 right-0 text-xs text-gray-400">
        Current: ${data[data.length - 1].toFixed(2)}
      </div>
    </div>
  )
}

export default PriceChart
