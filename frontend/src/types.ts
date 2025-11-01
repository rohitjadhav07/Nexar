export interface Balance {
  asset: string
  balance: number
  issuer?: string
}

export interface WalletInfo {
  publicKey: string
  isConnected: boolean
  balances: Balance[]
  walletType?: string
  walletName?: string
}

export interface Transaction {
  id: string
  hash: string
  type: 'payment' | 'refund' | 'swap' | 'recurring'
  amount: number
  asset: string
  from: string
  to: string
  status: 'pending' | 'success' | 'failed'
  timestamp: Date
  description?: string
}

export interface Invoice {
  id: string
  amount: number
  currency: string
  recipient: string
  payer?: string
  status: 'pending' | 'paid' | 'refunded' | 'expired'
  description: string
  createdAt: Date
  paidAt?: Date
}

export interface CommandResponse {
  success: boolean
  message: string
  invoiceId?: string
  transactionId?: string
  data?: any
}

export interface RecurringPayment {
  id: string
  amount: number
  currency: string
  recipient: string
  intervalDays: number
  nextPayment: Date
  active: boolean
}
