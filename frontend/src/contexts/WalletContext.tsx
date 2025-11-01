import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api'
import { WalletInfo, Balance } from '../types'
import { paymentExecutor } from '../services/PaymentExecutor'

interface WalletContextType {
  wallet: WalletInfo | null
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalances: () => Promise<void>
  signTransaction: (xdr: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet'

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  /**
   * Connect to Freighter wallet
   */
  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Check if Freighter is installed
      const freighterInstalled = await isConnected()
      
      if (!freighterInstalled) {
        alert('Please install Freighter wallet extension: https://www.freighter.app/')
        setIsConnecting(false)
        return
      }

      // Get public key from Freighter
      const publicKey = await getPublicKey()
      
      if (!publicKey) {
        throw new Error('Failed to get public key from Freighter')
      }

      console.log('✅ Connected to Freighter wallet:', publicKey)

      // Fetch account balances from Stellar
      const balances = await fetchBalances(publicKey)
      
      const walletInfo: WalletInfo = {
        publicKey,
        isConnected: true,
        balances,
      }
      
      setWallet(walletInfo)
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('wallet_publicKey', publicKey)
      
      // Start payment executor for auto-execution of scheduled payments
      paymentExecutor.start(publicKey)
      console.log('🚀 Payment Executor started')
      
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      alert(`Failed to connect wallet: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    // Stop payment executor
    paymentExecutor.stop()
    
    setWallet(null)
    localStorage.removeItem('wallet_connected')
    localStorage.removeItem('wallet_publicKey')
    console.log('✅ Wallet disconnected')
    console.log('⏹️ Payment Executor stopped')
  }

  /**
   * Fetch account balances from Stellar Horizon using fetch API
   */
  const fetchBalances = async (publicKey: string): Promise<Balance[]> => {
    try {
      const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Account not found on network. It may need to be funded.')
          return [{
            asset: 'XLM',
            balance: 0,
          }]
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const account = await response.json()
      
      const balances: Balance[] = account.balances.map((balance: any) => {
        if (balance.asset_type === 'native') {
          return {
            asset: 'XLM',
            balance: parseFloat(balance.balance),
          }
        } else {
          return {
            asset: balance.asset_code,
            balance: parseFloat(balance.balance),
            issuer: balance.asset_issuer,
          }
        }
      })

      return balances
    } catch (error: any) {
      console.error('Error fetching balances:', error)
      throw error
    }
  }

  /**
   * Refresh account balances
   */
  const refreshBalances = async () => {
    if (!wallet?.publicKey) return
    
    try {
      const balances = await fetchBalances(wallet.publicKey)
      setWallet({
        ...wallet,
        balances,
      })
      console.log('✅ Balances refreshed')
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    }
  }

  /**
   * Sign transaction with Freighter
   */
  const signTransactionWithFreighter = async (xdr: string): Promise<string> => {
    try {
      const networkPassphrase = NETWORK === 'testnet' 
        ? 'Test SDF Network ; September 2015' 
        : 'Public Global Stellar Network ; September 2015'
      
      const signedXdr = await signTransaction(xdr, {
        network: networkPassphrase,
        networkPassphrase,
        accountToSign: wallet?.publicKey,
      })
      
      console.log('✅ Transaction signed with Freighter')
      return signedXdr
    } catch (error: any) {
      console.error('Failed to sign transaction:', error)
      throw new Error(`Failed to sign transaction: ${error.message}`)
    }
  }

  /**
   * Auto-reconnect on page load
   */
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('wallet_connected')
      const savedPublicKey = localStorage.getItem('wallet_publicKey')
      
      if (wasConnected === 'true' && savedPublicKey) {
        try {
          const freighterInstalled = await isConnected()
          
          if (freighterInstalled) {
            const currentPublicKey = await getPublicKey()
            
            // Only reconnect if the same account is still active
            if (currentPublicKey === savedPublicKey) {
              const balances = await fetchBalances(currentPublicKey)
              
              setWallet({
                publicKey: currentPublicKey,
                isConnected: true,
                balances,
              })
              
              // Start payment executor for auto-execution
              paymentExecutor.start(currentPublicKey)
              
              console.log('✅ Auto-reconnected to Freighter wallet')
              console.log('🚀 Payment Executor started')
            } else {
              // Different account, clear saved data
              localStorage.removeItem('wallet_connected')
              localStorage.removeItem('wallet_publicKey')
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error)
          localStorage.removeItem('wallet_connected')
          localStorage.removeItem('wallet_publicKey')
        }
      }
    }

    autoConnect()
  }, [])

  /**
   * Auto-refresh balances every 30 seconds
   */
  useEffect(() => {
    if (!wallet?.isConnected) return

    const interval = setInterval(() => {
      refreshBalances()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [wallet?.isConnected])

  const value: WalletContextType = {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    signTransaction: signTransactionWithFreighter,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
