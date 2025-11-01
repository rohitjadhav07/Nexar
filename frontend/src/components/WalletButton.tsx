import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { WalletIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

const WalletButton: React.FC = () => {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useWallet()

  if (wallet?.isConnected) {
    return (
      <div className="flex items-center space-x-4">
        {/* Balance Display */}
        <div className="hidden sm:flex items-center space-x-2 text-sm">
          {wallet.balances.slice(0, 2).map((balance) => (
            <span key={balance.asset} className="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/50 font-medium">
              {balance.balance.toFixed(2)} {balance.asset}
            </span>
          ))}
        </div>

        {/* Wallet Info */}
        <div className="flex items-center space-x-3 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
          <WalletIcon className="h-5 w-5 text-blue-400" />
          <div className="flex flex-col">
            {wallet.walletName && (
              <span className="text-xs text-slate-500">{wallet.walletName}</span>
            )}
            <span className="text-sm font-mono text-slate-300">
              {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
            </span>
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={disconnectWallet}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors"
          title="Disconnect Wallet"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="btn-primary flex items-center space-x-2"
    >
      <WalletIcon className="h-5 w-5" />
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  )
}

export default WalletButton