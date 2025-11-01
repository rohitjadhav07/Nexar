import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import { CommandProvider } from './contexts/CommandContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Invoices from './pages/Invoices'
import Schedules from './pages/Schedules'
import Social from './pages/Social'
import PayInvoice from './pages/PayInvoice'
import ToastContainer from './components/ToastContainer'

function App() {
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