import React from 'react'
import { useCommand } from '../contexts/CommandContext'
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon, 
  CalendarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'

const QuickActions: React.FC = () => {
  const { triggerCommand } = useCommand()

  const actions = [
    {
      name: 'Request Payment',
      description: 'Create a payment request',
      icon: PaperAirplaneIcon,
      command: 'Ask 100 USDC from @user for services',
    },
    {
      name: 'Schedule Payment',
      description: 'Set up recurring payments',
      icon: CalendarIcon,
      command: 'Schedule 50 XLM monthly to @freelancer',
    },
    {
      name: 'Process Refund',
      description: 'Refund a payment',
      icon: ArrowPathIcon,
      command: 'Refund @user\'s payment from yesterday',
    },
    {
      name: 'Check Balance',
      description: 'View your account balance',
      icon: ChartBarIcon,
      command: 'What is my balance',
    },
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={() => triggerCommand(action.command)}
            className="w-full text-left p-3 rounded-lg border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <action.icon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">
                  {action.name}
                </p>
                <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  "{action.command}"
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions