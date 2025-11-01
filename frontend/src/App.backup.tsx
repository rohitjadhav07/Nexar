import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'

function App() {
  return (
    <WalletProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </WalletProvider>
  )
}

export default App