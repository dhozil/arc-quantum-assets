import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, LogOut, Circle } from 'lucide-react'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: any
  }
}

const WalletConnect = () => {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<string>("0")
  const [networkName, setNetworkName] = useState<string>("Unknown")

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getNetworkName = (chainId: string) => {
    const networks: { [key: string]: string } = {
      '0x4cf2e': 'Arc Network',
      '0x1': 'Ethereum',
      '0x89': 'Polygon',
      '0xa86a': 'Avalanche',
    }
    return networks[chainId] || 'Unknown Network'
  }

  const addArcNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4cf2e',
          chainName: 'Arc Network',
          nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
          rpcUrls: ['https://rpc.testnet.arc.network'],
          blockExplorerUrls: ['https://explorer.arc.testnet.io']
        }]
      })
    } catch (error) {
      console.error('Error adding Arc Network:', error)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another wallet')
      return
    }

    if (isConnecting) {
      return
    }

    try {
      setIsConnecting(true)
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      setAddress(accounts[0])
      
      // Get balance and network info
      const provider = new ethers.BrowserProvider(window.ethereum)
      const bal = await provider.getBalance(accounts[0])
      setBalance(ethers.formatEther(bal))
      
      const network = await provider.getNetwork()
      setNetworkName(getNetworkName(network.chainId.toString(16)))
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      if (error.code === -32002) {
        alert('Another wallet request is pending. Please wait and try again.')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setBalance("0")
    setNetworkName("Unknown")
  }

  const updateWalletInfo = async () => {
    if (window.ethereum && address) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const bal = await provider.getBalance(address)
        setBalance(ethers.formatEther(bal))
        
        const network = await provider.getNetwork()
        setNetworkName(getNetworkName(network.chainId.toString(16)))
      } catch (error) {
        console.error('Error updating wallet info:', error)
      }
    }
  }

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
            await updateWalletInfo()
          }
        })
        
      // Listen for account and network changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          updateWalletInfo()
        } else {
          setAddress(null)
        }
      }
      
      const handleChainChanged = () => {
        updateWalletInfo()
      }
      
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  return (
    <div>
      {address ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 hexagon glass-effect">
            <Circle size={8} className="text-green-400 fill-green-400" />
            <span className="text-sm font-semibold">{formatAddress(address)}</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-400">{parseFloat(balance).toFixed(4)} ARC</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-400">{networkName}</span>
          </div>
          <motion.button
            onClick={disconnectWallet}
            className="p-2 hexagon glass-effect hover:neon-glow-purple transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} />
          </motion.button>
        </div>
      ) : (
        <motion.button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-2 px-4 py-2 hexagon glass-effect
            hover:neon-glow transition-all duration-300
            disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wallet size={18} />
          <span className="text-sm font-semibold">
            {isConnecting ? 'Connecting...' : 'Connect'}
          </span>
        </motion.button>
      )}
    </div>
  )
}

export default WalletConnect
