import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StellarWalletsKit, WalletNetwork, ISupportedWallet, WalletType } from '@stellar/wallet-sdk'
import { Server, Networks } from 'stellar-sdk'
import { WalletInfo, Balance } from '../types'

interface WalletContextType {
  wallet: WalletInfo | null
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalances: () => Promise<void>
  signTransaction: (xdr: string) => Promise<string>
  walletKit: StellarWalletsKit | null
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
  const [walletKit, setWalletKit] = useState<StellarWalletsKit | null>(null)
  const server = new Server(HORIZON_URL)

  /**
   * Initialize Stellar Wallet Kit
   */
  useEffect(() => {
    const kit = new StellarWalletsKit({
      network: NETWORK === 'testnet' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
      selectedWalletId: WalletType.FREIGHTER,
      modules: [
        // Freighter
        {
          id: WalletType.FREIGHTER,
          name: 'Freighter',
          type: WalletType.FREIGHTER,
          iconUrl: 'https://stellar.creit.tech/wallet-icons/freighter.svg',
          showModal: async () => {
            // Freighter handles its own modal
          }
        },
        // xBull
        {
          id: WalletType.XBULL,
          name: 'xBull',
          type: WalletType.XBULL,
          iconUrl: 'https://stellar.creit.tech/wallet-icons/xbull.svg',
          showModal: async () => {
            // xBull handles its own modal
          }
        },
        // Albedo
        {
          id: WalletType.ALBEDO,
          name: 'Albedo',
          type: WalletType.ALBEDO,
          iconUrl: 'https://stellar.creit.tech/wallet-icons/albedo.svg',
          showModal: async () => {
            // Albedo handles its own modal
          }
        },
        // Rabet
        {
          id: WalletType.RABET,
          name: 'Rabet',
          type: WalletType.RABET,
          iconUrl: 'https://stellar.creit.tech/wallet-icons/rabet.svg',
          showModal: async () => {
            // Rabet handles its own modal
          }
        }
      ]
    })

    setWalletKit(kit)
    console.log('✅ Stellar Wallet Kit initialized')
  }, [])

  /**
   * Connect to wallet using Stellar Wallet Kit
   */
  const connectWallet = async () => {
    if (!walletKit) {
      alert('Wallet Kit not initialized yet. Please wait a moment and try again.')
      return
    }

    setIsConnecting(true)
    try {
      // Open wallet selection modal
      await walletKit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          try {
            walletKit.setWallet(option.id)
            
            // Get public key from selected wallet
            const { address } = await walletKit.getAddress()
            
            if (!address) {
              throw new Error('Failed to get public key from wallet')
            }

            console.log(`✅ Connected to ${option.name}:`, address)

            // Fetch account balances from Stellar
            const balances = await fetchBalances(address)
            
            const walletInfo: WalletInfo = {
              publicKey: address,
              isConnected: true,
              balances,
              walletType: option.id,
              walletName: option.name,
            }
            
            setWallet(walletInfo)
            localStorage.setItem('wallet_connected', 'true')
            localStorage.setItem('wallet_publicKey', address)
            localStorage.setItem('wallet_type', option.id)
            
            setIsConnecting(false)
          } catch (error) {
            console.error('Failed to connect to wallet:', error)
            alert(`Failed to connect to ${option.name}: ${error.message}`)
            setIsConnecting(false)
          }
        }
      })
    } catch (error) {
      console.error('Failed to open wallet modal:', error)
      alert(`Failed to open wallet selector: ${error.message}`)
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
    localStorage.removeItem('wallet_type')
    console.log('✅ Wallet disconnected')
  }

  /**
   * Fetch account balances from Stellar Horizon
   */
  const fetchBalances = async (publicKey: string): Promise<Balance[]> => {
    try {
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
   * Sign transaction with selected wallet
   */
  const signTransactionWithWallet = async (xdr: string): Promise<string> => {
    if (!walletKit || !wallet) {
      throw new Error('Wallet not connected')
    }

    try {
      const networkPassphrase = NETWORK === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
      
      const { signedTxXdr } = await walletKit.signTransaction(xdr, {
        networkPassphrase,
        address: wallet.publicKey,
      })
      
      console.log('✅ Transaction signed with wallet')
      return signedTxXdr
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
      if (!walletKit) return

      const wasConnected = localStorage.getItem('wallet_connected')
      const savedPublicKey = localStorage.getItem('wallet_publicKey')
      const savedWalletType = localStorage.getItem('wallet_type')
      
      if (wasConnected === 'true' && savedPublicKey && savedWalletType) {
        try {
          // Set the wallet type
          walletKit.setWallet(savedWalletType)
          
          // Try to get current address
          const { address } = await walletKit.getAddress()
          
          // Only reconnect if the same account is still active
          if (address === savedPublicKey) {
            const balances = await fetchBalances(address)
            
            setWallet({
              publicKey: address,
              isConnected: true,
              balances,
              walletType: savedWalletType,
            })
            
            console.log('✅ Auto-reconnected to wallet')
          } else {
            // Different account, clear saved data
            localStorage.removeItem('wallet_connected')
            localStorage.removeItem('wallet_publicKey')
            localStorage.removeItem('wallet_type')
          }
        } catch (error) {
          console.error('Auto-connect failed:', error)
          localStorage.removeItem('wallet_connected')
          localStorage.removeItem('wallet_publicKey')
          localStorage.removeItem('wallet_type')
        }
      }
    }

    autoConnect()
  }, [walletKit])

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
    signTransaction: signTransactionWithWallet,
    walletKit,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
