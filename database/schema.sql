-- StellarAgentPay Database Schema

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(56) NOT NULL UNIQUE,
    preferred_currency VARCHAR(12) DEFAULT 'XLM',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(20,7) NOT NULL,
    currency VARCHAR(12) NOT NULL,
    recipient_id UUID REFERENCES users(id),
    payer_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    blockchain_tx_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    from_address VARCHAR(56) NOT NULL,
    to_address VARCHAR(56) NOT NULL,
    amount DECIMAL(20,7) NOT NULL,
    currency VARCHAR(12) NOT NULL,
    stellar_tx_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    type VARCHAR(20) NOT NULL, -- 'payment', 'refund', 'swap'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recurring payments table
CREATE TABLE recurring_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    amount DECIMAL(20,7) NOT NULL,
    currency VARCHAR(12) NOT NULL,
    interval_days INTEGER NOT NULL,
    next_payment TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment configurations table
CREATE TABLE payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    preferred_currency VARCHAR(12) DEFAULT 'XLM',
    auto_refund_enabled BOOLEAN DEFAULT false,
    refund_window_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI command logs table
CREATE TABLE command_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    command TEXT NOT NULL,
    parsed_intent VARCHAR(50),
    confidence DECIMAL(3,2),
    success BOOLEAN,
    response TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invoices_recipient ON invoices(recipient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_transactions_hash ON transactions(stellar_tx_hash);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_recurring_next_payment ON recurring_payments(next_payment) WHERE active = true;
CREATE INDEX idx_command_logs_user ON command_logs(user_id);
CREATE INDEX idx_command_logs_created ON command_logs(created_at);