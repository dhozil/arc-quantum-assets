import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Home, Briefcase, TrendingUp, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface RadialMenuProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const RadialMenu = ({ activeSection, onSectionChange }: RadialMenuProps) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
    { id: 'market', icon: TrendingUp, label: 'Market' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuCenter, setMenuCenter] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      setMenuCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
  }, [])

  // Calculate distance from mouse to menu center
  const distance = Math.sqrt(
    Math.pow(mousePosition.x - menuCenter.x, 2) +
    Math.pow(mousePosition.y - menuCenter.y, 2)
  )

  // Map distance to opacity (closer = more opaque)
  const maxDistance = 300
  const centerOpacity = useTransform(
    useMotionValue(Math.min(distance, maxDistance)),
    [0, maxDistance],
    [1, 0.3]
  )

  // Menu items only appear when close
  const itemsVisible = distance < 150

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div ref={menuRef} className="relative w-32 h-32">
        {menuItems.map((item, index) => {
          const angle = (index * 90 - 90) * (Math.PI / 180)
          const radius = 50
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius

          return (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`absolute w-12 h-12 flex items-center justify-center
                hexagon transition-all duration-300
                ${activeSection === item.id 
                  ? 'neon-glow quantum-gradient text-white' 
                  : 'glass-effect text-gray-300 hover:text-white'
                }`}
              style={{
                left: `calc(50% + ${x}px - 24px)`,
                top: `calc(50% + ${y}px - 24px)`,
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: itemsVisible ? 1 : 0,
                opacity: itemsVisible ? 1 : 0
              }}
              transition={{ delay: itemsVisible ? index * 0.05 : 0 }}
            >
              <item.icon size={20} />
            </motion.button>
          )
        })}

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: centerOpacity.get() }}
          whileHover={{ opacity: 1 }}
        >
          <div className="w-16 h-16 hexagon quantum-gradient neon-glow flex items-center justify-center">
            <span className="text-2xl">⚛</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RadialMenu
