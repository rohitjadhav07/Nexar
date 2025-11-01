/**
 * NotificationService - Manages in-app notifications and alerts
 * Part of Nexar - Next-Gen Stellar Payments
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type NotificationCategory = 'payment' | 'invoice' | 'schedule' | 'group' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  timestamp: number
  read: boolean
  actionUrl?: string
  actionLabel?: string
  data?: any
}

type NotificationListener = (notification: Notification) => void

export class NotificationService {
  private storageKey = 'nexar_notifications'
  private listeners: NotificationListener[] = []
  private maxNotifications = 100

  /**
   * Create a new notification
   */
  notify(
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string,
    data?: any
  ): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      actionUrl,
      actionLabel,
      data,
    }

    this.saveNotification(notification)
    this.notifyListeners(notification)
    
    return notification
  }

  /**
   * Quick notification methods
   */
  success(title: string, message: string, category: NotificationCategory = 'system'): Notification {
    return this.notify('success', category, title, message)
  }

  error(title: string, message: string, category: NotificationCategory = 'system'): Notification {
    return this.notify('error', category, title, message)
  }

  warning(title: string, message: string, category: NotificationCategory = 'system'): Notification {
    return this.notify('warning', category, title, message)
  }

  info(title: string, message: string, category: NotificationCategory = 'system'): Notification {
    return this.notify('info', category, title, message)
  }

  /**
   * Payment-specific notifications
   */
  paymentSent(amount: number, currency: string, to: string, txHash: string): Notification {
    return this.notify(
      'success',
      'payment',
      'Payment Sent',
      `Successfully sent ${amount} ${currency} to ${to.substring(0, 8)}...`,
      `/transactions`,
      'View Transaction',
      { txHash, amount, currency, to }
    )
  }

  paymentReceived(amount: number, currency: string, from: string, txHash: string): Notification {
    return this.notify(
      'success',
      'payment',
      'Payment Received',
      `Received ${amount} ${currency} from ${from.substring(0, 8)}...`,
      `/transactions`,
      'View Transaction',
      { txHash, amount, currency, from }
    )
  }

  paymentFailed(amount: number, currency: string, error: string): Notification {
    return this.notify(
      'error',
      'payment',
      'Payment Failed',
      `Failed to send ${amount} ${currency}: ${error}`,
      undefined,
      undefined,
      { amount, currency, error }
    )
  }

  /**
   * Invoice-specific notifications
   */
  invoiceCreated(invoiceId: string, amount: number, currency: string): Notification {
    return this.notify(
      'success',
      'invoice',
      'Invoice Created',
      `Payment request for ${amount} ${currency} created`,
      `/invoices/${invoiceId}`,
      'View Invoice',
      { invoiceId, amount, currency }
    )
  }

  invoicePaid(invoiceId: string, amount: number, currency: string, paidBy: string): Notification {
    return this.notify(
      'success',
      'invoice',
      'Invoice Paid',
      `${paidBy.substring(0, 8)}... paid ${amount} ${currency}`,
      `/invoices/${invoiceId}`,
      'View Invoice',
      { invoiceId, amount, currency, paidBy }
    )
  }

  invoiceExpired(invoiceId: string, amount: number, currency: string): Notification {
    return this.notify(
      'warning',
      'invoice',
      'Invoice Expired',
      `Payment request for ${amount} ${currency} has expired`,
      `/invoices/${invoiceId}`,
      'View Invoice',
      { invoiceId, amount, currency }
    )
  }

  /**
   * Schedule-specific notifications
   */
  scheduleCreated(scheduleId: string, amount: number, currency: string, frequency: string): Notification {
    return this.notify(
      'success',
      'schedule',
      'Payment Scheduled',
      `${frequency} payment of ${amount} ${currency} scheduled`,
      `/schedules/${scheduleId}`,
      'View Schedule',
      { scheduleId, amount, currency, frequency }
    )
  }

  scheduleExecuted(scheduleId: string, amount: number, currency: string, to: string): Notification {
    return this.notify(
      'info',
      'schedule',
      'Scheduled Payment Sent',
      `Sent ${amount} ${currency} to ${to.substring(0, 8)}...`,
      `/schedules/${scheduleId}`,
      'View Schedule',
      { scheduleId, amount, currency, to }
    )
  }

  scheduleDue(scheduleId: string, amount: number, currency: string, to: string): Notification {
    return this.notify(
      'warning',
      'schedule',
      'Payment Due',
      `Scheduled payment of ${amount} ${currency} to ${to.substring(0, 8)}... is due`,
      `/schedules/${scheduleId}`,
      'Execute Now',
      { scheduleId, amount, currency, to }
    )
  }

  /**
   * Group-specific notifications
   */
  groupPaymentReceived(groupName: string, amount: number, currency: string, from: string): Notification {
    return this.notify(
      'success',
      'group',
      'Group Payment',
      `${from.substring(0, 8)}... sent ${amount} ${currency} in ${groupName}`,
      `/groups`,
      'View Group',
      { groupName, amount, currency, from }
    )
  }

  groupExpenseSplit(groupName: string, amount: number, currency: string, members: number): Notification {
    return this.notify(
      'info',
      'group',
      'Expense Split',
      `${amount} ${currency} split among ${members} members in ${groupName}`,
      `/groups`,
      'View Group',
      { groupName, amount, currency, members }
    )
  }

  /**
   * Get all notifications
   */
  getAllNotifications(): Notification[] {
    const data = localStorage.getItem(this.storageKey)
    const notifications: Notification[] = data ? JSON.parse(data) : []
    return notifications.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.getAllNotifications().filter(n => !n.read)
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnreadNotifications().length
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notifications = this.getAllNotifications()
    const notification = notifications.find(n => n.id === notificationId)
    
    if (notification) {
      notification.read = true
      localStorage.setItem(this.storageKey, JSON.stringify(notifications))
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    const notifications = this.getAllNotifications()
    notifications.forEach(n => n.read = true)
    localStorage.setItem(this.storageKey, JSON.stringify(notifications))
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    const notifications = this.getAllNotifications()
    const filtered = notifications.filter(n => n.id !== notificationId)
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    localStorage.setItem(this.storageKey, JSON.stringify([]))
  }

  /**
   * Clear old notifications (older than 30 days)
   */
  clearOldNotifications(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const notifications = this.getAllNotifications()
    const filtered = notifications.filter(n => n.timestamp > thirtyDaysAgo)
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
  }

  /**
   * Subscribe to notifications
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification)
      } catch (error) {
        console.error('Notification listener error:', error)
      }
    })
  }

  /**
   * Save notification to localStorage
   */
  private saveNotification(notification: Notification): void {
    const notifications = this.getAllNotifications()
    notifications.unshift(notification)
    
    // Keep only the most recent notifications
    const trimmed = notifications.slice(0, this.maxNotifications)
    localStorage.setItem(this.storageKey, JSON.stringify(trimmed))
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
