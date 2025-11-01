import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { invoiceService, Invoice } from '../services/InvoiceService'
import { notificationService } from '../services/NotificationService'
import {
  DocumentTextIcon,
  PlusIcon,
  QrCodeIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

const Invoices: React.FC = () => {
  const { wallet } = useWallet()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'expired'>('all')

  // Form state
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('XLM')
  const [description, setDescription] = useState('')
  const [expiresIn, setExpiresIn] = useState('24')

  useEffect(() => {
    if (wallet?.publicKey) {
      loadInvoices()
      // Update expired invoices
      invoiceService.updateExpiredInvoices()
    }
  }, [wallet?.publicKey])

  const loadInvoices = () => {
    if (!wallet?.publicKey) return
    const userInvoices = invoiceService.getUserInvoices(wallet.publicKey)
    setInvoices(userInvoices)
  }

  const handleCreateInvoice = () => {
    if (!wallet?.publicKey || !amount || !description) return

    const invoice = invoiceService.createInvoice(
      wallet.publicKey,
      parseFloat(amount),
      currency,
      description,
      parseInt(expiresIn)
    )

    notificationService.invoiceCreated(invoice.id, invoice.amount, invoice.currency)
    
    setShowCreateModal(false)
    setAmount('')
    setDescription('')
    loadInvoices()
  }

  const handleCopyLink = async (invoice: Invoice) => {
    await invoiceService.copyPaymentLink(invoice)
    notificationService.success('Link Copied', 'Payment link copied to clipboard', 'invoice')
  }

  const handleShowQR = async (invoice: Invoice) => {
    if (!invoice.qrCode) {
      await invoiceService.generateQRCode(invoice)
      loadInvoices()
    }
    setSelectedInvoice(invoice)
    setShowQRModal(true)
  }

  const handleCancelInvoice = (invoiceId: string) => {
    invoiceService.cancelInvoice(invoiceId)
    notificationService.warning('Invoice Cancelled', 'Payment request has been cancelled', 'invoice')
    loadInvoices()
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true
    return inv.status === filter
  })

  const stats = wallet?.publicKey ? invoiceService.getInvoiceStats(wallet.publicKey) : null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      case 'expired':
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-amber-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'expired':
      case 'cancelled':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Invoices</h1>
        <div className="card text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400">Please connect your wallet to manage invoices</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Invoices</h1>
          <p className="text-slate-400 mt-2">Create and manage payment requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Invoices</span>
              <DocumentTextIcon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Pending</span>
              <ClockIcon className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.pending}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Paid</span>
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.paid}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Amount</span>
              <BanknotesIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.paidAmount.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2">
        {(['all', 'pending', 'paid', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="card">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">No Invoices</h3>
            <p className="text-slate-400">Create your first payment request</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 rounded-lg border border-slate-800/50 hover:bg-slate-800/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(invoice.status)}
                      <h3 className="font-semibold text-slate-200">{invoice.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span className="font-mono">{invoice.id.substring(0, 12)}...</span>
                      <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      {invoice.expiresAt && (
                        <span>Expires: {new Date(invoice.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-100">
                      {invoice.amount} {invoice.currency}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {invoice.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleShowQR(invoice)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Show QR Code"
                          >
                            <QrCodeIcon className="h-4 w-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(invoice)}
                            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Copy Link"
                          >
                            <LinkIcon className="h-4 w-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleCancelInvoice(invoice.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircleIcon className="h-4 w-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 border border-slate-800/50">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Create Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="input-field flex-1"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-field w-24"
                  >
                    <option>XLM</option>
                    <option>USDC</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Website design services"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expires In (hours)</label>
                <input
                  type="number"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={!amount || !description}
                  className="btn-primary flex-1"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 border border-slate-800/50">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Payment QR Code</h3>
            <div className="text-center space-y-4">
              {selectedInvoice.qrCode && (
                <img
                  src={selectedInvoice.qrCode}
                  alt="QR Code"
                  className="mx-auto rounded-lg border border-slate-700/50"
                />
              )}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Payment Link:</p>
                <p className="text-xs font-mono text-slate-300 break-all">
                  {selectedInvoice.shareableLink}
                </p>
              </div>
              <button
                onClick={() => handleCopyLink(selectedInvoice)}
                className="btn-primary w-full"
              >
                Copy Payment Link
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoices
