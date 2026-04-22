import { motion } from 'framer-motion'

interface HexButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
}

const HexButton = ({ children, variant = 'primary', size = 'medium', onClick }: HexButtonProps) => {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: 'quantum-gradient neon-glow',
    secondary: 'glass-effect neon-glow-purple'
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Default mock functionality
      alert('This feature requires smart contract deployment. Coming soon!')
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`hexagon font-semibold transition-all duration-300
        ${sizeClasses[size]} ${variantClasses[variant]}`}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95, rotate: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  )
}

export default HexButton
