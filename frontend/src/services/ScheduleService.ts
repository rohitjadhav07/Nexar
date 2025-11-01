/**
 * ScheduleService - Manages scheduled and recurring payments
 * Part of Nexar - Next-Gen Stellar Payments
 */

export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface ScheduledPayment {
  id: string
  from: string
  to: string
  amount: number
  currency: string
  description: string
  frequency: ScheduleFrequency
  startDate: number
  endDate?: number
  nextExecutionDate: number
  lastExecutionDate?: number
  executionCount: number
  maxExecutions?: number
  status: ScheduleStatus
  createdAt: number
  transactionHashes: string[]
}

export class ScheduleService {
  private storageKey = 'nexar_scheduled_payments'

  /**
   * Create a new scheduled payment
   */
  createSchedule(
    from: string,
    to: string,
    amount: number,
    currency: string,
    description: string,
    frequency: ScheduleFrequency,
    startDate: Date,
    endDate?: Date,
    maxExecutions?: number
  ): ScheduledPayment {
    const id = `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const schedule: ScheduledPayment = {
      id,
      from,
      to,
      amount,
      currency,
      description,
      frequency,
      startDate: startDate.getTime(),
      endDate: endDate?.getTime(),
      nextExecutionDate: startDate.getTime(),
      executionCount: 0,
      maxExecutions,
      status: 'active',
      createdAt: Date.now(),
      transactionHashes: [],
    }

    this.saveSchedule(schedule)
    return schedule
  }

  /**
   * Get schedule by ID
   */
  getSchedule(id: string): ScheduledPayment | null {
    const schedules = this.getAllSchedules()
    return schedules.find(sch => sch.id === id) || null
  }

  /**
   * Get all schedules for a user
   */
  getUserSchedules(userAddress: string): ScheduledPayment[] {
    const schedules = this.getAllSchedules()
    return schedules
      .filter(sch => sch.from === userAddress)
      .sort((a, b) => a.nextExecutionDate - b.nextExecutionDate)
  }

  /**
   * Get active schedules
   */
  getActiveSchedules(userAddress: string): ScheduledPayment[] {
    return this.getUserSchedules(userAddress).filter(sch => sch.status === 'active')
  }

  /**
   * Get due payments (ready to execute)
   */
  getDuePayments(userAddress: string): ScheduledPayment[] {
    const now = Date.now()
    return this.getActiveSchedules(userAddress).filter(
      sch => sch.nextExecutionDate <= now
    )
  }

  /**
   * Get upcoming payments (next 7 days)
   */
  getUpcomingPayments(userAddress: string, days: number = 7): ScheduledPayment[] {
    const now = Date.now()
    const future = now + days * 24 * 60 * 60 * 1000
    
    return this.getActiveSchedules(userAddress).filter(
      sch => sch.nextExecutionDate > now && sch.nextExecutionDate <= future
    )
  }

  /**
   * Mark payment as executed
   */
  markAsExecuted(scheduleId: string, transactionHash: string): void {
    const schedule = this.getSchedule(scheduleId)
    if (!schedule) throw new Error('Schedule not found')

    schedule.lastExecutionDate = Date.now()
    schedule.executionCount++
    schedule.transactionHashes.push(transactionHash)

    // Calculate next execution date
    if (schedule.frequency !== 'once') {
      schedule.nextExecutionDate = this.calculateNextExecution(
        schedule.nextExecutionDate,
        schedule.frequency
      )
    }

    // Check if schedule should be completed
    if (
      schedule.frequency === 'once' ||
      (schedule.maxExecutions && schedule.executionCount >= schedule.maxExecutions) ||
      (schedule.endDate && schedule.nextExecutionDate > schedule.endDate)
    ) {
      schedule.status = 'completed'
    }

    this.saveSchedule(schedule)
  }

  /**
   * Calculate next execution date based on frequency
   */
  private calculateNextExecution(currentDate: number, frequency: ScheduleFrequency): number {
    const date = new Date(currentDate)
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1)
        break
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
      default:
        return currentDate
    }
    
    return date.getTime()
  }

  /**
   * Pause schedule
   */
  pauseSchedule(scheduleId: string): void {
    const schedule = this.getSchedule(scheduleId)
    if (!schedule) throw new Error('Schedule not found')

    schedule.status = 'paused'
    this.saveSchedule(schedule)
  }

  /**
   * Resume schedule
   */
  resumeSchedule(scheduleId: string): void {
    const schedule = this.getSchedule(scheduleId)
    if (!schedule) throw new Error('Schedule not found')

    schedule.status = 'active'
    this.saveSchedule(schedule)
  }

  /**
   * Cancel schedule
   */
  cancelSchedule(scheduleId: string): void {
    const schedule = this.getSchedule(scheduleId)
    if (!schedule) throw new Error('Schedule not found')

    schedule.status = 'cancelled'
    this.saveSchedule(schedule)
  }

  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId: string): void {
    const schedules = this.getAllSchedules()
    const filtered = schedules.filter(sch => sch.id !== scheduleId)
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
  }

  /**
   * Get schedule statistics
   */
  getScheduleStats(userAddress: string): {
    total: number
    active: number
    paused: number
    completed: number
    totalAmount: number
    nextPaymentDate?: number
  } {
    const schedules = this.getUserSchedules(userAddress)
    const active = schedules.filter(s => s.status === 'active')
    
    return {
      total: schedules.length,
      active: active.length,
      paused: schedules.filter(s => s.status === 'paused').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      totalAmount: schedules.reduce((sum, s) => sum + s.amount * s.executionCount, 0),
      nextPaymentDate: active.length > 0 ? Math.min(...active.map(s => s.nextExecutionDate)) : undefined,
    }
  }

  /**
   * Get calendar events for scheduled payments
   */
  getCalendarEvents(userAddress: string, month: number, year: number): Array<{
    date: Date
    schedules: ScheduledPayment[]
  }> {
    const schedules = this.getActiveSchedules(userAddress)
    const events = new Map<string, ScheduledPayment[]>()

    // Get first and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    schedules.forEach(schedule => {
      let currentDate = new Date(schedule.nextExecutionDate)
      
      // Generate all occurrences in the month
      while (currentDate <= lastDay) {
        if (currentDate >= firstDay) {
          const dateKey = currentDate.toISOString().split('T')[0]
          if (!events.has(dateKey)) {
            events.set(dateKey, [])
          }
          events.get(dateKey)!.push(schedule)
        }
        
        // Move to next occurrence
        if (schedule.frequency === 'once') break
        currentDate = new Date(this.calculateNextExecution(currentDate.getTime(), schedule.frequency))
      }
    })

    // Convert to array and sort
    return Array.from(events.entries())
      .map(([dateStr, schedules]) => ({
        date: new Date(dateStr),
        schedules,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  /**
   * Save schedule to localStorage
   */
  private saveSchedule(schedule: ScheduledPayment): void {
    const schedules = this.getAllSchedules()
    const index = schedules.findIndex(sch => sch.id === schedule.id)
    
    if (index >= 0) {
      schedules[index] = schedule
    } else {
      schedules.push(schedule)
    }

    localStorage.setItem(this.storageKey, JSON.stringify(schedules))
  }

  /**
   * Get all schedules from localStorage
   */
  private getAllSchedules(): ScheduledPayment[] {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }
}

// Export singleton instance
export const scheduleService = new ScheduleService()
