import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '../contexts/WalletContext'
import { ArrowUpIcon, ArrowDownIcon, ClockIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import ReceiptModal from '../components/ReceiptModal'
import ExportModal from '../components/ExportModal'

interface Transaction {
  id: string
  hash: string
  created_at: string
  successful: boolean
  source_account: string
}

const Transactions: React.FC = () => {
  const { wallet } = useWallet()
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showExport, setShowExport] = useState(false)

  const { data: transactions, isLoading } = useQuery(
    ['transactions', wallet?.publicKey],
    async () => {
      if (!wallet?.publicKey) return []
      
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}/transactions?order=desc&limit=20`
      )
      
      if (!response.ok) throw new Error('Failed to fetch transactions')
      
      const data = await response.json()
      return data._embedded.records as Transaction[]
    },
    {
      enabled: !!wallet?.publicKey,
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  )

  if (!wallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Transactions</h1>
          <p className="text-slate-400 mt-2">
            View and manage all your payment transactions
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-slate-400">
              Please connect your wallet to view transactions
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Transactions</h1>
          <p className="text-slate-400 mt-2">
            Your recent Stellar testnet transactions
          </p>
        </div>
        {transactions && transactions.length > 0 && (
          <button
            onClick={() => setShowExport(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
        )}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading transactions...</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.successful ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stellar-600 hover:text-stellar-700 font-mono text-sm"
                      >
                        {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 8)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.source_account === wallet.publicKey ? (
                        <span className="inline-flex items-center text-sm text-red-600">
                          <ArrowUpIcon className="h-4 w-4 mr-1" />
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <ArrowDownIcon className="h-4 w-4 mr-1" />
                          Received
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTransaction({
                          hash: tx.hash,
                          from: tx.source_account,
                          to: wallet.publicKey,
                          amount: 0, // Would need to extract from operations
                          currency: 'XLM',
                          timestamp: new Date(tx.created_at).getTime(),
                          successful: tx.successful
                        })}
                        className="text-stellar-600 hover:text-stellar-700 text-sm font-medium"
                      >
                        Generate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              No Transactions Yet
            </h3>
            <p className="text-slate-400">
              Your transaction history will appear here once you start using the platform
            </p>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTransaction && (
        <ReceiptModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Export Modal */}
      {showExport && transactions && (
        <ExportModal
          transactions={transactions.map(tx => ({
            hash: tx.hash,
            from: tx.source_account,
            to: wallet?.publicKey || '',
            amount: 0, // Would extract from operations
            currency: 'XLM',
            timestamp: new Date(tx.created_at).getTime(),
            successful: tx.successful
          }))}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

export default Transactions
