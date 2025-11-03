/**
 * BluetoothPaymentService - Offline device-to-device payments via Bluetooth
 * Part of Nexar - Next-Gen Stellar Payments
 */

interface PaymentRequest {
  id: string
  amount: number
  currency: string
  recipient: string
  description: string
  timestamp: number
}

interface SignedTransaction {
  requestId: string
  signedXDR: string
  from: string
  timestamp: number
}

export class BluetoothPaymentService {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  
  // Nexar Bluetooth Service UUID (custom)
  private readonly SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'
  private readonly CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'

  /**
   * Check if Bluetooth is supported
   */
  isSupported(): boolean {
    return 'bluetooth' in navigator
  }

  /**
   * Request Bluetooth device pairing
   */
  async requestDevice(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Bluetooth is not supported in this browser')
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.SERVICE_UUID] }],
        optionalServices: [this.SERVICE_UUID]
      })

      console.log('✅ Bluetooth device paired:', this.device.name)
    } catch (error: any) {
      console.error('❌ Bluetooth pairing failed:', error)
      throw new Error(`Failed to pair device: ${error.message}`)
    }
  }

  /**
   * Connect to paired device
   */
  async connect(): Promise<void> {
    if (!this.device) {
      throw new Error('No device paired. Call requestDevice() first.')
    }

    try {
      const server = await this.device.gatt?.connect()
      if (!server) throw new Error('Failed to connect to GATT server')

      const service = await server.getPrimaryService(this.SERVICE_UUID)
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID)

      console.log('✅ Connected to Bluetooth device')
    } catch (error: any) {
      console.error('❌ Connection failed:', error)
      throw new Error(`Failed to connect: ${error.message}`)
    }
  }

  /**
   * Disconnect from device
   */
  disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
      console.log('✅ Disconnected from Bluetooth device')
    }
    this.device = null
    this.characteristic = null
  }

  /**
   * Send payment request via Bluetooth (Merchant side)
   */
  async sendPaymentRequest(request: PaymentRequest): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to device')
    }

    try {
      const data = JSON.stringify(request)
      const encoder = new TextEncoder()
      const encoded = encoder.encode(data)

      // Split into chunks if needed (Bluetooth has packet size limits)
      const chunkSize = 20 // bytes
      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize)
        await this.characteristic.writeValue(chunk)
      }

      console.log('✅ Payment request sent via Bluetooth')
    } catch (error: any) {
      console.error('❌ Failed to send payment request:', error)
      throw new Error(`Failed to send: ${error.message}`)
    }
  }

  /**
   * Receive payment request via Bluetooth (Customer side)
   */
  async receivePaymentRequest(): Promise<PaymentRequest> {
    if (!this.characteristic) {
      throw new Error('Not connected to device')
    }

    try {
      // Start notifications
      await this.characteristic.startNotifications()

      return new Promise((resolve, reject) => {
        let receivedData = ''

        this.characteristic!.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value
          const decoder = new TextDecoder()
          const chunk = decoder.decode(value)
          receivedData += chunk

          // Try to parse complete JSON
          try {
            const request = JSON.parse(receivedData)
            resolve(request)
          } catch {
            // Not complete yet, wait for more chunks
          }
        })

        // Timeout after 30 seconds
        setTimeout(() => {
          reject(new Error('Timeout waiting for payment request'))
        }, 30000)
      })
    } catch (error: any) {
      console.error('❌ Failed to receive payment request:', error)
      throw new Error(`Failed to receive: ${error.message}`)
    }
  }

  /**
   * Send signed transaction back via Bluetooth (Customer side)
   */
  async sendSignedTransaction(signedTx: SignedTransaction): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to device')
    }

    try {
      const data = JSON.stringify(signedTx)
      const encoder = new TextEncoder()
      const encoded = encoder.encode(data)

      const chunkSize = 20
      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize)
        await this.characteristic.writeValue(chunk)
      }

      console.log('✅ Signed transaction sent via Bluetooth')
    } catch (error: any) {
      console.error('❌ Failed to send signed transaction:', error)
      throw new Error(`Failed to send: ${error.message}`)
    }
  }

  /**
   * Receive signed transaction via Bluetooth (Merchant side)
   */
  async receiveSignedTransaction(): Promise<SignedTransaction> {
    if (!this.characteristic) {
      throw new Error('Not connected to device')
    }

    try {
      await this.characteristic.startNotifications()

      return new Promise((resolve, reject) => {
        let receivedData = ''

        this.characteristic!.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value
          const decoder = new TextDecoder()
          const chunk = decoder.decode(value)
          receivedData += chunk

          try {
            const signedTx = JSON.parse(receivedData)
            resolve(signedTx)
          } catch {
            // Not complete yet
          }
        })

        setTimeout(() => {
          reject(new Error('Timeout waiting for signed transaction'))
        }, 30000)
      })
    } catch (error: any) {
      console.error('❌ Failed to receive signed transaction:', error)
      throw new Error(`Failed to receive: ${error.message}`)
    }
  }

  /**
   * Store offline transaction for later broadcast
   */
  storeOfflineTransaction(signedTx: SignedTransaction): void {
    const stored = this.getOfflineTransactions()
    stored.push(signedTx)
    localStorage.setItem('nexar_offline_transactions', JSON.stringify(stored))
    console.log('✅ Offline transaction stored')
  }

  /**
   * Get all offline transactions
   */
  getOfflineTransactions(): SignedTransaction[] {
    const data = localStorage.getItem('nexar_offline_transactions')
    return data ? JSON.parse(data) : []
  }

  /**
   * Broadcast offline transactions when back online
   */
  async broadcastOfflineTransactions(): Promise<void> {
    const transactions = this.getOfflineTransactions()
    
    if (transactions.length === 0) {
      console.log('No offline transactions to broadcast')
      return
    }

    console.log(`📡 Broadcasting ${transactions.length} offline transaction(s)...`)

    const HORIZON_URL = 'https://horizon-testnet.stellar.org'
    const successful: string[] = []

    for (const tx of transactions) {
      try {
        const response = await fetch(`${HORIZON_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `tx=${encodeURIComponent(tx.signedXDR)}`,
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Transaction broadcast: ${result.hash}`)
          successful.push(tx.requestId)
        } else {
          console.error(`❌ Failed to broadcast transaction ${tx.requestId}`)
        }
      } catch (error) {
        console.error(`❌ Error broadcasting transaction ${tx.requestId}:`, error)
      }
    }

    // Remove successful transactions
    const remaining = transactions.filter(tx => !successful.includes(tx.requestId))
    localStorage.setItem('nexar_offline_transactions', JSON.stringify(remaining))

    console.log(`✅ Broadcast complete: ${successful.length} successful, ${remaining.length} remaining`)
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.device?.gatt?.connected || false
  }

  /**
   * Get device info
   */
  getDeviceInfo(): { name: string; id: string } | null {
    if (!this.device) return null
    return {
      name: this.device.name || 'Unknown Device',
      id: this.device.id
    }
  }
}

// Export singleton instance
export const bluetoothPaymentService = new BluetoothPaymentService()
