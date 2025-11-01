import { signTransaction } from '@stellar/freighter-api'

const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

export interface SendPaymentParams {
  from: string
  to: string
  amount: string
  asset?: string
  memo?: string
}

/**
 * Build and submit a payment transaction
 */
export async function sendPayment(params: SendPaymentParams): Promise<string> {
  const { from, to, amount, asset = 'XLM', memo } = params

  try {
    // 1. Load source account
    const accountResponse = await fetch(`${HORIZON_URL}/accounts/${from}`)
    if (!accountResponse.ok) {
      throw new Error('Failed to load account')
    }
    const accountData = await accountResponse.json()

    // 2. Build transaction using Stellar SDK via CDN
    const StellarSdk = (window as any).StellarSdk
    if (!StellarSdk) {
      throw new Error('Stellar SDK not loaded')
    }

    const account = new StellarSdk.Account(from, accountData.sequence)
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: to,
          asset: StellarSdk.Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(180)
      .build()

    // 3. Get XDR
    const xdr = transaction.toXDR()

    // 4. Sign with Freighter
    const signedXDR = await signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    })

    // 5. Submit to Horizon
    const submitResponse = await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `tx=${encodeURIComponent(signedXDR)}`,
    })

    if (!submitResponse.ok) {
      const error = await submitResponse.json()
      throw new Error(error.extras?.result_codes?.transaction || 'Transaction failed')
    }

    const result = await submitResponse.json()
    return result.hash
  } catch (error: any) {
    console.error('Payment error:', error)
    throw new Error(error.message || 'Failed to send payment')
  }
}

/**
 * Check if an account exists on the network
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
    return response.ok
  } catch {
    return false
  }
}
