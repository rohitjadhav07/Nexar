import { z } from 'zod';

// Payment command schemas
export const PaymentCommandSchema = z.object({
  action: z.enum(['request', 'refund', 'schedule', 'cancel']),
  amount: z.number().positive(),
  currency: z.string(),
  recipient: z.string(),
  description: z.string().optional(),
  schedule: z.object({
    interval_days: z.number().positive(),
  }).optional(),
});

export type PaymentCommand = z.infer<typeof PaymentCommandSchema>;

// AI Agent response types
export interface AgentResponse {
  success: boolean;
  message: string;
  data?: any;
  transactionId?: string;
  invoiceId?: string;
}

// Stellar transaction types
export interface StellarTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  amount: string;
  from: string;
  to: string;
  asset: string;
}

// Invoice types
export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  recipient: string;
  payer?: string;
  status: 'pending' | 'paid' | 'refunded' | 'expired';
  description: string;
  createdAt: Date;
  paidAt?: Date;
}

// Command parsing result
export interface ParsedCommand {
  intent: string;
  entities: {
    amount?: number;
    currency?: string;
    recipient?: string;
    description?: string;
    schedule?: {
      interval_days: number;
    };
  };
  confidence: number;
}