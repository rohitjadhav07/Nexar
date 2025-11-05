import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '../contexts/WalletContext'
import { Link } from 'react-router-dom'
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const RecentTransactions: React.FC = () => {
  const { wallet } = useWallet()

  const { data: transactions, isLoading } = useQuery(
    ['recentTransactions', wallet?.publicKey],
    async () => {
      if (!wallet?.publicKey) return []
      
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}/transactions?order=desc&limit=5`
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data._embedded.records
    },
    {
      enabled: !!wallet?.publicKey,
      refetchInterval: 10000,
    }
  )

  if (!wallet) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Transactions</h3>
        <div className="text-center py-8">
          <p className="text-slate-400">Connect wallet to view transactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Recent Transactions</h3>
        <Link to="/analytics" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
          View All →
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx: any) => (
            <div key={tx.id}>
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 hover:bg-slate-800/30 hover:border-slate-700/50 transition-colors">
              <div className="flex items-center space-x-3">
                {tx.source_account === wallet.publicKey ? (
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <ArrowUpIcon className="h-4 w-4 text-red-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <ArrowDownIcon className="h-4 w-4 text-green-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-200">
                    {tx.source_account === wallet.publicKey ? 'Sent' : 'Received'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end space-y-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  View →
                </a>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                  tx.successful 
                    ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                    : 'text-red-400 bg-red-500/10 border border-red-500/20'
                }`}>
                  {tx.successful ? 'Success' : 'Failed'}
                </span>
              </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ClockIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400">No transactions yet</p>
        </div>
      )}
    </div>
  )
}

export default RecentTransactions
