import { ethers } from 'ethers'

// QuantumEscrow ABI (simplified - add all functions as needed)
const ESCROW_ABI = [
  'function createEscrow(address beneficiary, address tokenAddress, uint256 amount, uint256 releaseTime, string metadata, bool quantumEnabled) external returns (uint256)',
  'function releaseEscrow(uint256 escrowId) external',
  'function cancelEscrow(uint256 escrowId) external',
  'function checkExpiration(uint256 escrowId) external',
  'function getEscrow(uint256 escrowId) external view returns (tuple(uint256 id, address depositor, address beneficiary, address tokenAddress, uint256 amount, uint256 releaseTime, uint256 createdAt, uint8 status, string metadata, bool quantumEnabled))',
  'function getActiveEscrows() external view returns (uint256[])',
  'function getUserEscrows(address user) external view returns (uint256[])',
  'function getEscrowStats() external view returns (uint256 totalEscrows, uint256 activeEscrowsCount, uint256 totalEscrowedAmount, uint256 quantumEnabledCount)',
  'event EscrowCreated(uint256 indexed escrowId, address indexed depositor, address indexed beneficiary, address tokenAddress, uint256 amount, uint256 releaseTime, bool quantumEnabled)',
  'event EscrowReleased(uint256 indexed escrowId, address indexed beneficiary, uint256 amount, uint256 timestamp)',
  'event EscrowCancelled(uint256 indexed escrowId, address indexed depositor, uint256 amount, uint256 timestamp)'
]

export class EscrowContract {
  private contract: ethers.Contract
  private signer: ethers.Signer | null = null

  constructor(contractAddress: string, signer?: ethers.Signer) {
    this.signer = signer || null
    this.contract = new ethers.Contract(contractAddress, ESCROW_ABI, signer)
  }

  async createEscrow(
    beneficiary: string,
    tokenAddress: string,
    amount: bigint,
    releaseTime: number,
    metadata: string,
    quantumEnabled: boolean
  ): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet.')
    }

    const tx = await this.contract.createEscrow(
      beneficiary,
      tokenAddress,
      amount,
      releaseTime,
      metadata,
      quantumEnabled
    )
    return tx
  }

  async releaseEscrow(escrowId: number): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet.')
    }

    const tx = await this.contract.releaseEscrow(escrowId)
    return tx
  }

  async cancelEscrow(escrowId: number): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet.')
    }

    const tx = await this.contract.cancelEscrow(escrowId)
    return tx
  }

  async getEscrow(escrowId: number) {
    return await this.contract.getEscrow(escrowId)
  }

  async getActiveEscrows(): Promise<number[]> {
    return await this.contract.getActiveEscrows()
  }

  async getUserEscrows(userAddress: string): Promise<number[]> {
    return await this.contract.getUserEscrows(userAddress)
  }

  async getEscrowStats() {
    return await this.contract.getEscrowStats()
  }

  onEscrowCreated(callback: (escrowId: number, depositor: string, beneficiary: string, tokenAddress: string, amount: bigint, releaseTime: bigint, quantumEnabled: boolean) => void) {
    this.contract.on('EscrowCreated', callback)
  }

  onEscrowReleased(callback: (escrowId: number, beneficiary: string, amount: bigint, timestamp: bigint) => void) {
    this.contract.on('EscrowReleased', callback)
  }

  onEscrowCancelled(callback: (escrowId: number, depositor: string, amount: bigint, timestamp: bigint) => void) {
    this.contract.on('EscrowCancelled', callback)
  }

  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}

// Helper function to initialize contract
export async function initEscrowContract(contractAddress: string) {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed')
  }

  // Simple BrowserProvider initialization
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  return new EscrowContract(contractAddress, signer)
}
