import React, { useState } from 'react'
import { 
  DocumentArrowDownIcon,
  ShareIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { receiptService, Receipt } from '../services/ReceiptService'

interface ReceiptModalProps {
  transaction: {
    hash: string
    from: string
    to: string
    amount: number
    currency: string
    timestamp: number
    successful: boolean
  }
  onClose: () => void
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const [note, setNote] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const receipt: Receipt = {
    id: `receipt_${Date.now()}`,
    transactionHash: transaction.hash,
    from: transaction.from,
    to: transaction.to,
    amount: transaction.amount,
    currency: transaction.currency,
    timestamp: transaction.timestamp,
    note,
    status: transaction.successful ? 'success' : 'failed'
  }

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      const pdfBlob = await receiptService.generateReceipt(receipt, note)
      const filename = `receipt_${transaction.hash.substring(0, 8)}.pdf`
      receiptService.downloadBlob(pdfBlob, filename)
      
      // Save receipt for future reference
      localStorage.setItem(`receipt_${receipt.id}`, JSON.stringify(receipt))
    } catch (error: any) {
      alert(`Failed to generate receipt: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = () => {
    // Save receipt and generate share URL
    localStorage.setItem(`receipt_${receipt.id}`, JSON.stringify(receipt))
    const url = receiptService.shareReceipt(receipt.id)
    setShareUrl(url)
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert('Receipt link copied to clipboard!')
    }).catch(() => {
      alert(`Share this link: ${url}`)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900/80 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Generate Receipt</h3>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Transaction Summary */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction:</span>
              <span className="font-mono text-xs">
                {transaction.hash.substring(0, 8)}...{transaction.hash.substring(transaction.hash.length - 8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Amount:</span>
              <span className="font-semibold">
                {transaction.amount} {transaction.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">From:</span>
              <span className="font-mono text-xs">
                {transaction.from.substring(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">To:</span>
              <span className="font-mono text-xs">
                {transaction.to.substring(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date:</span>
              <span>{new Date(transaction.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`font-semibold ${
                transaction.successful ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.successful ? 'Success' : 'Failed'}
              </span>
            </div>
          </div>
        </div>

        {/* Note Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Add Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Payment for services, dinner split, etc."
            className="w-full px-3 py-2 border border-slate-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-stellar-500 focus:border-stellar-500"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Download PDF Receipt'}</span>
          </button>

          <button
            onClick={handleShare}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <ShareIcon className="h-4 w-4" />
            <span>Share Receipt</span>
          </button>

          {shareUrl && (
            <div className="bg-stellar-50 border border-stellar-200 rounded-lg p-3">
              <p className="text-xs text-stellar-700 mb-1">Shareable Link:</p>
              <p className="text-xs font-mono text-stellar-900 break-all">
                {shareUrl}
              </p>
            </div>
          )}
        </div>

        {/* Receipt Preview Info */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            Receipt will include QR code linking to Stellar Explorer for verification
          </p>
        </div>
      </div>
    </div>
  )
}

export default ReceiptModal
