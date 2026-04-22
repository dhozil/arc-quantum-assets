import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Key, Settings as SettingsIcon, AlertTriangle, Plus } from 'lucide-react'
import { RWA_CONTRACT_ADDRESS, RWA_ABI, MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, FACTORY_CONTRACT_ADDRESS, FACTORY_ABI } from '../lib/contracts'
import { ethers } from 'ethers'
import { useToast } from '../contexts/ToastContext'

const AdminPanel = () => {
  const [loading, setLoading] = useState(false)
  const [mintAmount, setMintAmount] = useState('')
  const [mintAddress, setMintAddress] = useState('')
  const [platformFee, setPlatformFee] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [deployName, setDeployName] = useState('')
  const [deploySymbol, setDeploySymbol] = useState('')
  const [deployAssetName, setDeployAssetName] = useState('')
  const [deployAssetType, setDeployAssetType] = useState('')
  const [deployDescription, setDeployDescription] = useState('')
  const [deployImage, setDeployImage] = useState('')
  const [deployTotalValue, setDeployTotalValue] = useState('')
  const [deployAPY, setDeployAPY] = useState('')
  const [deployMaturityDate, setDeployMaturityDate] = useState('')
  const [deployMaxSupply, setDeployMaxSupply] = useState('')
  const toast = useToast()

  const getRWAContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(RWA_CONTRACT_ADDRESS, RWA_ABI, signer)
  }

  const getMarketplaceContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer)
  }

  const getFactoryContract = async () => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, signer)
  }

  const checkOwnership = async () => {
    try {
      const marketplace = await getMarketplaceContract()
      if (!marketplace) {
        console.log('Marketplace contract not found')
        setIsOwner(false)
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) {
        console.log('No accounts connected')
        setIsOwner(false)
        return
      }

      const owner = await marketplace.owner()
      const isOwnerMatch = accounts[0].toLowerCase() === owner.toLowerCase()
      
      console.log('Ownership check:', {
        connectedAccount: accounts[0],
        contractOwner: owner,
        isOwner: isOwnerMatch
      })
      
      setIsOwner(isOwnerMatch)
    } catch (error) {
      console.error('Error checking ownership:', error)
      setIsOwner(false)
    }
  }

  useEffect(() => {
    checkOwnership()
    
    // Re-check when wallet changes
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Accounts changed:', accounts)
      checkOwnership()
    }
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  const mintTokens = async () => {
    try {
      setLoading(true)
      const rwa = await getRWAContract()
      if (!rwa) {
        toast.showError('Please connect wallet first')
        return
      }

      const amount = ethers.parseEther(mintAmount || '1')
      const to = mintAddress || (await window.ethereum.request({ method: 'eth_accounts' }))[0]

      const tx = await rwa.mint(to, amount)
      await tx.wait()

      toast.showSuccess('Tokens minted successfully!')
      setMintAmount('')
      setMintAddress('')
    } catch (error: any) {
      console.error('Error minting:', error)
      toast.showError(`Error minting: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updatePlatformFee = async () => {
    try {
      setLoading(true)
      const marketplace = await getMarketplaceContract()
      if (!marketplace) {
        toast.showError('Please connect wallet first')
        return
      }

      const fee = parseInt(platformFee || '200')
      const tx = await marketplace.updatePlatformFee(fee)
      await tx.wait()

      toast.showSuccess('Platform fee updated successfully!')
      setPlatformFee('')
    } catch (error: any) {
      console.error('Error updating fee:', error)
      toast.showError(`Error updating fee: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const deployNewToken = async () => {
    try {
      setLoading(true)
      const factory = await getFactoryContract()
      if (!factory) {
        toast.showError('Please connect wallet first')
        return
      }

      const totalValue = ethers.parseEther(deployTotalValue || '1000000')
      const maxSupply = ethers.parseEther(deployMaxSupply || '1000000')
      const maturityDate = Math.floor(new Date(deployMaturityDate || '2025-12-31').getTime() / 1000)

      const tx = await factory.deployToken(
        deployName || 'New Token',
        deploySymbol || 'NEW',
        deployAssetName || 'New Asset',
        deployAssetType || 'Real Estate',
        totalValue,
        parseInt(deployAPY || '10'),
        maturityDate,
        maxSupply
      )
      const receipt = await tx.wait()

      toast.showSuccess(`Token deployed successfully! Address: ${receipt.logs[0].address}`)

      // Clear form
      setDeployName('')
      setDeploySymbol('')
      setDeployAssetName('')
      setDeployAssetType('')
      setDeployDescription('')
      setDeployImage('')
      setDeployTotalValue('')
      setDeployAPY('')
      setDeployMaturityDate('')
      setDeployMaxSupply('')
    } catch (error: any) {
      console.error('Error deploying token:', error)
      toast.showError(`Error deploying token: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOwner) return null

  return (
    <div className="glass-effect rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield size={24} className="text-neon-purple" />
        <h3 className="text-xl font-bold">Admin Panel</h3>
      </div>

      <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400 font-semibold">Admin Access Only</p>
            <p className="text-xs text-gray-400">This panel is only visible to contract owners.</p>
          </div>
        </div>
      </div>

      {/* Deploy New Asset */}
      <div>
        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Plus size={18} />
          Deploy New Asset
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Token Name</label>
              <input
                type="text"
                value={deployName}
                onChange={(e) => setDeployName(e.target.value)}
                placeholder="Quantum Bond"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Symbol</label>
              <input
                type="text"
                value={deploySymbol}
                onChange={(e) => setDeploySymbol(e.target.value)}
                placeholder="QT-BOND"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Asset Name</label>
              <input
                type="text"
                value={deployAssetName}
                onChange={(e) => setDeployAssetName(e.target.value)}
                placeholder="Quantum Office Building"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Asset Type</label>
              <input
                type="text"
                value={deployAssetType}
                onChange={(e) => setDeployAssetType(e.target.value)}
                placeholder="Real Estate"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={deployDescription}
              onChange={(e) => setDeployDescription(e.target.value)}
              placeholder="Describe the asset..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Image/Logo (Emoji or URL)</label>
            <input
              type="text"
              value={deployImage}
              onChange={(e) => setDeployImage(e.target.value)}
              placeholder="🏛️ or https://example.com/logo.png"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Total Value</label>
              <input
                type="number"
                value={deployTotalValue}
                onChange={(e) => setDeployTotalValue(e.target.value)}
                placeholder="1000000"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">APY (%)</label>
              <input
                type="number"
                value={deployAPY}
                onChange={(e) => setDeployAPY(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Supply</label>
              <input
                type="number"
                value={deployMaxSupply}
                onChange={(e) => setDeployMaxSupply(e.target.value)}
                placeholder="1000000"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Maturity Date</label>
            <input
              type="date"
              value={deployMaturityDate}
              onChange={(e) => setDeployMaturityDate(e.target.value)}
              placeholder="2025-12-31"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
            />
          </div>
          <motion.button
            onClick={deployNewToken}
            disabled={loading || !deployName || !deploySymbol}
            className="w-full py-3 hexagon quantum-gradient text-white font-semibold
              disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Deploying...' : 'Deploy New Token'}
          </motion.button>
        </div>
      </div>

      {/* Mint Tokens */}
      <div>
        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Key size={18} />
          Mint Tokens
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount</label>
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount to mint"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Recipient (optional)</label>
            <input
              type="text"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="Recipient address (defaults to your address)"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
            />
          </div>
          <motion.button
            onClick={mintTokens}
            disabled={loading || !mintAmount}
            className="w-full py-3 hexagon quantum-gradient text-white font-semibold
              disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Minting...' : 'Mint Tokens'}
          </motion.button>
        </div>
      </div>

      {/* Update Platform Fee */}
      <div>
        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <SettingsIcon size={18} />
          Platform Settings
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Platform Fee (basis points)</label>
            <input
              type="number"
              value={platformFee}
              onChange={(e) => setPlatformFee(e.target.value)}
              placeholder="200 = 2%"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-blue"
            />
          </div>
          <motion.button
            onClick={updatePlatformFee}
            disabled={loading || !platformFee}
            className="w-full py-3 hexagon glass-effect hover:neon-glow-purple text-white font-semibold
              disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Updating...' : 'Update Fee'}
          </motion.button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>Factory Contract: {FACTORY_CONTRACT_ADDRESS.slice(0, 6)}...{FACTORY_CONTRACT_ADDRESS.slice(-4)}</p>
        <p>RWA Contract: {RWA_CONTRACT_ADDRESS.slice(0, 6)}...{RWA_CONTRACT_ADDRESS.slice(-4)}</p>
        <p>Marketplace Contract: {MARKETPLACE_CONTRACT_ADDRESS.slice(0, 6)}...{MARKETPLACE_CONTRACT_ADDRESS.slice(-4)}</p>
      </div>
    </div>
  )
}

export default AdminPanel
