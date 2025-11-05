import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { motion } from 'framer-motion'
import WalletButton from './WalletButton'
import AnimatedBackground from './AnimatedBackground'
import { 
  HomeIcon, 
  CreditCardIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ChartPieIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import Logo from '../assets/logo.svg'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { wallet } = useWallet()

  // Main navigation - clean and organized
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Invoices', href: '/invoices', icon: CreditCardIcon },
    { name: 'Schedules', href: '/schedules', icon: ClockIcon },
    { name: 'Bluetooth', href: '/bluetooth', icon: SignalIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartPieIcon },
    { name: 'Social', href: '/social', icon: UserGroupIcon },
  ]

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header - Dark theme */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img src={Logo} alt="Nexar" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all duration-300 pointer-events-none"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">
                  Nexar
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Next-Gen Stellar Payments
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/social' && (location.pathname === '/friends' || location.pathname === '/groups'))
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-2 transition-transform duration-300 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`} />
                    {item.name}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-40 -z-10 pointer-events-none"></div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Navigation - Dark theme */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 shadow-2xl z-50">
        <div className="flex justify-around py-3 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href === '/social' && (location.pathname === '/friends' || location.pathname === '/groups'))
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`relative flex flex-col items-center py-1 px-2 rounded-lg transition-all duration-300 ${
                  isActive ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/10 rounded-lg pointer-events-none"></div>
                )}
                <item.icon className={`h-6 w-6 transition-transform duration-300 ${
                  isActive ? 'scale-110' : ''
                }`} />
                <span className={`text-xs mt-1 font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}>{item.name}</span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default Layout