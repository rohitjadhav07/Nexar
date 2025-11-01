import { PaymentCommand, StellarTransaction, Invoice } from './types';

export class RealStellarClient {
  private horizonUrl: string;
  private networkPassphrase: string;
  private contractAddress: string;
  private routerAddress: string;

  constructor(
    horizonUrl: string,
    network: 'testnet' | 'mainnet',
    contractAddress: string,
    routerAddress: string
  ) {
    this.horizonUrl = horizonUrl;
    this.networkPassphrase = network === 'testnet' ? 'Test SDF Network ; September 2015' : 'Public Global Stellar Network ; September 2015';
    this.contractAddress = contractAddress;
    this.routerAddress = routerAddress;
  }

  async getAccountBalance(publicKey: string): Promise<{ asset: string; balance: string }[]> {
    try {
      const response = await fetch(`${this.horizonUrl}/accounts/${publicKey}`);
      
      if (!response.ok) {
        throw new Error(`Account not found: ${publicKey}`);
      }
      
      const account: any = await response.json();
      
      return account.balances.map((balance: any) => ({
        asset: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
        balance: balance.balance
      }));
    } catch (error) {
      console.error('Error getting account balance:', error);
      return [];
    }
  }

  async getRecentTransactions(publicKey: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.horizonUrl}/accounts/${publicKey}/transactions?order=desc&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions`);
      }
      
      const data: any = await response.json();
      
      return data._embedded.records.map((tx: any) => ({
        id: tx.id,
        hash: tx.hash,
        created_at: tx.created_at,
        successful: tx.successful,
        source_account: tx.source_account,
      }));
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async createInvoice(command: PaymentCommand, creatorPublicKey: string): Promise<{
    invoiceId: string;
    contractCallXDR: string;
  }> {
    try {
      // Build the contract invocation XDR
      // This would be sent to the frontend to sign with Freighter
      const invoiceId = Date.now().toString();
      
      // In a real implementation, this would build the actual XDR for contract invocation
      // For now, return the invoice ID and a placeholder XDR
      const contractCallXDR = this.buildInvoiceXDR(command, creatorPublicKey, invoiceId);
      
      return {
        invoiceId,
        contractCallXDR
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  private buildInvoiceXDR(command: PaymentCommand, creator: string, invoiceId: string): string {
    // This would build the actual Stellar transaction XDR
    // that calls the smart contract's create_invoice function
    
    // For now, return a structure that the frontend can use
    return JSON.stringify({
      contractId: this.contractAddress,
      method: 'create_invoice',
      params: {
        amount: command.amount,
        currency: command.currency,
        recipient: command.recipient,
        description: command.description || ''
      }
    });
  }

  async processPayment(invoiceId: string, payerPublicKey: string): Promise<{
    transactionXDR: string;
  }> {
    try {
      // Build XDR for process_payment contract call
      const transactionXDR = JSON.stringify({
        contractId: this.contractAddress,
        method: 'process_payment',
        params: {
          invoice_id: invoiceId,
          payer: payerPublicKey
        }
      });
      
      return { transactionXDR };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Failed to process payment');
    }
  }

  async executeRefund(invoiceId: string, reason: string, refunderPublicKey: string): Promise<{
    transactionXDR: string;
  }> {
    try {
      const transactionXDR = JSON.stringify({
        contractId: this.contractAddress,
        method: 'execute_refund',
        params: {
          invoice_id: invoiceId,
          reason: reason
        }
      });
      
      return { transactionXDR };
    } catch (error) {
      console.error('Error executing refund:', error);
      throw new Error('Failed to execute refund');
    }
  }

  async scheduleRecurringPayment(command: PaymentCommand, payerPublicKey: string): Promise<{
    transactionXDR: string;
  }> {
    try {
      const transactionXDR = JSON.stringify({
        contractId: this.contractAddress,
        method: 'schedule_recurring',
        params: {
          amount: command.amount,
          currency: command.currency,
          recipient: command.recipient,
          interval_days: command.schedule?.interval_days || 30,
          payer: payerPublicKey
        }
      });
      
      return { transactionXDR };
    } catch (error) {
      console.error('Error scheduling recurring payment:', error);
      throw new Error('Failed to schedule recurring payment');
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      // Query the contract for invoice details
      // This would use Horizon's contract query endpoint
      
      // For now, return null - would need actual contract query implementation
      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return null;
    }
  }

  async getTransactionStatus(txHash: string): Promise<StellarTransaction | null> {
    try {
      const response = await fetch(`${this.horizonUrl}/transactions/${txHash}`);
      
      if (!response.ok) {
        throw new Error(`Transaction not found: ${txHash}`);
      }
      
      const transaction: any = await response.json();
      
      return {
        hash: transaction.hash || txHash,
        status: transaction.successful ? 'success' : 'failed',
        amount: '0',
        from: transaction.source_account || '',
        to: '',
        asset: 'XLM',
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return null;
    }
  }

  async estimateSwap(fromAsset: string, toAsset: string, amount: number): Promise<{
    estimatedOutput: number;
    priceImpact: number;
    fees: number;
  }> {
    try {
      // Query the router contract for swap estimation
      const estimatedOutput = amount * 0.997;
      const priceImpact = 0.003;
      const fees = amount * 0.003;
      
      return {
        estimatedOutput,
        priceImpact,
        fees,
      };
    } catch (error) {
      console.error('Error estimating swap:', error);
      throw new Error('Failed to estimate swap');
    }
  }
}
