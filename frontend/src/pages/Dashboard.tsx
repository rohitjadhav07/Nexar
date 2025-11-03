import React from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../contexts/WalletContext'
import CommandInterface from '../components/CommandInterface'
import BalanceCards from '../components/BalanceCards'
import RecentTransactions from '../components/RecentTransactions'
import QuickActions from '../components/QuickActions'
import GlowCard from '../components/GlowCard'
import AIBrainIcon from '../assets/icons/ai-brain.svg'
import WalletIcon from '../assets/icons/wallet.svg'
import NetworkIcon from '../assets/icons/network.svg'
import AnalyticsIcon from '../assets/icons/analytics.svg'

const Dashboard: React.FC = () => {
  const { wallet } = useWallet()

  if (!wallet?.isConnected) {
    return (
      <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Animated Background Orbs - Dark theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative text-center py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero Title */}
            <div className="mb-12">
              <h2 className="text-5xl md:text-7xl font-black mb-6">
                <span className="gradient-text">Nexar</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-400 font-medium">
                Next-Gen AI Payments on Stellar
              </p>
            </div>

            <p className="text-lg text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
              Connect your Stellar wallet to unlock intelligent payment automation with natural language commands
            </p>

            {/* Feature Cards with animations */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <GlowCard glowColor="blue" className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mb-4 flex justify-center"
                >
                  <img src={AIBrainIcon} alt="AI Assistant" className="h-16 w-16 animate-float" />
                </motion.div>
                <h3 className="font-bold text-lg text-slate-200 mb-2 neon-blue">AI Assistant</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Natural language commands for seamless payments
                </p>
              </GlowCard>
              <div className="card group hover:border-blue-500/30 transition-all duration-300">
                <div className="mb-4 flex justify-center">
                  <img src={NetworkIcon} alt="Social Payments" className="h-16 w-16 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-bold text-lg text-slate-200 mb-2">Social Payments</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Groups, friends, and split payments made easy
                </p>
              </div>
              <div className="card group hover:border-blue-500/30 transition-all duration-300">
                <div className="mb-4 flex justify-center">
                  <img src={AnalyticsIcon} alt="Smart Analytics" className="h-16 w-16 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-bold text-lg text-slate-200 mb-2">Smart Analytics</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Track, export, and analyze all your transactions
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="card max-w-md mx-auto border-blue-500/30 shadow-2xl shadow-blue-500/10">
              <div className="mb-4 flex justify-center">
                <img src={WalletIcon} alt="Connect Wallet" className="h-20 w-20" />
              </div>
              <h3 className="font-bold text-2xl text-slate-100 mb-3">
                Ready to Get Started?
              </h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Click the "Connect Wallet" button in the top right to begin your journey
              </p>
              <div className="inline-flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                <span>Powered by Stellar Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      {/* Subtle Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Welcome Section */}
      <div className="relative">
        <h1 className="text-4xl md:text-5xl font-black gradient-text mb-3">Dashboard</h1>
        <p className="text-slate-400 text-lg">
          Manage your payments with <span className="font-semibold text-blue-400">AI-powered</span> natural language commands
        </p>
      </div>

      {/* Balance Cards */}
      <BalanceCards />

      {/* AI Command Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CommandInterface />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  )
}

export default Dashboard