import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline'
import { groupService, Group } from '../services/GroupService'
import { executeSettlements, getBalanceStatus, formatAmount } from '../utils/groupPayments'

interface GroupExpensesProps {
  group: Group
  onClose: () => void
}

const GroupExpenses: React.FC<GroupExpensesProps> = ({ group, onClose }) => {
  const { wallet } = useWallet()
  const [isSettling, setIsSettling] = useState(false)

  const expenses = groupService.getExpenses(group.id)
  const balances = groupService.calculateBalances(group.id)
  const settlements = groupService.suggestSettlements(group.id)

  const userBalance = wallet?.publicKey ? balances.get(wallet.publicKey) || 0 : 0
  const balanceStatus = getBalanceStatus(userBalance)

  const handleSettleUp = async () => {
    if (!wallet?.publicKey) return

    setIsSettling(true)
    try {
      const result = await executeSettlements(group.id, wallet.publicKey, settlements)
      
      if (result.successful.length > 0) {
        alert(`✅ Settled up! Sent ${formatAmount(result.totalSent)} XLM in ${result.successful.length} payment(s)`)
      }
      
      if (result.failed.length > 0) {
        alert(`⚠️ Some payments failed:\n${result.failed.map(f => `${f.address}: ${f.error}`).join('\n')}`)
      }
      
      onClose()
    } catch (error: any) {
      alert(`Failed to settle: ${error.message}`)
    } finally {
      setIsSettling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900/80 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-stellar-600" />
            <h3 className="text-lg font-semibold text-slate-100">Group Expenses</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* User Balance */}
        <div className="bg-gradient-to-r from-stellar-50 to-stellar-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-400 mb-1">Your Balance</p>
          <p className={`text-2xl font-bold ${balanceStatus.color}`}>
            {balanceStatus.text}
          </p>
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-slate-100 mb-3">Suggested Settlements</h4>
            <div className="space-y-2">
              {settlements.map((settlement, idx) => {
                const isUserPaying = settlement.from === wallet?.publicKey
                const isUserReceiving = settlement.to === wallet?.publicKey
                
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      isUserPaying ? 'border-red-200 bg-red-50' :
                      isUserReceiving ? 'border-green-200 bg-green-50' :
                      'border-slate-700/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isUserPaying ? (
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        ) : isUserReceiving ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <CurrencyDollarIcon className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {settlement.from.substring(0, 8)}... → {settlement.to.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-slate-400">
                            {isUserPaying ? 'You pay' : isUserReceiving ? 'You receive' : 'Others'}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-slate-100">
                        {formatAmount(settlement.amount)} XLM
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {settlements.some(s => s.from === wallet?.publicKey) && (
              <button
                onClick={handleSettleUp}
                disabled={isSettling}
                className="btn-primary w-full mt-4"
              >
                {isSettling ? 'Processing...' : 'Settle Up Now'}
              </button>
            )}
          </div>
        )}

        {/* All Balances */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-100 mb-3">Member Balances</h4>
          <div className="space-y-2">
            {Array.from(balances.entries()).map(([address, balance]) => {
              const status = getBalanceStatus(balance)
              return (
                <div
                  key={address}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {address.substring(0, 8)}...
                      {address === wallet?.publicKey && (
                        <span className="ml-2 text-xs text-stellar-600">(You)</span>
                      )}
                    </p>
                    <p className={`text-xs ${status.color}`}>
                      {status.text}
                    </p>
                  </div>
                  <p className={`font-semibold ${status.color}`}>
                    {balance > 0 ? '+' : ''}{formatAmount(balance)} XLM
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Expense History */}
        <div>
          <h4 className="font-semibold text-slate-100 mb-3">
            Expense History ({expenses.length})
          </h4>
          {expenses.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              No expenses yet
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expenses.slice().reverse().map((expense) => (
                <div
                  key={expense.id}
                  className="p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-100">
                      {expense.description}
                    </p>
                    <p className="font-semibold text-slate-100">
                      {formatAmount(expense.amount)} XLM
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p>
                      Paid by {expense.paidBy.substring(0, 8)}...
                      {expense.paidBy === wallet?.publicKey && ' (You)'}
                    </p>
                    <p>{new Date(expense.timestamp).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Split among {expense.splitAmong.length} member(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupExpenses
