import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import CommandInterface from '../components/CommandInterface'
import BalanceCards from '../components/BalanceCards'
import RecentTransactions from '../components/RecentTransactions'
import QuickActions from '../components/QuickActions'
import AIBrainIcon from '../assets/icons/ai-brain.svg'
import WalletIcon from '../assets/icons/wallet.svg'
import NetworkIcon from '../assets/icons/network.svg'
import AnalyticsIcon from '../assets/icons/analytics.svg'

const Dashboard: React.FC = () => {
  const { wallet } = useWallet()

  if (!wallet?.isConnected) {
    return (
      <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">

        <div className="relative text-center py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero Title */}
            <div className="mb-12">
              <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Nexar
              </h2>
              <p className="text-xl md:text-2xl text-slate-400 font-medium">
                Next-Gen AI Payments on Stellar
              </p>
            </div>

            <p className="text-lg text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
              Connect your Stellar wallet to unlock intelligent payment automation with natural language commands
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="card text-center">
                <div className="mb-4 flex justify-center">
                  <img src={AIBrainIcon} alt="AI Assistant" className="h-16 w-16" />
                </div>
                <h3 className="font-bold text-lg text-slate-200 mb-2">AI Assistant</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Natural language commands for seamless payments
                </p>
              </div>
              <div className="card text-center">
                <div className="mb-4 flex justify-center">
                  <img src={NetworkIcon} alt="Social Payments" className="h-16 w-16" />
                </div>
                <h3 className="font-bold text-lg text-slate-200 mb-2">Social Payments</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Groups, friends, and split payments made easy
                </p>
              </div>
              <div className="card text-center">
                <div className="mb-4 flex justify-center">
                  <img src={AnalyticsIcon} alt="Smart Analytics" className="h-16 w-16" />
                </div>
                <h3 className="font-bold text-lg text-slate-200 mb-2">Smart Analytics</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Track, export, and analyze all your transactions
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="card max-w-md mx-auto text-center">
              <div className="mb-4 flex justify-center">
                <img src={WalletIcon} alt="Connect Wallet" className="h-20 w-20" />
              </div>
              <h3 className="font-bold text-2xl text-slate-100 mb-3">
                Ready to Get Started?
              </h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Click the "Connect Wallet" button in the top right to begin
              </p>
              <p className="text-blue-400 font-medium text-sm">
                Powered by Stellar Network
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-3">Dashboard</h1>
        <p className="text-slate-400 text-lg">
          Manage your payments with AI-powered natural language commands
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