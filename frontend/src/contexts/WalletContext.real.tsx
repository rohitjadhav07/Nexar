import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api'
import * as StellarSdk from 'stellar-sdk'
import { WalletInfo, Balance } from '../types'

// Extract Server and Networks from StellarSdk
const Server = (StellarSdk as any).Server || (StellarSdk as any).default?.Server
const Networks = (StellarSdk as any).Networks || (StellarSdk as any).default?.Networks

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
  
  // Create server instance lazily
  const getServer = () => {
    try {
      return new Server(HORIZON_URL)
    } catch (error) {
      console.error('Failed to create Server:', error)
      throw error
    }
  }

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
      
    } catch (error) {
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
    setWallet(null)
    localStorage.removeItem('wallet_connected')
    localStorage.removeItem('wallet_publicKey')
    console.log('✅ Wallet disconnected')
  }

  /**
   * Fetch account balances from Stellar Horizon
   */
  const fetchBalances = async (publicKey: string): Promise<Balance[]> => {
    try {
      const server = getServer()
      const account = await server.loadAccount(publicKey)
      
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
    } catch (error) {
      console.error('Error fetching balances:', error)
      
      // If account doesn't exist, return empty balance
      if (error.response?.status === 404) {
        console.warn('Account not found on network. It may need to be funded.')
        return [{
          asset: 'XLM',
          balance: 0,
        }]
      }
      
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
      const networkPassphrase = NETWORK === 'testnet' ? Networks?.TESTNET : Networks?.PUBLIC
      
      const signedXdr = await signTransaction(xdr, {
        network: networkPassphrase,
        networkPassphrase,
        accountToSign: wallet?.publicKey,
      })
      
      console.log('✅ Transaction signed with Freighter')
      return signedXdr
    } catch (error) {
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
              
              console.log('✅ Auto-reconnected to Freighter wallet')
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
