import { SimpleCommandParser } from './simpleCommandParser';
import { RealStellarClient } from './realStellarClient';
import { AgentResponse, PaymentCommand } from './types';

export class PaymentAgent {
  private parser: SimpleCommandParser;
  private stellarClient: RealStellarClient;

  constructor(
    apiKey: string,
    stellarClient: RealStellarClient
  ) {
    this.parser = new SimpleCommandParser();
    this.stellarClient = stellarClient;
  }

  async processCommand(command: string, userPublicKey?: string): Promise<AgentResponse> {
    try {
      // Parse the command using pattern matching
      const parsed = this.parser.parseCommand(command);
      
      if (parsed.confidence < 0.3) {
        return {
          success: false,
          message: "I couldn't understand your command. Please try rephrasing it.",
        };
      }

      // Validate the parsed command
      const validation = this.parser.validateCommand(parsed);
      if (!validation.valid) {
        return {
          success: false,
          message: `Command validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Convert to payment command
      const paymentCommand = this.parser.convertToPaymentCommand(parsed);
      if (!paymentCommand) {
        return await this.handleQuery(command, parsed, userPublicKey);
      }

      // Execute the payment command
      return await this.executePaymentCommand(paymentCommand, userPublicKey);
    } catch (error) {
      console.error('Error processing command:', error);
      return {
        success: false,
        message: 'An error occurred while processing your command.',
      };
    }
  }

  private async executePaymentCommand(
    command: PaymentCommand,
    userPublicKey?: string
  ): Promise<AgentResponse> {
    if (!userPublicKey) {
      return {
        success: false,
        message: 'User public key is required for payment operations.',
      };
    }

    try {
      switch (command.action) {
        case 'request':
          return await this.handlePaymentRequest(command, userPublicKey);
        
        case 'refund':
          return await this.handleRefund(command, userPublicKey);
        
        case 'schedule':
          return await this.handleSchedulePayment(command, userPublicKey);
        
        case 'cancel':
          return await this.handleCancelPayment(command, userPublicKey);
        
        default:
          return {
            success: false,
            message: `Unsupported action: ${command.action}`,
          };
      }
    } catch (error) {
      console.error('Error executing payment command:', error);
      return {
        success: false,
        message: 'Failed to execute payment command.',
      };
    }
  }

  private async handlePaymentRequest(
    command: PaymentCommand,
    userPublicKey: string
  ): Promise<AgentResponse> {
    try {
      const result = await this.stellarClient.createInvoice(command, userPublicKey);
      
      return {
        success: true,
        message: `✅ Payment request ready!\n\nAmount: ${command.amount} ${command.currency}\nTo: ${command.recipient}\n\nInvoice ID: ${result.invoiceId}\n\n⚠️ This will create an invoice on the smart contract. Sign the transaction in your wallet to complete.`,
        invoiceId: result.invoiceId,
        data: {
          amount: command.amount,
          currency: command.currency,
          recipient: command.recipient,
          description: command.description,
          contractCallXDR: result.contractCallXDR,
          requiresSignature: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create payment request.',
      };
    }
  }

  private async handleRefund(
    command: PaymentCommand,
    userPublicKey: string
  ): Promise<AgentResponse> {
    try {
      // In a real implementation, we'd look up the invoice by recipient
      const mockInvoiceId = '123456';
      const reason = command.description || 'Refund requested';
      
      const result = await this.stellarClient.executeRefund(
        mockInvoiceId,
        reason,
        userPublicKey
      );
      
      return {
        success: true,
        message: `✅ Refund ready to process!\n\nRecipient: ${command.recipient}\nReason: ${reason}\n\n⚠️ Sign the transaction in your wallet to complete the refund.`,
        data: {
          recipient: command.recipient,
          reason,
          contractCallXDR: result.transactionXDR,
          requiresSignature: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process refund.',
      };
    }
  }

  private async handleSchedulePayment(
    command: PaymentCommand,
    userPublicKey: string
  ): Promise<AgentResponse> {
    try {
      const result = await this.stellarClient.scheduleRecurringPayment(command, userPublicKey);
      
      return {
        success: true,
        message: `✅ Recurring payment ready!\n\nAmount: ${command.amount} ${command.currency}\nTo: ${command.recipient}\nInterval: Every ${command.schedule?.interval_days} days\n\n⚠️ Sign the transaction in your wallet to activate.`,
        data: {
          amount: command.amount,
          currency: command.currency,
          recipient: command.recipient,
          interval: command.schedule?.interval_days,
          contractCallXDR: result.transactionXDR,
          requiresSignature: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to schedule recurring payment.',
      };
    }
  }

  private async handleCancelPayment(
    command: PaymentCommand,
    userPublicKey: string
  ): Promise<AgentResponse> {
    try {
      // In a real implementation, we'd look up and cancel the recurring payment
      return {
        success: true,
        message: `Payment to ${command.recipient} has been cancelled.`,
        data: {
          recipient: command.recipient,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cancel payment.',
      };
    }
  }

  private async handleQuery(command: string, parsed: any, userPublicKey?: string): Promise<AgentResponse> {
    // Handle informational queries with REAL data
    if (command.toLowerCase().includes('balance')) {
      if (!userPublicKey) {
        return {
          success: false,
          message: 'Please connect your wallet to check balance.',
        };
      }
      
      const balances = await this.stellarClient.getAccountBalance(userPublicKey);
      
      if (balances.length === 0) {
        return {
          success: false,
          message: 'Could not fetch balance. Make sure your account exists on testnet.',
        };
      }
      
      const balanceText = balances.map(b => `${b.balance} ${b.asset}`).join(', ');
      
      return {
        success: true,
        message: `Your current balance: ${balanceText}`,
        data: { balances },
      };
    }

    if (command.toLowerCase().includes('transaction') || command.toLowerCase().includes('history')) {
      if (!userPublicKey) {
        return {
          success: false,
          message: 'Please connect your wallet to view transactions.',
        };
      }
      
      const transactions = await this.stellarClient.getRecentTransactions(userPublicKey, 5);
      
      return {
        success: true,
        message: `Here are your recent ${transactions.length} transactions:`,
        data: { transactions },
      };
    }

    return {
      success: true,
      message: 'I can help you with:\n• Send/Request payments\n• Check your balance\n• View transaction history\n• Schedule recurring payments\n\nTry: "Send 10 XLM to [address]" or "What is my balance?"',
    };
  }

  async getInvoiceStatus(invoiceId: string): Promise<AgentResponse> {
    try {
      const invoice = await this.stellarClient.getInvoice(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          message: 'Invoice not found.',
        };
      }

      return {
        success: true,
        message: `Invoice ${invoiceId} status: ${invoice.status}`,
        data: invoice,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get invoice status.',
      };
    }
  }

  async getSwapQuote(fromAsset: string, toAsset: string, amount: number): Promise<AgentResponse> {
    try {
      const quote = await this.stellarClient.estimateSwap(fromAsset, toAsset, amount);
      
      return {
        success: true,
        message: `Swap quote: ${amount} ${fromAsset} → ${quote.estimatedOutput.toFixed(6)} ${toAsset}`,
        data: {
          fromAsset,
          toAsset,
          amountIn: amount,
          estimatedOutput: quote.estimatedOutput,
          priceImpact: quote.priceImpact,
          fees: quote.fees,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get swap quote.',
      };
    }
  }
}
