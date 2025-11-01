import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { invoiceService, Invoice } from '../services/InvoiceService'
import { notificationService } from '../services/NotificationService'
import { sendPayment } from '../utils/stellarTransactions'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

const PayInvoice: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const { wallet, connectWallet } = useWallet()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (invoiceId) {
      const inv = invoiceService.getInvoice(invoiceId)
      setInvoice(inv)
      setLoading(false)
    }
  }, [invoiceId])

  const handlePayment = async () => {
    if (!wallet?.publicKey || !invoice) return

    setPaying(true)
    setError('')

    try {
      // Execute real Stellar payment
      const txHash = await sendPayment({
        from: wallet.publicKey,
        to: invoice.from,
        amount: invoice.amount.toString(),
      })

      // Mark invoice as paid
      invoiceService.markAsPaid(invoice.id, txHash, wallet.publicKey)
      
      // Notify creator
      notificationService.invoicePaid(
        invoice.id,
        invoice.amount,
        invoice.currency,
        wallet.publicKey
      )

      setPaid(true)
      setInvoice(invoiceService.getInvoice(invoice.id))
    } catch (err: any) {
      setError(err.message || 'Payment failed')
      notificationService.paymentFailed(invoice.amount, invoice.currency, err.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Invoice Not Found</h2>
          <p className="text-slate-400">This payment request doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Already Paid</h2>
          <p className="text-slate-400 mb-4">This invoice has already been paid.</p>
          {invoice.transactionHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${invoice.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View Transaction →
            </a>
          )}
        </div>
      </div>
    )
  }

  if (invoice.status === 'expired' || invoice.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Invoice {invoice.status === 'expired' ? 'Expired' : 'Cancelled'}
          </h2>
          <p className="text-slate-400">This payment request is no longer valid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <DocumentTextIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text mb-2">Payment Request</h1>
          <p className="text-slate-400">Powered by Nexar</p>
        </div>

        {/* Invoice Details */}
        <div className="space-y-6 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-400 mb-2">Amount Due</p>
              <p className="text-5xl font-black text-slate-100">
                {invoice.amount}
              </p>
              <p className="text-2xl font-bold text-slate-400 mt-1">
                {invoice.currency}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Description:</span>
              <span className="text-slate-200 font-medium">{invoice.description}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">From:</span>
              <span className="text-slate-200 font-mono text-xs">
                {invoice.from.substring(0, 8)}...{invoice.from.substring(invoice.from.length - 8)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Created:</span>
              <span className="text-slate-200">{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            {invoice.expiresAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Expires:</span>
                <span className="text-amber-400 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {new Date(invoice.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        {!wallet?.publicKey ? (
          <div className="space-y-4">
            <button
              onClick={connectWallet}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <BanknotesIcon className="h-5 w-5" />
              <span>Connect Wallet to Pay</span>
            </button>
            <p className="text-xs text-slate-500 text-center">
              You'll need a Stellar wallet to complete this payment
            </p>
          </div>
        ) : paid ? (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Payment Successful!</h3>
            <p className="text-slate-400 mb-4">Your payment has been sent on the Stellar blockchain</p>
            {invoice.transactionHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${invoice.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <span>View on Stellar Explorer</span>
                <span>→</span>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handlePayment}
              disabled={paying}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <BanknotesIcon className="h-5 w-5" />
              <span>{paying ? 'Processing Payment...' : `Pay ${invoice.amount} ${invoice.currency}`}</span>
            </button>
            <p className="text-xs text-slate-500 text-center">
              This will execute a real transaction on Stellar testnet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PayInvoice
