import { ParsedCommand, PaymentCommand } from './types';

export class SimpleCommandParser {
  parseCommand(command: string): ParsedCommand {
    const lowerCommand = command.toLowerCase();
    
    // Extract amount
    const amountMatch = command.match(/(\d+(?:\.\d+)?)\s*(xlm|usdc|usdt|btc|eth)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
    const currency = amountMatch?.[2]?.toUpperCase() || 'XLM';
    
    // Extract recipient (Stellar address starting with G or contract address starting with C)
    const addressMatch = command.match(/\b([GC][A-Z0-9]{55})\b/);
    let recipient = addressMatch ? addressMatch[1] : undefined;
    
    // Extract username (starts with @)
    const usernameMatch = command.match(/@(\w+)/);
    const username = usernameMatch ? `@${usernameMatch[1]}` : undefined;
    
    // If username found, use it as recipient (will be resolved in frontend)
    if (username && !recipient) {
      recipient = username;
    }
    
    // Determine intent
    let intent = 'query';
    if (lowerCommand.includes('send') || lowerCommand.includes('pay') || lowerCommand.includes('transfer')) {
      intent = 'request';
    } else if (lowerCommand.includes('request') || lowerCommand.includes('ask') || lowerCommand.includes('invoice')) {
      intent = 'request';
    } else if (lowerCommand.includes('refund')) {
      intent = 'refund';
    } else if (lowerCommand.includes('schedule') || lowerCommand.includes('recurring') || lowerCommand.includes('monthly')) {
      intent = 'schedule';
    } else if (lowerCommand.includes('cancel') || lowerCommand.includes('stop')) {
      intent = 'cancel';
    }
    
    // Extract description
    const descMatch = command.match(/for\s+(.+?)(?:\s+to\s+|\s*$)/i);
    const description = descMatch ? descMatch[1].trim() : undefined;
    
    // Extract schedule interval
    let schedule = undefined;
    if (lowerCommand.includes('monthly')) {
      schedule = { interval_days: 30 };
    } else if (lowerCommand.includes('weekly')) {
      schedule = { interval_days: 7 };
    } else if (lowerCommand.includes('daily')) {
      schedule = { interval_days: 1 };
    }
    
    return {
      intent,
      entities: {
        amount,
        currency,
        recipient: recipient || username,
        description,
        schedule
      },
      confidence: (amount && (recipient || username)) ? 0.9 : 0.5
    };
  }

  validateCommand(parsed: ParsedCommand): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (parsed.intent !== 'query') {
      if (!parsed.entities.amount || parsed.entities.amount <= 0) {
        errors.push('Valid amount is required');
      }
      
      if (!parsed.entities.recipient) {
        errors.push('Recipient address or username is required');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  convertToPaymentCommand(parsed: ParsedCommand): PaymentCommand | null {
    if (parsed.intent === 'query') return null;
    
    if (!parsed.entities.amount || parsed.entities.amount <= 0) {
      return null;
    }
    
    if (!parsed.entities.recipient) {
      return null;
    }

    return {
      action: parsed.intent as 'request' | 'refund' | 'schedule' | 'cancel',
      amount: parsed.entities.amount,
      currency: parsed.entities.currency || 'XLM',
      recipient: parsed.entities.recipient,
      description: parsed.entities.description,
      schedule: parsed.entities.schedule,
    };
  }
}
