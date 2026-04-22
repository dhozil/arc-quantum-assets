import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import WalletConnect from './WalletConnect'

const QuantumHeader = () => {
  return (
    <motion.header
      className="container mx-auto px-4 py-6"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 hexagon quantum-gradient neon-glow flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-glow">Arc Quantum</h1>
            <p className="text-xs text-gray-400">Asset Hub</p>
          </div>
        </motion.div>

        <WalletConnect />
      </div>
    </motion.header>
  )
}

export default QuantumHeader
