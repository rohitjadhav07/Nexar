import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { scheduleService, ScheduledPayment, ScheduleFrequency } from '../services/ScheduleService'
import { notificationService } from '../services/NotificationService'
import {
  CalendarIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const Schedules: React.FC = () => {
  const { wallet } = useWallet()
  const [schedules, setSchedules] = useState<ScheduledPayment[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Form state
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('XLM')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly')
  const [startDate, setStartDate] = useState('')

  useEffect(() => {
    if (wallet?.publicKey) {
      loadSchedules()
    }
  }, [wallet?.publicKey])

  const loadSchedules = () => {
    if (!wallet?.publicKey) return
    const userSchedules = scheduleService.getUserSchedules(wallet.publicKey)
    setSchedules(userSchedules)
  }

  const handleCreateSchedule = () => {
    if (!wallet?.publicKey || !toAddress || !amount || !description || !startDate) return

    const schedule = scheduleService.createSchedule(
      wallet.publicKey,
      toAddress,
      parseFloat(amount),
      currency,
      description,
      frequency,
      new Date(startDate)
    )

    notificationService.scheduleCreated(schedule.id, schedule.amount, schedule.currency, schedule.frequency)
    
    setShowCreateModal(false)
    setToAddress('')
    setAmount('')
    setDescription('')
    setStartDate('')
    loadSchedules()
  }

  const handlePause = (scheduleId: string) => {
    scheduleService.pauseSchedule(scheduleId)
    notificationService.warning('Schedule Paused', 'Payment schedule has been paused', 'schedule')
    loadSchedules()
  }

  const handleResume = (scheduleId: string) => {
    scheduleService.resumeSchedule(scheduleId)
    notificationService.success('Schedule Resumed', 'Payment schedule is now active', 'schedule')
    loadSchedules()
  }

  const handleCancel = (scheduleId: string) => {
    scheduleService.cancelSchedule(scheduleId)
    notificationService.warning('Schedule Cancelled', 'Payment schedule has been cancelled', 'schedule')
    loadSchedules()
  }

  const stats = wallet?.publicKey ? scheduleService.getScheduleStats(wallet.publicKey) : null
  const calendarEvents = wallet?.publicKey 
    ? scheduleService.getCalendarEvents(wallet.publicKey, currentMonth, currentYear)
    : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'paused':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'completed':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/20'
    }
  }

  const getFrequencyLabel = (freq: ScheduleFrequency) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1)
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Schedules</h1>
        <div className="card text-center py-12">
          <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400">Please connect your wallet to manage schedules</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Schedules</h1>
          <p className="text-slate-400 mt-2">Automate recurring payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Active</span>
              <PlayIcon className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.active}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Paused</span>
              <PauseIcon className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.paused}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Completed</span>
              <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.completed}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Next Payment</span>
              <ClockIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-slate-100">
              {stats.nextPaymentDate 
                ? new Date(stats.nextPaymentDate).toLocaleDateString()
                : 'None'}
            </p>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card">
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">No Schedules</h3>
              <p className="text-slate-400">Create your first recurring payment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 rounded-lg border border-slate-800/50 hover:bg-slate-800/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-200">{schedule.description}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50">
                          {getFrequencyLabel(schedule.frequency)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span>To: {schedule.to.substring(0, 8)}...</span>
                        <span>Next: {new Date(schedule.nextExecutionDate).toLocaleDateString()}</span>
                        <span>Executed: {schedule.executionCount}x</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-100">
                        {schedule.amount} {schedule.currency}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {schedule.status === 'active' && (
                          <button
                            onClick={() => handlePause(schedule.id)}
                            className="p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                            title="Pause"
                          >
                            <PauseIcon className="h-4 w-4 text-amber-400" />
                          </button>
                        )}
                        {schedule.status === 'paused' && (
                          <button
                            onClick={() => handleResume(schedule.id)}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Resume"
                          >
                            <PlayIcon className="h-4 w-4 text-green-400" />
                          </button>
                        )}
                        {(schedule.status === 'active' || schedule.status === 'paused') && (
                          <button
                            onClick={() => handleCancel(schedule.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircleIcon className="h-4 w-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11)
                  setCurrentYear(currentYear - 1)
                } else {
                  setCurrentMonth(currentMonth - 1)
                }
              }}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <h3 className="text-xl font-bold text-slate-100">
              {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0)
                  setCurrentYear(currentYear + 1)
                } else {
                  setCurrentMonth(currentMonth + 1)
                }
              }}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>

          {calendarEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No scheduled payments this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calendarEvents.map((event, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-200">
                      {event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    <span className="text-sm text-slate-400">{event.schedules.length} payment(s)</span>
                  </div>
                  <div className="space-y-2">
                    {event.schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{schedule.description}</span>
                        <span className="font-mono text-slate-400">
                          {schedule.amount} {schedule.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 border border-slate-800/50 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Create Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="GXXX..."
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
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
                  placeholder="Monthly rent"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
                  className="input-field w-full"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onClick={handleCreateSchedule}
                  disabled={!toAddress || !amount || !description || !startDate}
                  className="btn-primary flex-1"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedules
