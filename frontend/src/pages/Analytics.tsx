import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '../contexts/WalletContext'
import { ChartBarIcon, ArrowTrendingUpIcon, CheckCircleIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import Transactions from './Transactions'

const Analytics: React.FC = () => {
  const { wallet } = useWallet()
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview')

  const { data: analytics, isLoading } = useQuery(
    ['analytics', wallet?.publicKey],
    async () => {
      if (!wallet?.publicKey) return null
      
      // Fetch transactions
      const txResponse = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}/transactions?order=desc&limit=100`
      )
      
      if (!txResponse.ok) throw new Error('Failed to fetch transactions')
      
      const txData = await txResponse.json()
      const transactions = txData._embedded.records
      
      // Calculate analytics
      const totalTransactions = transactions.length
      const successfulTx = transactions.filter((tx: any) => tx.successful).length
      const successRate = totalTransactions > 0 ? (successfulTx / totalTransactions * 100).toFixed(1) : '0'
      
      // Get operations for volume calculation
      const opsResponse = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}/operations?order=desc&limit=100`
      )
      
      let totalVolume = 0
      if (opsResponse.ok) {
        const opsData = await opsResponse.json()
        const operations = opsData._embedded.records
        
        // Sum up payment amounts
        operations.forEach((op: any) => {
          if (op.type === 'payment' && op.asset_type === 'native') {
            totalVolume += parseFloat(op.amount || 0)
          }
        })
      }
      
      return {
        totalVolume: totalVolume.toFixed(2),
        totalTransactions,
        successRate,
        recentActivity: transactions.slice(0, 5)
      }
    },
    {
      enabled: !!wallet?.publicKey,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  if (!wallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
          <p className="text-slate-400 mt-2">
            Track your payment performance and insights
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-100 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-slate-400">
              Please connect your wallet to view analytics
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black gradient-text">Analytics</h1>
        <p className="text-slate-400 mt-2">
          Real-time insights and transaction history from your Stellar account
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`relative flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ChartBarIcon className="h-5 w-5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`relative flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 ${
            activeTab === 'transactions'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListBulletIcon className="h-5 w-5" />
          <span>All Transactions</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'transactions' ? (
        <Transactions />
      ) : (
        <div className="space-y-6">

      {isLoading ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stellar-600 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading analytics...</p>
          </div>
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    Total Volume
                  </h3>
                  <p className="text-3xl font-bold text-stellar-600">{analytics.totalVolume} XLM</p>
                  <p className="text-sm text-slate-400 mt-1">Last 100 transactions</p>
                </div>
                <ArrowTrendingUpIcon className="h-12 w-12 text-stellar-600 opacity-20" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    Transactions
                  </h3>
                  <p className="text-3xl font-bold text-stellar-600">{analytics.totalTransactions}</p>
                  <p className="text-sm text-slate-400 mt-1">Total on testnet</p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-stellar-600 opacity-20" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    Success Rate
                  </h3>
                  <p className="text-3xl font-bold text-stellar-600">{analytics.successRate}%</p>
                  <p className="text-sm text-slate-400 mt-1">Transaction success</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
            {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {tx.successful ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          Transaction {tx.successful ? 'Successful' : 'Failed'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-stellar-600 hover:text-stellar-700"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No recent activity</p>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <p className="text-slate-400">Failed to load analytics</p>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}

export default Analytics
