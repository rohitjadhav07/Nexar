import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { ParsedCommand, PaymentCommand, PaymentCommandSchema } from './types';

export class CommandParser {
  private llm: ChatGoogleGenerativeAI;
  private parsePrompt: PromptTemplate;

  constructor(apiKey: string) {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: 'gemini-pro',
      temperature: 0.1,
    });

    this.parsePrompt = PromptTemplate.fromTemplate(`
You are a payment command parser for StellarAgentPay. Parse the following natural language command into structured payment data.

Command: "{command}"

Extract the following information:
1. Intent: request, refund, schedule, cancel, or query
2. Amount: numerical value
3. Currency: asset code (XLM, USDC, etc.)
4. Recipient: wallet address or identifier (starts with @ for usernames)
5. Description: purpose of payment
6. Schedule: if recurring, extract interval in days

Examples:
- "Ask 50 USDC from @alice for design work" → intent: request, amount: 50, currency: USDC, recipient: @alice, description: design work
- "Refund @bob's payment from yesterday" → intent: refund, recipient: @bob
- "Schedule 100 XLM monthly to @freelancer" → intent: schedule, amount: 100, currency: XLM, recipient: @freelancer, schedule: 30 days

Return a JSON object with:
{{
  "intent": "request|refund|schedule|cancel|query",
  "entities": {{
    "amount": number or null,
    "currency": "string" or null,
    "recipient": "string" or null,
    "description": "string" or null,
    "schedule": {{ "interval_days": number }} or null
  }},
  "confidence": 0.0-1.0
}}

Only return valid JSON, no additional text.
    `);
  }

  async parseCommand(command: string): Promise<ParsedCommand> {
    try {
      const prompt = await this.parsePrompt.format({ command });
      const response = await this.llm.invoke(prompt);
      
      const parsed = JSON.parse(response.content as string);
      
      // Validate the parsed result
      const result: ParsedCommand = {
        intent: parsed.intent || 'query',
        entities: {
          amount: parsed.entities?.amount || undefined,
          currency: parsed.entities?.currency || undefined,
          recipient: parsed.entities?.recipient || undefined,
          description: parsed.entities?.description || undefined,
          schedule: parsed.entities?.schedule || undefined,
        },
        confidence: parsed.confidence || 0.5,
      };

      return result;
    } catch (error) {
      console.error('Error parsing command:', error);
      return {
        intent: 'query',
        entities: {},
        confidence: 0.0,
      };
    }
  }

  async validateCommand(parsed: ParsedCommand): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate based on intent
    switch (parsed.intent) {
      case 'request':
      case 'schedule':
        if (!parsed.entities.amount || parsed.entities.amount <= 0) {
          errors.push('Amount is required and must be positive');
        }
        if (!parsed.entities.currency) {
          errors.push('Currency is required');
        }
        if (!parsed.entities.recipient) {
          errors.push('Recipient is required');
        }
        if (parsed.intent === 'schedule' && !parsed.entities.schedule?.interval_days) {
          errors.push('Schedule interval is required for recurring payments');
        }
        break;
      
      case 'refund':
      case 'cancel':
        if (!parsed.entities.recipient) {
          errors.push('Recipient is required for refund/cancel operations');
        }
        break;
    }

    // Validate currency format
    if (parsed.entities.currency) {
      const validCurrencies = ['XLM', 'USDC', 'EURT', 'BTC', 'ETH'];
      if (!validCurrencies.includes(parsed.entities.currency.toUpperCase())) {
        errors.push(`Unsupported currency: ${parsed.entities.currency}`);
      }
    }

    // Validate recipient format
    if (parsed.entities.recipient) {
      const recipient = parsed.entities.recipient;
      if (!recipient.startsWith('@') && !recipient.startsWith('G') && !recipient.includes('@')) {
        errors.push('Recipient must be a username (@user), Stellar address (G...), or email');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  convertToPaymentCommand(parsed: ParsedCommand): PaymentCommand | null {
    if (parsed.intent === 'query') return null;
    
    // Validate required fields
    if (!parsed.entities.amount || parsed.entities.amount <= 0) {
      console.error('Invalid or missing amount');
      return null;
    }
    
    if (!parsed.entities.recipient) {
      console.error('Missing recipient');
      return null;
    }

    try {
      const command: PaymentCommand = {
        action: parsed.intent as 'request' | 'refund' | 'schedule' | 'cancel',
        amount: parsed.entities.amount,
        currency: parsed.entities.currency || 'XLM',
        recipient: parsed.entities.recipient,
        description: parsed.entities.description,
        schedule: parsed.entities.schedule,
      };

      return PaymentCommandSchema.parse(command);
    } catch (error) {
      console.error('Error converting to payment command:', error);
      return null;
    }
  }
}