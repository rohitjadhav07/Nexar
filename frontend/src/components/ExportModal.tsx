import React, { useState } from 'react'
import { 
  DocumentArrowDownIcon,
  CalendarIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { receiptService, Receipt } from '../services/ReceiptService'

interface ExportModalProps {
  transactions: Array<{
    hash: string
    from: string
    to: string
    amount: number
    currency: string
    timestamp: number
    successful: boolean
  }>
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ transactions, onClose }) => {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(tx => {
    if (!startDate && !endDate) return true
    const txDate = new Date(tx.timestamp)
    const start = startDate ? new Date(startDate) : new Date(0)
    const end = endDate ? new Date(endDate) : new Date()
    return txDate >= start && txDate <= end
  })

  // Convert to Receipt format
  const receipts: Receipt[] = filteredTransactions.map((tx, index) => ({
    id: `export_${index}`,
    transactionHash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount: tx.amount,
    currency: tx.currency,
    timestamp: tx.timestamp,
    status: tx.successful ? 'success' : 'failed'
  }))

  const handleExport = async () => {
    if (receipts.length === 0) {
      alert('No transactions to export')
      return
    }

    setIsExporting(true)
    try {
      let blob: Blob
      let filename: string

      switch (format) {
        case 'pdf':
          blob = await receiptService.exportToPDF(receipts)
          filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`
          break
        case 'csv':
          blob = receiptService.exportToCSV(receipts)
          filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'json':
          blob = receiptService.exportToJSON(receipts)
          filename = `transactions_${new Date().toISOString().split('T')[0]}.json`
          break
      }

      receiptService.downloadBlob(blob, filename)
      onClose()
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleBulkReceipts = async () => {
    if (receipts.length === 0) {
      alert('No transactions to export')
      return
    }

    setIsExporting(true)
    try {
      const zipBlob = await receiptService.generateBulkReceipts(receipts)
      const filename = `receipts_${new Date().toISOString().split('T')[0]}.zip`
      receiptService.downloadBlob(zipBlob, filename)
      onClose()
    } catch (error: any) {
      alert(`Bulk receipt generation failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900/80 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Export Transactions</h3>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-full"
                placeholder="Start date"
              />
            </div>
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-full"
                placeholder="End date"
              />
            </div>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-stellar-50 border border-stellar-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-stellar-600" />
            <span className="text-sm text-stellar-900">
              {filteredTransactions.length} transaction(s) selected
            </span>
          </div>
          {filteredTransactions.length > 0 && (
            <p className="text-xs text-stellar-700 mt-1">
              Total value: {filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)} XLM
            </p>
          )}
        </div>

        {/* Export Format */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Export Format
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value as 'pdf')}
                className="text-stellar-600 focus:ring-stellar-500"
              />
              <span className="text-sm">PDF Report (formatted document)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'csv')}
                className="text-stellar-600 focus:ring-stellar-500"
              />
              <span className="text-sm">CSV (spreadsheet compatible)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json')}
                className="text-stellar-600 focus:ring-stellar-500"
              />
              <span className="text-sm">JSON (raw data)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={isExporting || filteredTransactions.length === 0}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>
              {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </span>
          </button>

          <button
            onClick={handleBulkReceipts}
            disabled={isExporting || filteredTransactions.length === 0}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>
              {isExporting ? 'Generating...' : 'Download All Receipts (ZIP)'}
            </span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            Bulk receipts will be downloaded as individual PDF files in a ZIP archive
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
