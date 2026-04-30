import { useState, useEffect } from 'react'
import { Shield, Clock, Lock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { ethers } from 'ethers'
import HexButton from './HexButton'
import { initEscrowContract } from '../lib/escrowContract'
import { ESCROW_CONTRACT_ADDRESS } from '../lib/contracts'

interface Escrow {
  id: number
  depositor: string
  beneficiary: string
  tokenAddress: string
  amount: number
  releaseTime: number
  createdAt: number
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  metadata: string
  quantumEnabled: boolean
}

export default function EscrowPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    beneficiary: '',
    tokenAddress: '',
    amount: '',
    releaseDate: '',
    metadata: '',
    quantumEnabled: false
  })

  // Available tokens for escrow
  const availableTokens = [
    {
      address: '0xe6c03C961944cc233a6a149d20D35e7Be7957Ab0',
      symbol: 'RWA',
      name: 'QuantumRWA',
      decimals: 18
    }
  ]

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!window.ethereum) {
        alert('Please connect your wallet')
        return
      }

      if (!ESCROW_CONTRACT_ADDRESS) {
        alert('Escrow contract not deployed. Please deploy QuantumEscrow.sol first.')
        return
      }

      // Validate beneficiary address
      if (!ethers.isAddress(formData.beneficiary)) {
        alert('Invalid beneficiary address. Please enter a valid Ethereum address.')
        return
      }

      // Get current wallet address
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        const currentAddress = accounts[0].toLowerCase()
        const beneficiaryAddress = formData.beneficiary.toLowerCase()
        if (currentAddress === beneficiaryAddress) {
          alert('You cannot be your own beneficiary. Please enter a different address.')
          return
        }
      }

      const releaseTime = Math.floor(new Date(formData.releaseDate).getTime() / 1000) // Convert to seconds
      const now = Math.floor(Date.now() / 1000)
      
      // Validate duration (contract requires 30 days to 10 years)
      const minDuration = 30 * 24 * 60 * 60 // 30 days in seconds
      const maxDuration = 3650 * 24 * 60 * 60 // 10 years in seconds
      
      const duration = releaseTime - now
      
      if (duration < minDuration) {
        alert(`Release date must be at least 30 days from now. Current duration: ${Math.floor(duration / (24 * 60 * 60))} days`)
        return
      }
      
      if (duration > maxDuration) {
        alert(`Release date cannot be more than 10 years from now. Current duration: ${Math.floor(duration / (24 * 60 * 60))} days`)
        return
      }
      
      // Get decimals from selected token
      const selectedToken = availableTokens.find(t => t.address === formData.tokenAddress)
      const decimals = selectedToken?.decimals || 18
      const amount = BigInt(parseFloat(formData.amount) * (10 ** decimals))

      // Check token balance
      const tokenContract = new ethers.Contract(
        formData.tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)'],
        await new ethers.BrowserProvider(window.ethereum).getSigner()
      )
      
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner()
      const userAddress = await signer.getAddress()
      const balance = await tokenContract.balanceOf(userAddress)
      
      if (balance < amount) {
        alert(`Insufficient token balance. You have ${ethers.formatUnits(balance, decimals)} tokens but need ${formData.amount}`)
        return
      }

      // Approve token transfer first
      alert('Please approve token transfer in your wallet...')
      const approveTx = await tokenContract.approve(ESCROW_CONTRACT_ADDRESS, amount)
      await approveTx.wait()
      console.log('Token approved')

      const escrowContract = await initEscrowContract(ESCROW_CONTRACT_ADDRESS)
      await escrowContract.createEscrow(
        formData.beneficiary,
        formData.tokenAddress,
        amount,
        releaseTime,
        formData.metadata,
        formData.quantumEnabled
      )

      alert('Escrow created! Transaction submitted.')
      await loadEscrows()
      setShowCreateForm(false)
      setFormData({ beneficiary: '', tokenAddress: '', amount: '', releaseDate: '', metadata: '', quantumEnabled: false })
    } catch (error) {
      console.error('Error creating escrow:', error)
      alert('Failed to create escrow: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const loadEscrows = async () => {
    setLoading(true)
    try {
      if (!ESCROW_CONTRACT_ADDRESS) {
        console.log('Escrow contract not deployed yet')
        return
      }

      const escrowContract = await initEscrowContract(ESCROW_CONTRACT_ADDRESS)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      
      if (accounts.length > 0) {
        const userEscrowIds = await escrowContract.getUserEscrows(accounts[0])
        const escrowData = await Promise.all(
          userEscrowIds.map(async (id: number) => {
            const escrow = await escrowContract.getEscrow(id)
            return {
              id: escrow.id,
              depositor: escrow.depositor,
              beneficiary: escrow.beneficiary,
              tokenAddress: escrow.tokenAddress,
              amount: Number(escrow.amount) / 1e6,
              releaseTime: Number(escrow.releaseTime),
              createdAt: Number(escrow.createdAt),
              status: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'][escrow.status] as any,
              metadata: escrow.metadata,
              quantumEnabled: escrow.quantumEnabled
            }
          })
        )
        setEscrows(escrowData)
      }
    } catch (error) {
      console.error('Error loading escrows:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEscrows()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400'
      case 'COMPLETED': return 'text-blue-400'
      case 'CANCELLED': return 'text-red-400'
      case 'EXPIRED': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Clock className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      case 'EXPIRED': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const daysUntilRelease = (releaseTime: number) => {
    const diff = releaseTime - Date.now()
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-12 h-12 text-cyan-400" />
          <h1 className="text-5xl font-bold text-glow">Quantum Escrow</h1>
        </div>
        <p className="text-xl text-gray-300">
          Post-Quantum Secure Escrow for Long-Term Holdings
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Protected by Arc's quantum-resistant cryptography
        </p>
      </div>

      {/* Features Info */}
      <div className="glass-effect p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-cyan-400">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-cyan-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Time-Locked Security</div>
              <div className="text-sm text-gray-400">Lock funds for 30 days to 10 years with guaranteed release</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Quantum-Resistant</div>
              <div className="text-sm text-gray-400">Opt-in quantum-resistant wallets for long-term protection</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-green-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Flexible Release</div>
              <div className="text-sm text-gray-400">Beneficiary-controlled release with cancellation option</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Auto-Expiration</div>
              <div className="text-sm text-gray-400">Auto-expire 30 days past release time for safety</div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="glass-effect p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-cyan-400">Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🏠</div>
            <div className="font-semibold text-white">Real Estate</div>
            <div className="text-sm text-gray-400">Property purchase escrow</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
            <div className="font-semibold text-white">Inheritance</div>
            <div className="text-sm text-gray-400">Future-proof asset transfer</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-white">Business</div>
            <div className="text-sm text-gray-400">Contract milestone payments</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-cyan-400">{escrows.length}</div>
          <div className="text-sm text-gray-400">Total Escrows</div>
        </div>
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-400">
            {escrows.filter(e => e.status === 'ACTIVE').length}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-purple-400">
            {escrows.filter(e => e.quantumEnabled).length}
          </div>
          <div className="text-sm text-gray-400">Quantum-Enabled</div>
        </div>
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-yellow-400">
            ${(escrows.reduce((sum, e) => sum + e.amount, 0) / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-gray-400">Total Value (USDC)</div>
        </div>
      </div>

      {/* Create Escrow Button */}
      <div className="flex justify-center">
        <HexButton 
          variant="primary" 
          size="large"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create New Escrow'}
        </HexButton>
      </div>

      {/* Create Escrow Form */}
      {showCreateForm && (
        <div className="glass-effect p-8 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">Create New Escrow</h2>
          <form onSubmit={handleCreateEscrow} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Beneficiary Address</label>
              <input
                type="text"
                value={formData.beneficiary}
                onChange={(e) => setFormData({...formData, beneficiary: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Token</label>
              <select
                value={formData.tokenAddress}
                onChange={(e) => setFormData({...formData, tokenAddress: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              >
                <option value="">Select a token...</option>
                {availableTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.name} ({token.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Release Date</label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Metadata (IPFS Hash)</label>
              <input
                type="text"
                value={formData.metadata}
                onChange={(e) => setFormData({...formData, metadata: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="ipfs://..."
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="quantumEnabled"
                checked={formData.quantumEnabled}
                onChange={(e) => setFormData({...formData, quantumEnabled: e.target.checked})}
                className="w-5 h-5 accent-cyan-500"
              />
              <label htmlFor="quantumEnabled" className="text-sm text-gray-300">
                Enable Quantum-Resistant Wallet (Recommended for amounts &gt; 1M USDC)
              </label>
            </div>
            <div className="flex gap-4">
              <HexButton variant="primary" type="submit">
                Create Escrow
              </HexButton>
              <HexButton variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </HexButton>
            </div>
          </form>
        </div>
      )}

      {/* Escrow List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-cyan-400">Your Escrows</h2>
        {loading ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <div className="text-gray-400">Loading escrows...</div>
          </div>
        ) : escrows.length === 0 ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400">No escrows found</div>
            <div className="text-sm text-gray-500 mt-2">Create your first escrow to get started</div>
          </div>
        ) : (
          escrows.map((escrow) => (
            <div key={escrow.id} className="glass-effect p-6 rounded-lg hover:neon-glow transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="font-bold text-lg">Escrow #{escrow.id}</div>
                    <div className={`flex items-center gap-2 text-sm ${getStatusColor(escrow.status)}`}>
                      {getStatusIcon(escrow.status)}
                      {escrow.status}
                    </div>
                  </div>
                </div>
                {escrow.quantumEnabled && (
                  <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs text-purple-400">
                    Quantum-Enabled
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Amount</div>
                  <div className="font-semibold">${escrow.amount.toLocaleString()} USDC</div>
                </div>
                <div>
                  <div className="text-gray-400">Beneficiary</div>
                  <div className="font-semibold text-xs">{escrow.beneficiary}</div>
                </div>
                <div>
                  <div className="text-gray-400">Release In</div>
                  <div className="font-semibold">{daysUntilRelease(escrow.releaseTime)} days</div>
                </div>
                <div>
                  <div className="text-gray-400">Created</div>
                  <div className="font-semibold">
                    {new Date(escrow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {escrow.status === 'ACTIVE' && (
                <div className="flex gap-3 mt-4">
                  <HexButton variant="secondary" size="small">
                    Cancel
                  </HexButton>
                  <HexButton variant="primary" size="small" disabled>
                    Release (Locked)
                  </HexButton>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
