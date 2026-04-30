import { useState, useEffect } from 'react'
import { Shield, Building2, Crown, Lock, Unlock, Calculator } from 'lucide-react'
import { ethers } from 'ethers'
import HexButton from './HexButton'
import { initVaultContract } from '../lib/vaultContract'
import { VAULT_CONTRACT_ADDRESS } from '../lib/contracts'

interface Deposit {
  id: number
  depositor: string
  tokenAddress: string
  amount: number
  createdAt: number
  lockUntil: number
  tier: 'STANDARD' | 'INSTITUTIONAL' | 'SOVEREIGN'
  quantumEnabled: boolean
  active: boolean
}

export default function VaultPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'STANDARD' | 'INSTITUTIONAL' | 'SOVEREIGN'>('STANDARD')
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tokenAddress: '',
    amount: '',
    lockUntil: '',
    tier: 'STANDARD' as 'STANDARD' | 'INSTITUTIONAL' | 'SOVEREIGN'
  })

  // Available tokens for vault
  const availableTokens = [
    {
      address: '0xe6c03C961944cc233a6a149d20D35e7Be7957Ab0',
      symbol: 'RWA',
      name: 'QuantumRWA',
      decimals: 18
    }
  ]

  const tierConfig = {
    STANDARD: {
      name: 'Standard',
      icon: <Shield className="w-5 h-5" />,
      minDeposit: 1000,
      maxDeposit: 100000,
      annualFee: 0.5,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/50'
    },
    INSTITUTIONAL: {
      name: 'Institutional',
      icon: <Building2 className="w-5 h-5" />,
      minDeposit: 100000,
      maxDeposit: 10000000,
      annualFee: 0.3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/50'
    },
    SOVEREIGN: {
      name: 'Sovereign',
      icon: <Crown className="w-5 h-5" />,
      minDeposit: 10000000,
      maxDeposit: 1000000000,
      annualFee: 0.1,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50'
    }
  }

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!window.ethereum) {
        alert('Please connect your wallet')
        return
      }

      if (!VAULT_CONTRACT_ADDRESS) {
        alert('Vault contract not deployed. Please deploy QuantumVault.sol first.')
        return
      }

      // Validate token address
      if (!ethers.isAddress(formData.tokenAddress)) {
        alert('Invalid token address. Please select a valid token.')
        return
      }

      const lockTime = formData.lockUntil ? Math.floor(new Date(formData.lockUntil).getTime() / 1000) : 0
      
      // Get decimals from selected token
      const selectedToken = availableTokens.find(t => t.address === formData.tokenAddress)
      const decimals = selectedToken?.decimals || 18
      const amount = BigInt(parseFloat(formData.amount) * (10 ** decimals))
      const tierValue = formData.tier === 'STANDARD' ? 0 : formData.tier === 'INSTITUTIONAL' ? 1 : 2

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
      const approveTx = await tokenContract.approve(VAULT_CONTRACT_ADDRESS, amount)
      await approveTx.wait()
      console.log('Token approved')

      const vaultContract = await initVaultContract(VAULT_CONTRACT_ADDRESS)
      await vaultContract.createDeposit(
        formData.tokenAddress,
        amount,
        lockTime,
        tierValue
      )

      alert('Deposit created! Transaction submitted.')
      await loadDeposits()
      setShowCreateForm(false)
      setFormData({ tokenAddress: '', amount: '', lockUntil: '', tier: 'STANDARD' })
    } catch (error) {
      console.error('Error creating deposit:', error)
      alert('Failed to create deposit: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const loadDeposits = async () => {
    setLoading(true)
    try {
      if (!VAULT_CONTRACT_ADDRESS) {
        console.log('Vault contract not deployed yet')
        return
      }

      const vaultContract = await initVaultContract(VAULT_CONTRACT_ADDRESS)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      
      if (accounts.length > 0) {
        const userDepositIds = await vaultContract.getUserDeposits(accounts[0])
        const depositData = await Promise.all(
          userDepositIds.map(async (id: number) => {
            const deposit = await vaultContract.getDeposit(id)
            return {
              id: deposit.id,
              depositor: deposit.depositor,
              tokenAddress: deposit.tokenAddress,
              amount: Number(deposit.amount) / 1e6,
              createdAt: Number(deposit.createdAt),
              lockUntil: Number(deposit.lockUntil),
              tier: ['STANDARD', 'INSTITUTIONAL', 'SOVEREIGN'][deposit.tier] as any,
              quantumEnabled: deposit.quantumEnabled,
              active: deposit.active
            }
          })
        )
        setDeposits(depositData)
      }
    } catch (error) {
      console.error('Error loading deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeposits()
  }, [])

  const calculateFee = (deposit: Deposit) => {
    const timeElapsed = Date.now() - deposit.createdAt
    const yearsElapsed = timeElapsed / (365 * 24 * 60 * 60 * 1000)
    const effectiveYears = Math.min(yearsElapsed, 5)
    const feeRate = tierConfig[deposit.tier].annualFee / 100
    const fee = deposit.amount * feeRate * effectiveYears
    const platformFee = deposit.amount * 0.0025 // 0.25% platform fee
    return fee + platformFee
  }

  const daysUntilUnlock = (lockUntil: number) => {
    const diff = lockUntil - Date.now()
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-12 h-12 text-purple-400" />
          <h1 className="text-5xl font-bold text-glow">Quantum Vault</h1>
        </div>
        <p className="text-xl text-gray-300">
          Post-Quantum Secure Vault for Institutional Storage
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Multi-tier vault system with quantum-resistant security
        </p>
      </div>

      {/* Features Info */}
      <div className="glass-effect p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-purple-400">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-6 h-6 text-cyan-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Multi-Tier System</div>
              <div className="text-sm text-gray-400">Standard, Institutional, and Sovereign vault tiers</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Auto Quantum-Enable</div>
              <div className="text-sm text-gray-400">Automatic quantum-resistance for deposits &gt; 1M USDC</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calculator className="w-6 h-6 text-green-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Time-Based Fees</div>
              <div className="text-sm text-gray-400">Tier-specific annual fee structure</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-yellow-400 mt-1" />
            <div>
              <div className="font-semibold text-white">Optional Lock Periods</div>
              <div className="text-sm text-gray-400">Flexible lock periods for long-term storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="glass-effect p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-purple-400">Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold text-white">Pension Funds</div>
            <div className="text-sm text-gray-400">Long-term retirement savings</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🎓</div>
            <div className="font-semibold text-white">Endowments</div>
            <div className="text-sm text-gray-400">University fund management</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🏛️</div>
            <div className="font-semibold text-white">Sovereign Funds</div>
            <div className="text-sm text-gray-400">National wealth reserves</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-purple-400">{deposits.length}</div>
          <div className="text-sm text-gray-400">Total Deposits</div>
        </div>
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-green-400">
            {deposits.filter(d => d.active).length}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-cyan-400">
            {deposits.filter(d => d.quantumEnabled).length}
          </div>
          <div className="text-sm text-gray-400">Quantum-Enabled</div>
        </div>
        <div className="glass-effect p-6 rounded-lg">
          <div className="text-3xl font-bold text-yellow-400">
            ${(deposits.reduce((sum, d) => sum + d.amount, 0) / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-gray-400">Total Value (USDC)</div>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(tierConfig).map(([key, config]) => (
          <div
            key={key}
            onClick={() => setSelectedTier(key as any)}
            className={`glass-effect p-6 rounded-lg cursor-pointer transition-all ${
              selectedTier === key ? 'neon-glow' : 'hover:neon-glow'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={config.color}>{config.icon}</div>
              <div className="font-bold text-lg">{config.name}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Min Deposit</span>
                <span className="font-semibold">${config.minDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Deposit</span>
                <span className="font-semibold">${config.maxDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Annual Fee</span>
                <span className="font-semibold">{config.annualFee}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Deposit Button */}
      <div className="flex justify-center">
        <HexButton 
          variant="primary" 
          size="large"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create New Deposit'}
        </HexButton>
      </div>

      {/* Create Deposit Form */}
      {showCreateForm && (
        <div className="glass-effect p-8 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-purple-400">Create New Deposit</h2>
          <form onSubmit={handleCreateDeposit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Tier</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(tierConfig).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({...formData, tier: key as any})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.tier === key
                        ? `${config.bgColor} ${config.borderColor} border-2`
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className={`flex items-center gap-2 ${config.color}`}>
                      {config.icon}
                      <span className="font-semibold">{config.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Token</label>
              <select
                value={formData.tokenAddress}
                onChange={(e) => setFormData({...formData, tokenAddress: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
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
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Lock Until (Optional)</label>
              <input
                type="date"
                value={formData.lockUntil}
                onChange={(e) => setFormData({...formData, lockUntil: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no lock period</p>
            </div>
            {parseFloat(formData.amount) >= 1000000 && (
              <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-400 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Quantum-resistant wallet will be enabled automatically</span>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <HexButton variant="primary" type="submit">
                Create Deposit
              </HexButton>
              <HexButton variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </HexButton>
            </div>
          </form>
        </div>
      )}

      {/* Deposit List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-purple-400">Your Deposits</h2>
        {loading ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <div className="text-gray-400">Loading deposits...</div>
          </div>
        ) : deposits.length === 0 ? (
          <div className="glass-effect p-8 rounded-lg text-center">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400">No deposits found</div>
            <div className="text-sm text-gray-500 mt-2">Create your first deposit to get started</div>
          </div>
        ) : (
          deposits.map((deposit) => (
            <div key={deposit.id} className="glass-effect p-6 rounded-lg hover:neon-glow transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {deposit.lockUntil > Date.now() ? (
                    <Lock className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Unlock className="w-6 h-6 text-green-400" />
                  )}
                  <div>
                    <div className="font-bold text-lg">Deposit #{deposit.id}</div>
                    <div className={`flex items-center gap-2 text-sm ${tierConfig[deposit.tier].color}`}>
                      {tierConfig[deposit.tier].icon}
                      {tierConfig[deposit.tier].name}
                    </div>
                  </div>
                </div>
                {deposit.quantumEnabled && (
                  <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-xs text-cyan-400">
                    Quantum-Enabled
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Amount</div>
                  <div className="font-semibold">${deposit.amount.toLocaleString()} USDC</div>
                </div>
                <div>
                  <div className="text-gray-400">Current Fee</div>
                  <div className="font-semibold">${calculateFee(deposit).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-400">
                    {deposit.lockUntil > Date.now() ? 'Locked For' : 'Unlocked'}
                  </div>
                  <div className="font-semibold">
                    {deposit.lockUntil > Date.now()
                      ? `${daysUntilUnlock(deposit.lockUntil)} days`
                      : 'Available'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Created</div>
                  <div className="font-semibold">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {deposit.active && (
                <div className="flex gap-3 mt-4">
                  <HexButton
                    variant="primary"
                    size="small"
                    disabled={deposit.lockUntil > Date.now()}
                  >
                    {deposit.lockUntil > Date.now() ? 'Locked' : 'Withdraw'}
                  </HexButton>
                  <HexButton variant="secondary" size="small">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Fee
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
