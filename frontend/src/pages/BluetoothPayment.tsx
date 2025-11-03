import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { bluetoothPaymentService } from '../services/BluetoothPaymentService'
import { sendPayment } from '../utils/stellarTransactions'
import { notificationService } from '../services/NotificationService'
import {
  SignalIcon,
  SignalSlashIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

type Mode = 'merchant' | 'customer' | null

const BluetoothPayment: React.FC = () => {
  const { wallet } = useWallet()
  const [mode, setMode] = useState<Mode>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  
  // Merchant state
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('XLM')
  const [description, setDescription] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Customer state
  const [receivedRequest, setReceivedRequest] = useState<any>(null)
  const [isSigning, setIsSigning] = useState(false)
  
  // Offline transactions
  const [offlineCount, setOfflineCount] = useState(0)

  useEffect(() => {
    // Check for offline transactions
    const count = bluetoothPaymentService.getOfflineTransactions().length
    setOfflineCount(count)
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await bluetoothPaymentService.requestDevice()
      await bluetoothPaymentService.connect()
      setIsConnected(true)
      setDeviceInfo(bluetoothPaymentService.getDeviceInfo())
      notificationService.success('Connected', 'Bluetooth device connected', 'bluetooth')
    } catch (error: any) {
      notificationService.error('Connection Failed', error.message, 'bluetooth')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    bluetoothPaymentService.disconnect()
    setIsConnected(false)
    setDeviceInfo(null)
    notificationService.info('Disconnected', 'Bluetooth device disconnected', 'bluetooth')
  }

  const handleSendRequest = async () => {
    if (!wallet?.publicKey || !amount) return

    setIsSending(true)
    try {
      const request = {
        id: `req_${Date.now()}`,
        amount: parseFloat(amount),
        currency,
        recipient: wallet.publicKey,
        description,
        timestamp: Date.now()
      }

      await bluetoothPaymentService.sendPaymentRequest(request)
      notificationService.success('Request Sent', 'Payment request sent via Bluetooth', 'bluetooth')

      // Wait for signed transaction
      const signedTx = await bluetoothPaymentService.receiveSignedTransaction()
      
      // Store for later broadcast
      bluetoothPaymentService.storeOfflineTransaction(signedTx)
      setOfflineCount(bluetoothPaymentService.getOfflineTransactions().length)
      
      notificationService.success('Payment Received', 'Signed transaction received and stored', 'bluetooth')
      
      // Reset form
      setAmount('')
      setDescription('')
    } catch (error: any) {
      notificationService.error('Failed', error.message, 'bluetooth')
    } finally {
      setIsSending(false)
    }
  }

  const handleReceiveRequest = async () => {
    try {
      notificationService.info('Waiting', 'Waiting for payment request...', 'bluetooth')
      const request = await bluetoothPaymentService.receivePaymentRequest()
      setReceivedRequest(request)
      notificationService.success('Request Received', 'Payment request received', 'bluetooth')
    } catch (error: any) {
      notificationService.error('Failed', error.message, 'bluetooth')
    }
  }

  const handleSignAndSend = async () => {
    if (!wallet?.publicKey || !receivedRequest) return

    setIsSigning(true)
    try {
      // Build transaction
      const StellarSdk = (window as any).StellarSdk
      if (!StellarSdk) throw new Error('Stellar SDK not loaded')

      // Get account
      const accountResponse = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}`
      )
      const accountData = await accountResponse.json()
      const account = new StellarSdk.Account(wallet.publicKey, accountData.sequence)

      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: 'Test SDF Network ; September 2015',
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: receivedRequest.recipient,
            asset: StellarSdk.Asset.native(),
            amount: receivedRequest.amount.toString(),
          })
        )
        .setTimeout(180)
        .build()

      // Sign with Freighter
      const { signTransaction } = await import('@stellar/freighter-api')
      const signedXDR = await signTransaction(transaction.toXDR(), {
        networkPassphrase: 'Test SDF Network ; September 2015',
      })

      // Send back via Bluetooth
      const signedTx = {
        requestId: receivedRequest.id,
        signedXDR,
        from: wallet.publicKey,
        timestamp: Date.now()
      }

      await bluetoothPaymentService.sendSignedTransaction(signedTx)
      
      notificationService.success('Payment Sent', 'Signed transaction sent via Bluetooth', 'bluetooth')
      setReceivedRequest(null)
    } catch (error: any) {
      notificationService.error('Failed', error.message, 'bluetooth')
    } finally {
      setIsSigning(false)
    }
  }

  const handleBroadcastOffline = async () => {
    try {
      await bluetoothPaymentService.broadcastOfflineTransactions()
      setOfflineCount(bluetoothPaymentService.getOfflineTransactions().length)
      notificationService.success('Broadcast Complete', 'Offline transactions broadcast to Stellar', 'bluetooth')
    } catch (error: any) {
      notificationService.error('Broadcast Failed', error.message, 'bluetooth')
    }
  }

  if (!bluetoothPaymentService.isSupported()) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black gradient-text">Bluetooth Payments</h1>
        <div className="card text-center py-12">
          <SignalSlashIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-100 mb-2">Bluetooth Not Supported</h3>
          <p className="text-slate-400">
            Your browser doesn't support Web Bluetooth API.
            <br />
            Try Chrome, Edge, or Opera on desktop/Android.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black gradient-text">Bluetooth Payments</h1>
        <p className="text-slate-400 mt-1">Offline device-to-device payments</p>
      </div>

      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <SignalIcon className="h-8 w-8 text-green-400" />
            ) : (
              <SignalSlashIcon className="h-8 w-8 text-slate-500" />
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isConnected ? 'Connected' : 'Not Connected'}
              </h3>
              {deviceInfo && (
                <p className="text-sm text-slate-400">{deviceInfo.name}</p>
              )}
            </div>
          </div>
          {isConnected ? (
            <button onClick={handleDisconnect} className="btn-secondary">
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-primary"
            >
              {isConnecting ? 'Connecting...' : 'Connect Device'}
            </button>
          )}
        </div>
      </div>

      {/* Offline Transactions */}
      {offlineCount > 0 && (
        <div className="card bg-amber-500/10 border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-amber-400">
                {offlineCount} Offline Transaction{offlineCount > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-slate-400">Ready to broadcast when online</p>
            </div>
            <button onClick={handleBroadcastOffline} className="btn-primary">
              Broadcast Now
            </button>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      {!mode && isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setMode('merchant')}
            className="card hover:border-blue-500/50 transition-all cursor-pointer text-center py-12"
          >
            <DevicePhoneMobileIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Request Payment</h3>
            <p className="text-slate-400">I'm the merchant/seller</p>
          </button>

          <button
            onClick={() => setMode('customer')}
            className="card hover:border-green-500/50 transition-all cursor-pointer text-center py-12"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Make Payment</h3>
            <p className="text-slate-400">I'm the customer/buyer</p>
          </button>
        </div>
      )}

      {/* Merchant Mode */}
      {mode === 'merchant' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100">Request Payment</h3>
            <button onClick={() => setMode(null)} className="btn-secondary">
              Back
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input"
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this payment for?"
                className="input"
              />
            </div>

            <button
              onClick={handleSendRequest}
              disabled={isSending || !amount}
              className="btn-primary w-full"
            >
              {isSending ? 'Sending...' : 'Send Payment Request'}
            </button>
          </div>
        </div>
      )}

      {/* Customer Mode */}
      {mode === 'customer' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100">Make Payment</h3>
            <button onClick={() => setMode(null)} className="btn-secondary">
              Back
            </button>
          </div>

          {!receivedRequest ? (
            <button onClick={handleReceiveRequest} className="btn-primary w-full">
              Wait for Payment Request
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-slate-100 mb-4">Payment Request</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-slate-100 font-bold">
                      {receivedRequest.amount} {receivedRequest.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Description:</span>
                    <span className="text-slate-100">{receivedRequest.description}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignAndSend}
                disabled={isSigning}
                className="btn-primary w-full"
              >
                {isSigning ? 'Signing...' : 'Sign & Send Payment'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BluetoothPayment
