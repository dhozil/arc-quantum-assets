import { motion } from 'framer-motion'
import { Zap, Shield, TrendingUp, Lock, Globe, Zap as Bolt } from 'lucide-react'

const LandingPage = () => {
  const features = [
    {
      icon: <Zap size={32} />,
      title: 'Instant Settlement',
      description: 'Sub-second deterministic finality powered by Arc blockchain architecture'
    },
    {
      icon: <Shield size={32} />,
      title: 'Privacy-First',
      description: 'Opt-in privacy controls for sensitive transactions while maintaining auditability'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Stable Fees',
      description: 'Predictable USDC-denominated fees with no gas token volatility'
    },
    {
      icon: <Lock size={32} />,
      title: 'Secure',
      description: 'Post-quantum security and enterprise-grade protection for your assets'
    },
    {
      icon: <Globe size={32} />,
      title: 'Global Access',
      description: '24/7 cross-border payments and payouts with instant settlement'
    },
    {
      icon: <Bolt size={32} />,
      title: 'Quantum Speed',
      description: 'High-frequency trading support with real-time risk management'
    }
  ]

  const assetTypes = [
    { name: 'Treasury Bonds', icon: '🏛️', description: 'Tokenized government bonds with instant settlement' },
    { name: 'Real Estate', icon: '🏠', description: 'Fractional ownership of premium properties' },
    { name: 'Commodities', icon: '💎', description: 'Gold, oil, and other tokenized commodities' },
    { name: 'Energy', icon: '⚡', description: 'Renewable energy infrastructure tokens' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-24 h-24 hexagon quantum-gradient neon-glow mx-auto mb-8 flex items-center justify-center">
            <Zap size={48} className="text-white" />
          </div>
          
          <h1 className="text-6xl font-bold mb-6 text-glow animate-float">
            Arc Quantum Asset Hub
          </h1>
          
          <p className="text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Tokenize Reality. Own the Future.
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            The first quantum-inspired RWA tokenization platform on Arc Blockchain.
            Experience instant settlement, privacy-first design, and stable fees.
          </p>

          <div className="flex justify-center gap-4 mb-16">
            <motion.button
              className="px-8 py-4 hexagon quantum-gradient neon-glow text-white font-bold text-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const connectButton = document.querySelector('button:has(.text-sm.font-semibold)') as HTMLButtonElement
                connectButton?.click()
              }}
            >
              Connect Wallet to Start
            </motion.button>
            
            <motion.button
              className="px-8 py-4 hexagon glass-effect hover:neon-glow-purple text-white font-bold text-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://docs.arc.network', '_blank')}
            >
              Read Documentation
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-glow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Quantum-Powered Features
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="glass-effect rounded-2xl p-6 hover:neon-glow transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-16 h-16 hexagon quantum-gradient flex items-center justify-center mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Asset Types Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-glow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Supported Asset Types
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assetTypes.map((asset, index) => (
            <motion.div
              key={index}
              className="glass-effect rounded-2xl p-6 text-center hover:neon-glow transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
            >
              <div className="text-5xl mb-4">{asset.icon}</div>
              <h3 className="text-xl font-bold mb-2">{asset.name}</h3>
              <p className="text-gray-400 text-sm">{asset.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4 text-glow">About Arc Blockchain</h2>
          <p className="text-gray-300 mb-4">
            Arc is a stablecoin-native Layer-1 blockchain purpose-built for stablecoin finance 
            and tokenization. Built by Circle, Arc introduces a new kind of blockchain architecture 
            optimized for stablecoin transactions with predictable fees, deterministic settlement, 
            and compliance-ready privacy.
          </p>
          <p className="text-gray-400">
            Our Quantum Asset Hub leverages Arc's unique features to provide a seamless experience 
            for tokenizing and trading real-world assets with institutional-grade security and performance.
          </p>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 text-glow">Ready to Start?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Connect your wallet to explore tokenized assets and experience the future of RWA trading.
          </p>
          <motion.button
            className="px-8 py-4 hexagon quantum-gradient neon-glow text-white font-bold text-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const connectButton = document.querySelector('button:has(.text-sm.font-semibold)') as HTMLButtonElement
              connectButton?.click()
            }}
          >
            Connect Wallet Now
          </motion.button>
        </motion.div>
      </section>
    </div>
  )
}

export default LandingPage
