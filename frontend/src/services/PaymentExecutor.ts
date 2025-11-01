/**
 * PaymentExecutor - Automatically executes scheduled payments on-chain
 * Part of Nexar - Next-Gen Stellar Payments
 */

import { scheduleService } from './ScheduleService'
import { notificationService } from './NotificationService'
import { sendPayment } from '../utils/stellarTransactions'

export class PaymentExecutor {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private checkInterval = 60000 // Check every minute
  private userAddress: string | null = null

  /**
   * Start the payment executor
   */
  start(userAddress: string): void {
    if (this.isRunning) {
      console.log('Payment executor already running')
      return
    }

    this.userAddress = userAddress
    this.isRunning = true

    console.log('🚀 Payment Executor started - checking for due payments every minute')

    // Check immediately
    this.checkAndExecutePayments()

    // Then check every minute
    this.intervalId = setInterval(() => {
      this.checkAndExecutePayments()
    }, this.checkInterval)
  }

  /**
   * Stop the payment executor
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    this.userAddress = null
    console.log('⏹️ Payment Executor stopped')
  }

  /**
   * Check for due payments and execute them
   */
  private async checkAndExecutePayments(): Promise<void> {
    if (!this.userAddress) return

    try {
      const duePayments = scheduleService.getDuePayments(this.userAddress)

      if (duePayments.length === 0) {
        console.log('✅ No due payments at', new Date().toLocaleTimeString())
        return
      }

      console.log(`💰 Found ${duePayments.length} due payment(s)`)

      for (const schedule of duePayments) {
        await this.executeScheduledPayment(schedule.id)
      }
    } catch (error) {
      console.error('Error checking due payments:', error)
    }
  }

  /**
   * Execute a single scheduled payment
   */
  private async executeScheduledPayment(scheduleId: string): Promise<void> {
    const schedule = scheduleService.getSchedule(scheduleId)
    if (!schedule) return

    console.log(`⚡ Executing scheduled payment: ${schedule.description}`)

    try {
      // Execute real Stellar transaction
      const txHash = await sendPayment({
        from: schedule.from,
        to: schedule.to,
        amount: schedule.amount.toString(),
      })

      console.log(`✅ Payment executed! TX: ${txHash.substring(0, 12)}...`)

      // Mark as executed
      scheduleService.markAsExecuted(scheduleId, txHash)

      // Notify user
      notificationService.scheduleExecuted(
        scheduleId,
        schedule.amount,
        schedule.currency,
        schedule.to
      )

      // Notify recipient
      notificationService.paymentReceived(
        schedule.amount,
        schedule.currency,
        schedule.from,
        txHash
      )
    } catch (error: any) {
      console.error(`❌ Failed to execute payment:`, error.message)
      
      // Notify user of failure
      notificationService.error(
        'Scheduled Payment Failed',
        `Failed to send ${schedule.amount} ${schedule.currency} to ${schedule.to.substring(0, 8)}...: ${error.message}`,
        'schedule'
      )
    }
  }

  /**
   * Manually execute a scheduled payment (for testing)
   */
  async executeNow(scheduleId: string): Promise<void> {
    await this.executeScheduledPayment(scheduleId)
  }

  /**
   * Get executor status
   */
  getStatus(): {
    isRunning: boolean
    userAddress: string | null
    checkInterval: number
  } {
    return {
      isRunning: this.isRunning,
      userAddress: this.userAddress,
      checkInterval: this.checkInterval,
    }
  }

  /**
   * Set check interval (in milliseconds)
   */
  setCheckInterval(interval: number): void {
    this.checkInterval = interval
    
    // Restart if running
    if (this.isRunning && this.userAddress) {
      this.stop()
      this.start(this.userAddress)
    }
  }
}

// Export singleton instance
export const paymentExecutor = new PaymentExecutor()
