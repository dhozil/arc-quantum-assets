import { ethers } from 'ethers'

// QuantumVault ABI (simplified - add all functions as needed)
const VAULT_ABI = [
  'function createDeposit(address tokenAddress, uint256 amount, uint256 lockUntil, uint8 tier) external returns (uint256)',
  'function withdrawDeposit(uint256 depositId) external',
  'function getDeposit(uint256 depositId) external view returns (tuple(uint256 id, address depositor, address tokenAddress, uint256 amount, uint256 createdAt, uint256 lockUntil, uint8 tier, bool quantumEnabled, bool active))',
  'function getActiveDeposits() external view returns (uint256[])',
  'function getUserDeposits(address user) external view returns (uint256[])',
  'function getDepositsByTier(uint8 tier) external view returns (uint256[])',
  'function getVaultStats() external view returns (uint256 totalDeposits, uint256 activeDepositsCount, uint256 totalDepositedAmount, uint256 quantumEnabledCount, uint256 institutionalCount, uint256 sovereignCount)',
  'function calculateWithdrawalFee(uint256 depositId) external view returns (uint256 fee)',
  'event DepositCreated(uint256 indexed depositId, address indexed depositor, address indexed tokenAddress, uint256 amount, uint256 lockUntil, uint8 tier, bool quantumEnabled)',
  'event DepositWithdrawn(uint256 indexed depositId, address indexed depositor, uint256 amount, uint256 fee, uint256 timestamp)'
]

export class VaultContract {
  private contract: ethers.Contract
  private signer: ethers.Signer | null = null

  constructor(contractAddress: string, signer?: ethers.Signer) {
    this.signer = signer || null
    this.contract = new ethers.Contract(contractAddress, VAULT_ABI, signer)
  }

  async createDeposit(
    tokenAddress: string,
    amount: bigint,
    lockUntil: number,
    tier: number // 0 = STANDARD, 1 = INSTITUTIONAL, 2 = SOVEREIGN
  ): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet.')
    }

    const tx = await this.contract.createDeposit(tokenAddress, amount, lockUntil, tier)
    return tx
  }

  async withdrawDeposit(depositId: number): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet.')
    }

    const tx = await this.contract.withdrawDeposit(depositId)
    return tx
  }

  async getDeposit(depositId: number) {
    return await this.contract.getDeposit(depositId)
  }

  async getActiveDeposits(): Promise<number[]> {
    return await this.contract.getActiveDeposits()
  }

  async getUserDeposits(userAddress: string): Promise<number[]> {
    return await this.contract.getUserDeposits(userAddress)
  }

  async getDepositsByTier(tier: number): Promise<number[]> {
    return await this.contract.getDepositsByTier(tier)
  }

  async getVaultStats() {
    return await this.contract.getVaultStats()
  }

  async calculateWithdrawalFee(depositId: number): Promise<bigint> {
    return await this.contract.calculateWithdrawalFee(depositId)
  }

  onDepositCreated(callback: (depositId: number, depositor: string, tokenAddress: string, amount: bigint, lockUntil: bigint, tier: number, quantumEnabled: boolean) => void) {
    this.contract.on('DepositCreated', callback)
  }

  onDepositWithdrawn(callback: (depositId: number, depositor: string, amount: bigint, fee: bigint, timestamp: bigint) => void) {
    this.contract.on('DepositWithdrawn', callback)
  }

  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}

// Helper function to initialize contract
export async function initVaultContract(contractAddress: string) {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed')
  }

  // Simple BrowserProvider initialization
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  return new VaultContract(contractAddress, signer)
}
