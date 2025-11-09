import * as StellarSdk from 'stellar-sdk';

const { 
  Server, 
  Keypair, 
  Networks, 
  TransactionBuilder, 
  Operation, 
  Asset,
  Contract,
  xdr,
  scValToNative,
  nativeToScVal,
  Address: StellarAddress
} = StellarSdk;
import { PaymentCommand, StellarTransaction, Invoice } from './types';

export class StellarClient {
  private server: Server;
  private networkPassphrase: string;
  private paymentContractId: string;
  private routerContractId: string;

  constructor(
    horizonUrl: string,
    network: 'testnet' | 'mainnet',
    paymentContractId: string,
    routerContractId: string
  ) {
    this.server = new Server(horizonUrl);
    this.networkPassphrase = network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
    this.paymentContractId = paymentContractId;
    this.routerContractId = routerContractId;
  }

  /**
   * Create an invoice on the blockchain
   */
  async createInvoice(command: PaymentCommand, creatorKeypair: Keypair): Promise<string> {
    try {
      const account = await this.server.loadAccount(creatorKeypair.publicKey());
      const contract = new Contract(this.paymentContractId);

      // Convert amount to stroops (7 decimal places for Stellar)
      const amountInStroops = Math.floor(command.amount * 10000000);

      // Build the contract invocation
      const transaction = new TransactionBuilder(account, {
        fee: '100000', // Higher fee for contract calls
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'create_invoice',
            nativeToScVal(amountInStroops, { type: 'i128' }),
            nativeToScVal(command.currency, { type: 'address' }), // Token contract address
            nativeToScVal(command.recipient, { type: 'address' }),
            nativeToScVal(command.description || '', { type: 'string' })
          )
        )
        .setTimeout(30)
        .build();

      transaction.sign(creatorKeypair);

      const response = await this.server.sendTransaction(transaction);
      
      // Wait for transaction confirmation
      let txResponse = await this.server.getTransaction(response.hash);
      while (txResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await this.server.getTransaction(response.hash);
      }

      if (txResponse.status === 'SUCCESS') {
        // Extract invoice ID from transaction result
        const result = txResponse.returnValue;
        const invoiceId = scValToNative(result);
        
        console.log(`✅ Created invoice ${invoiceId} on blockchain`);
        return invoiceId.toString();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      throw new Error(`Failed to create invoice: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Process payment for an invoice
   */
  async processPayment(invoiceId: string, payerKeypair: Keypair): Promise<StellarTransaction> {
    try {
      const account = await this.server.loadAccount(payerKeypair.publicKey());
      const contract = new Contract(this.paymentContractId);

      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'process_payment',
            nativeToScVal(parseInt(invoiceId), { type: 'u64' }),
            nativeToScVal(payerKeypair.publicKey(), { type: 'address' })
          )
        )
        .setTimeout(30)
        .build();

      transaction.sign(payerKeypair);

      const response = await this.server.sendTransaction(transaction);
      
      // Wait for confirmation
      let txResponse = await this.server.getTransaction(response.hash);
      while (txResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await this.server.getTransaction(response.hash);
      }

      const stellarTx: StellarTransaction = {
        hash: response.hash,
        status: txResponse.status === 'SUCCESS' ? 'success' : 'failed',
        amount: '0', // Would extract from invoice
        from: payerKeypair.publicKey(),
        to: '', // Would extract from invoice
        asset: 'XLM',
      };

      console.log(`✅ Processed payment for invoice ${invoiceId}`);
      return stellarTx;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      throw new Error(`Failed to process payment: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Execute a refund
   */
  async executeRefund(
    invoiceId: string, 
    reason: string, 
    refunderKeypair: Keypair
  ): Promise<StellarTransaction> {
    try {
      const account = await this.server.loadAccount(refunderKeypair.publicKey());
      const contract = new Contract(this.paymentContractId);

      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'execute_refund',
            nativeToScVal(parseInt(invoiceId), { type: 'u64' }),
            nativeToScVal(reason, { type: 'string' })
          )
        )
        .setTimeout(30)
        .build();

      transaction.sign(refunderKeypair);

      const response = await this.server.sendTransaction(transaction);
      
      let txResponse = await this.server.getTransaction(response.hash);
      while (txResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await this.server.getTransaction(response.hash);
      }

      const stellarTx: StellarTransaction = {
        hash: response.hash,
        status: txResponse.status === 'SUCCESS' ? 'success' : 'failed',
        amount: '0',
        from: refunderKeypair.publicKey(),
        to: '',
        asset: 'XLM',
      };

      console.log(`✅ Executed refund for invoice ${invoiceId}`);
      return stellarTx;
    } catch (error: any) {
      console.error('Error executing refund:', error);
      throw new Error(`Failed to execute refund: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Schedule a recurring payment
   */
  async scheduleRecurringPayment(
    command: PaymentCommand, 
    payerKeypair: Keypair
  ): Promise<string> {
    try {
      const account = await this.server.loadAccount(payerKeypair.publicKey());
      const contract = new Contract(this.paymentContractId);

      const amountInStroops = Math.floor(command.amount * 10000000);
      const intervalDays = command.schedule?.interval_days || 30;

      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'schedule_recurring',
            nativeToScVal(amountInStroops, { type: 'i128' }),
            nativeToScVal(command.currency, { type: 'address' }),
            nativeToScVal(command.recipient, { type: 'address' }),
            nativeToScVal(intervalDays, { type: 'u32' }),
            nativeToScVal(payerKeypair.publicKey(), { type: 'address' })
          )
        )
        .setTimeout(30)
        .build();

      transaction.sign(payerKeypair);

      const response = await this.server.sendTransaction(transaction);
      
      let txResponse = await this.server.getTransaction(response.hash);
      while (txResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await this.server.getTransaction(response.hash);
      }

      if (txResponse.status === 'SUCCESS') {
        const result = txResponse.returnValue;
        const recurringId = scValToNative(result);
        
        console.log(`✅ Scheduled recurring payment ${recurringId}`);
        return recurringId.toString();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Error scheduling recurring payment:', error);
      throw new Error(`Failed to schedule recurring payment: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get invoice details from blockchain
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const contract = new Contract(this.paymentContractId);
      
      // Create a temporary keypair for read-only operations
      const tempKeypair = Keypair.random();
      const account = await this.server.loadAccount(tempKeypair.publicKey());

      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_invoice',
            nativeToScVal(parseInt(invoiceId), { type: 'u64' })
          )
        )
        .setTimeout(30)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);
      
      if (simulated.results && simulated.results.length > 0) {
        const invoiceData = scValToNative(simulated.results[0].xdr);
        
        return {
          id: invoiceData.id.toString(),
          amount: invoiceData.amount / 10000000, // Convert from stroops
          currency: invoiceData.currency,
          recipient: invoiceData.recipient,
          status: invoiceData.status.toLowerCase(),
          description: invoiceData.description,
          createdAt: new Date(invoiceData.created_at * 1000),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return null;
    }
  }

  /**
   * Get transaction status from Stellar
   */
  async getTransactionStatus(txHash: string): Promise<StellarTransaction | null> {
    try {
      const transaction = await this.server.transactions().transaction(txHash).call();
      
      return {
        hash: transaction.hash,
        status: transaction.successful ? 'success' : 'failed',
        amount: '0',
        from: transaction.source_account,
        to: '',
        asset: 'XLM',
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return null;
    }
  }

  /**
   * Estimate token swap
   */
  async estimateSwap(
    fromAsset: string, 
    toAsset: string, 
    amount: number
  ): Promise<{
    estimatedOutput: number;
    priceImpact: number;
    fees: number;
  }> {
    try {
      const contract = new Contract(this.routerContractId);
      const tempKeypair = Keypair.random();
      const account = await this.server.loadAccount(tempKeypair.publicKey());

      const amountInStroops = Math.floor(amount * 10000000);

      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_swap_quote',
            nativeToScVal(fromAsset, { type: 'address' }),
            nativeToScVal(toAsset, { type: 'address' }),
            nativeToScVal(amountInStroops, { type: 'i128' })
          )
        )
        .setTimeout(30)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);
      
      if (simulated.results && simulated.results.length > 0) {
        const swapResult = scValToNative(simulated.results[0].xdr);
        
        return {
          estimatedOutput: swapResult.amount_out / 10000000,
          priceImpact: swapResult.price_impact / 100, // Convert from basis points
          fees: swapResult.fees_paid / 10000000,
        };
      }
      
      throw new Error('Failed to get swap quote');
    } catch (error: any) {
      console.error('Error estimating swap:', error);
      throw new Error(`Failed to estimate swap: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Execute a token swap
   */
  async executeSwap(
    fromAsset: string,
    toAsset: string,
    amount: number,
    minAmountOut: number,
    payerKeypair: Keypair
  ): Promise<StellarTransaction> {
    try {
      const account = await this.server.loadAccount(payerKeypair.publicKey());
      const contract = new Contract(this.routerContractId);

      const amountInStroops = Math.floor(amount * 10000000);
      const minAmountOutStroops = Math.floor(minAmountOut * 10000000);

      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'execute_swap',
            nativeToScVal(fromAsset, { type: 'address' }),
            nativeToScVal(toAsset, { type: 'address' }),
            nativeToScVal(amountInStroops, { type: 'i128' }),
            nativeToScVal(minAmountOutStroops, { type: 'i128' }),
            nativeToScVal(payerKeypair.publicKey(), { type: 'address' }),
            nativeToScVal(payerKeypair.publicKey(), { type: 'address' })
          )
        )
        .setTimeout(30)
        .build();

      transaction.sign(payerKeypair);

      const response = await this.server.sendTransaction(transaction);
      
      let txResponse = await this.server.getTransaction(response.hash);
      while (txResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await this.server.getTransaction(response.hash);
      }

      const stellarTx: StellarTransaction = {
        hash: response.hash,
        status: txResponse.status === 'SUCCESS' ? 'success' : 'failed',
        amount: amount.toString(),
        from: payerKeypair.publicKey(),
        to: payerKeypair.publicKey(),
        asset: fromAsset,
      };

      console.log(`✅ Executed swap: ${amount} ${fromAsset} -> ${toAsset}`);
      return stellarTx;
    } catch (error: any) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error?.message || 'Unknown error'}`);
    }
  }
}
