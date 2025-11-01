/**
 * InvoiceService - Manages payment requests, invoices, and shareable payment links
 * Part of Nexar - Next-Gen Stellar Payments
 */

import QRCode from 'qrcode'

export type InvoiceStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

export interface Invoice {
  id: string
  from: string // Creator's address
  to?: string // Optional recipient address
  amount: number
  currency: string
  description: string
  status: InvoiceStatus
  createdAt: number
  expiresAt?: number
  paidAt?: number
  transactionHash?: string
  shareableLink: string
  qrCode?: string
}

export class InvoiceService {
  private storageKey = 'nexar_invoices'

  /**
   * Create a new invoice/payment request
   */
  createInvoice(
    from: string,
    amount: number,
    currency: string,
    description: string,
    expiresInHours?: number
  ): Invoice {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createdAt = Date.now()
    const expiresAt = expiresInHours ? createdAt + expiresInHours * 60 * 60 * 1000 : undefined

    const invoice: Invoice = {
      id,
      from,
      amount,
      currency,
      description,
      status: 'pending',
      createdAt,
      expiresAt,
      shareableLink: this.generateShareableLink(id),
    }

    this.saveInvoice(invoice)
    return invoice
  }

  /**
   * Generate shareable payment link
   */
  private generateShareableLink(invoiceId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/pay/${invoiceId}`
  }

  /**
   * Generate QR code for invoice
   */
  async generateQRCode(invoice: Invoice): Promise<string> {
    try {
      const qrData = invoice.shareableLink
      const qrCode = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1E293B',
          light: '#F1F5F9',
        },
      })
      
      // Update invoice with QR code
      invoice.qrCode = qrCode
      this.saveInvoice(invoice)
      
      return qrCode
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw error
    }
  }

  /**
   * Get invoice by ID
   */
  getInvoice(id: string): Invoice | null {
    const invoices = this.getAllInvoices()
    return invoices.find(inv => inv.id === id) || null
  }

  /**
   * Get all invoices for a user
   */
  getUserInvoices(userAddress: string): Invoice[] {
    const invoices = this.getAllInvoices()
    return invoices
      .filter(inv => inv.from === userAddress || inv.to === userAddress)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Get pending invoices
   */
  getPendingInvoices(userAddress: string): Invoice[] {
    return this.getUserInvoices(userAddress).filter(inv => inv.status === 'pending')
  }

  /**
   * Mark invoice as paid
   */
  markAsPaid(invoiceId: string, transactionHash: string, paidBy?: string): void {
    const invoice = this.getInvoice(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    invoice.status = 'paid'
    invoice.paidAt = Date.now()
    invoice.transactionHash = transactionHash
    if (paidBy) invoice.to = paidBy

    this.saveInvoice(invoice)
  }

  /**
   * Cancel invoice
   */
  cancelInvoice(invoiceId: string): void {
    const invoice = this.getInvoice(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    invoice.status = 'cancelled'
    this.saveInvoice(invoice)
  }

  /**
   * Check and update expired invoices
   */
  updateExpiredInvoices(): void {
    const invoices = this.getAllInvoices()
    const now = Date.now()

    invoices.forEach(invoice => {
      if (
        invoice.status === 'pending' &&
        invoice.expiresAt &&
        invoice.expiresAt < now
      ) {
        invoice.status = 'expired'
        this.saveInvoice(invoice)
      }
    })
  }

  /**
   * Get invoice statistics
   */
  getInvoiceStats(userAddress: string): {
    total: number
    pending: number
    paid: number
    expired: number
    totalAmount: number
    paidAmount: number
  } {
    const invoices = this.getUserInvoices(userAddress)
    
    return {
      total: invoices.length,
      pending: invoices.filter(i => i.status === 'pending').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      expired: invoices.filter(i => i.status === 'expired').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
      paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
    }
  }

  /**
   * Save invoice to localStorage
   */
  private saveInvoice(invoice: Invoice): void {
    const invoices = this.getAllInvoices()
    const index = invoices.findIndex(inv => inv.id === invoice.id)
    
    if (index >= 0) {
      invoices[index] = invoice
    } else {
      invoices.push(invoice)
    }

    localStorage.setItem(this.storageKey, JSON.stringify(invoices))
  }

  /**
   * Get all invoices from localStorage
   */
  private getAllInvoices(): Invoice[] {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }

  /**
   * Delete invoice
   */
  deleteInvoice(invoiceId: string): void {
    const invoices = this.getAllInvoices()
    const filtered = invoices.filter(inv => inv.id !== invoiceId)
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
  }

  /**
   * Copy payment link to clipboard
   */
  async copyPaymentLink(invoice: Invoice): Promise<void> {
    try {
      await navigator.clipboard.writeText(invoice.shareableLink)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = invoice.shareableLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService()
