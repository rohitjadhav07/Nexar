import React from 'react'
import { motion } from 'framer-motion'
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
    <motion.div 
      className="card"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.name}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
            whileHover={{ 
              scale: 1.03,
              x: 5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => triggerCommand(action.command)}
            className="w-full text-left p-3 rounded-lg border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-colors group relative overflow-hidden"
          >
            {/* Hover glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 pointer-events-none"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
            <div className="flex items-start space-x-3 relative z-10">
              <action.icon className="h-5 w-5 text-slate-400 group-hover:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-200 group-hover:text-slate-100">
                  {action.name}
                </p>
                <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  "{action.command}"
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export default QuickActions