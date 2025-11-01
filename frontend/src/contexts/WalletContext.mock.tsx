import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { WalletInfo } from '../types'

interface WalletContextType {
  wallet: WalletInfo | null
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalances: () => Promise<void>
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

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockWallet: WalletInfo = {
        publicKey: 'GBDJ5ILN5KWNHZX75BRZ2IJSDM3MIWL7TX7HMMBUXW5FNB4FI57XHWED',
        isConnected: true,
        balances: [
          { asset: 'XLM', balance: 1000.5 },
          { asset: 'USDC', balance: 500.25 },
          { asset: 'EURT', balance: 250.0 },
        ],
      }
      
      setWallet(mockWallet)
      localStorage.setItem('wallet', JSON.stringify(mockWallet))
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWallet(null)
    localStorage.removeItem('wallet')
  }

  const refreshBalances = async () => {
    if (!wallet) return
    
    try {
      // Simulate balance refresh
      const updatedBalances = wallet.balances.map(balance => ({
        ...balance,
        balance: balance.balance + Math.random() * 10 - 5,
      }))
      
      setWallet({
        ...wallet,
        balances: updatedBalances,
      })
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    }
  }

  useEffect(() => {
    // Try to restore wallet from localStorage
    const savedWallet = localStorage.getItem('wallet')
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet))
      } catch (error) {
        console.error('Failed to restore wallet:', error)
        localStorage.removeItem('wallet')
      }
    }
  }, [])

  const value: WalletContextType = {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    refreshBalances,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
