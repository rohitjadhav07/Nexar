import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

const BalanceCards: React.FC = () => {
  const { wallet, refreshBalances } = useWallet()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  if (!wallet?.balances) return null

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getAssetColor = (asset: string) => {
    switch (asset) {
      case 'XLM':
        return 'text-blue-400'
      case 'USDC':
        return 'text-indigo-400'
      default:
        return 'text-purple-400'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {wallet.balances.map((balance) => (
        <div key={balance.asset} className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className={`text-2xl font-bold ${getAssetColor(balance.asset)} mb-1`}>
                {balance.asset}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                Balance
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className={`p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <ArrowPathIcon className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-4xl font-bold text-slate-100">
              {balance.balance.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500 font-mono">
              {balance.balance.toFixed(7)} {balance.asset}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default BalanceCards