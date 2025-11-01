/**
 * Group Payment Utilities
 * Handles split payments and batch transactions
 */

import { sendPayment } from './stellarTransactions'
import { groupService, GroupExpense } from '../services/GroupService'

export interface SplitPaymentResult {
  successful: string[] // addresses that received payment
  failed: Array<{ address: string; error: string }>
  totalSent: number
  transactionHashes: string[]
}

/**
 * Split a payment among group members
 */
export async function splitPaymentInGroup(
  groupId: string,
  fromAddress: string,
  totalAmount: number,
  description: string,
  members: string[]
): Promise<SplitPaymentResult> {
  const result: SplitPaymentResult = {
    successful: [],
    failed: [],
    totalSent: 0,
    transactionHashes: []
  }

  // Calculate amount per member
  const amountPerMember = totalAmount / members.length
  const roundedAmount = Math.floor(amountPerMember * 10000000) / 10000000 // Round to 7 decimals

  // Send payment to each member
  for (const memberAddress of members) {
    // Skip sending to self
    if (memberAddress === fromAddress) {
      result.successful.push(memberAddress)
      continue
    }

    try {
      const txHash = await sendPayment({
        from: fromAddress,
        to: memberAddress,
        amount: roundedAmount.toString()
      })

      result.successful.push(memberAddress)
      result.totalSent += roundedAmount
      result.transactionHashes.push(txHash)
    } catch (error: any) {
      result.failed.push({
        address: memberAddress,
        error: error.message || 'Transaction failed'
      })
    }
  }

  // Record expense in group
  if (result.successful.length > 0) {
    const expense: GroupExpense = {
      id: `expense_${Date.now()}`,
      groupId,
      paidBy: fromAddress,
      amount: totalAmount,
      description,
      splitAmong: members,
      timestamp: Date.now(),
      transactionHash: result.transactionHashes[0] // First transaction hash
    }

    groupService.recordExpense(groupId, expense)
  }

  return result
}

/**
 * Execute settlement payments to balance group expenses
 */
export async function executeSettlements(
  groupId: string,
  fromAddress: string,
  settlements: Array<{ from: string; to: string; amount: number }>
): Promise<SplitPaymentResult> {
  const result: SplitPaymentResult = {
    successful: [],
    failed: [],
    totalSent: 0,
    transactionHashes: []
  }

  // Filter settlements where current user is the payer
  const userSettlements = settlements.filter(s => s.from === fromAddress)

  for (const settlement of userSettlements) {
    try {
      const txHash = await sendPayment({
        from: fromAddress,
        to: settlement.to,
        amount: settlement.amount.toString()
      })

      result.successful.push(settlement.to)
      result.totalSent += settlement.amount
      result.transactionHashes.push(txHash)

      // Record as expense
      const expense: GroupExpense = {
        id: `settlement_${Date.now()}`,
        groupId,
        paidBy: fromAddress,
        amount: settlement.amount,
        description: 'Settlement payment',
        splitAmong: [fromAddress, settlement.to],
        timestamp: Date.now(),
        transactionHash: txHash
      }

      groupService.recordExpense(groupId, expense)
    } catch (error: any) {
      result.failed.push({
        address: settlement.to,
        error: error.message || 'Settlement failed'
      })
    }
  }

  return result
}

/**
 * Format currency amount
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Get balance status text
 */
export function getBalanceStatus(balance: number): {
  text: string
  color: string
} {
  if (Math.abs(balance) < 0.01) {
    return { text: 'Settled up', color: 'text-green-600' }
  } else if (balance > 0) {
    return { text: `You are owed ${formatAmount(balance)} XLM`, color: 'text-green-600' }
  } else {
    return { text: `You owe ${formatAmount(Math.abs(balance))} XLM`, color: 'text-red-600' }
  }
}
