import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import { CommandProvider } from './contexts/CommandContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Invoices from './pages/Invoices'
import Schedules from './pages/Schedules'
import Social from './pages/Social'
import BluetoothPayment from './pages/BluetoothPayment'
import PayInvoice from './pages/PayInvoice'
import ToastContainer from './components/ToastContainer'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has seen loading screen before
    const hasSeenLoading = sessionStorage.getItem('hasSeenLoading')
    if (hasSeenLoading) {
      setIsLoading(false)
    }
  }, [])

  const handleLoadingComplete = () => {
    setIsLoading(false)
    sessionStorage.setItem('hasSeenLoading', 'true')
  }

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  return (
    <WalletProvider>
      <CommandProvider>
        <Routes>
          {/* Public invoice payment page - no layout */}
          <Route path="/pay/:invoiceId" element={<PayInvoice />} />
          
          {/* Main app routes with layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/social" element={<Social />} />
                <Route path="/bluetooth" element={<BluetoothPayment />} />
                
                {/* Redirect old routes to new structure */}
                <Route path="/transactions" element={<Navigate to="/analytics" replace />} />
                <Route path="/friends" element={<Navigate to="/social" replace />} />
                <Route path="/groups" element={<Navigate to="/social" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
        <ToastContainer />
      </CommandProvider>
    </WalletProvider>
  )
}

export default App