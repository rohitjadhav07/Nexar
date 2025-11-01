#![no_std]
use admin_sep::{Administratable, Upgradable};
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, String,
    token
};

#[contract]
pub struct StellarAgentPayContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InvoiceStatus {
    Pending,
    Paid,
    Refunded,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: u64,
    pub amount: i128,
    pub currency: Address, // Token contract address
    pub recipient: Address,
    pub payer: Option<Address>,
    pub status: InvoiceStatus,
    pub description: String,
    pub created_at: u64,
    pub paid_at: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentConfig {
    pub merchant_address: Address,
    pub preferred_currency: Address,
    pub auto_refund_enabled: bool,
    pub refund_window_hours: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecurringPayment {
    pub id: u64,
    pub amount: i128,
    pub currency: Address,
    pub recipient: Address,
    pub interval_days: u32,
    pub next_payment: u64,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    InvoiceCounter,
    Invoice(u64),
    PaymentConfig(Address),
    RecurringPayment(u64),
    RecurringCounter,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvoiceNotFound = 1,
    InvoiceAlreadyPaid = 2,
    InsufficientBalance = 3,
    Unauthorized = 4,
    InvalidAmount = 5,
    InvoiceExpired = 6,
}

#[contractimpl]
impl Administratable for StellarAgentPayContract {}

#[contractimpl]
impl Upgradable for StellarAgentPayContract {}

#[contractimpl]
impl StellarAgentPayContract {
    pub fn __constructor(env: &Env, admin: Address) {
        Self::set_admin(env, admin);
        env.storage().instance().set(&DataKey::InvoiceCounter, &0u64);
        env.storage().instance().set(&DataKey::RecurringCounter, &0u64);
    }

    /// Create a new invoice for payment
    pub fn create_invoice(
        env: Env,
        amount: i128,
        currency: Address,
        recipient: Address,
        description: String,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let counter: u64 = env.storage().instance()
            .get(&DataKey::InvoiceCounter)
            .unwrap_or(0);
        
        let invoice_id = counter + 1;
        
        let invoice = Invoice {
            id: invoice_id,
            amount,
            currency,
            recipient,
            payer: None,
            status: InvoiceStatus::Pending,
            description,
            created_at: env.ledger().timestamp(),
            paid_at: None,
        };

        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);
        env.storage().instance().set(&DataKey::InvoiceCounter, &invoice_id);

        Ok(invoice_id)
    }

    /// Process payment for an invoice
    pub fn process_payment(env: Env, invoice_id: u64, payer: Address) -> Result<bool, Error> {
        payer.require_auth();

        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .ok_or(Error::InvoiceNotFound)?;

        if invoice.status != InvoiceStatus::Pending {
            return Err(Error::InvoiceAlreadyPaid);
        }

        // Transfer tokens from payer to recipient
        let token_client = token::Client::new(&env, &invoice.currency);
        token_client.transfer(&payer, &invoice.recipient, &invoice.amount);

        // Update invoice status
        invoice.status = InvoiceStatus::Paid;
        invoice.payer = Some(payer);
        invoice.paid_at = Some(env.ledger().timestamp());

        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        Ok(true)
    }

    /// Get invoice details
    pub fn get_invoice(env: Env, invoice_id: u64) -> Result<Invoice, Error> {
        env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .ok_or(Error::InvoiceNotFound)
    }

    /// Execute refund for a paid invoice
    pub fn execute_refund(env: Env, invoice_id: u64, _reason: String) -> Result<bool, Error> {
        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .ok_or(Error::InvoiceNotFound)?;

        if invoice.status != InvoiceStatus::Paid {
            return Err(Error::InvoiceNotFound);
        }

        let payer = invoice.payer.as_ref().ok_or(Error::InvoiceNotFound)?;
        
        // Transfer tokens back from recipient to payer
        let token_client = token::Client::new(&env, &invoice.currency);
        token_client.transfer(&invoice.recipient, payer, &invoice.amount);

        // Update invoice status
        invoice.status = InvoiceStatus::Refunded;
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        Ok(true)
    }

    /// Set merchant payment preferences
    pub fn update_merchant_preferences(
        env: Env,
        merchant: Address,
        preferred_currency: Address,
        auto_refund_enabled: bool,
        refund_window_hours: u32,
    ) {
        merchant.require_auth();

        let config = PaymentConfig {
            merchant_address: merchant.clone(),
            preferred_currency,
            auto_refund_enabled,
            refund_window_hours,
        };

        env.storage().persistent().set(&DataKey::PaymentConfig(merchant), &config);
    }

    /// Get merchant payment configuration
    pub fn get_merchant_config(env: Env, merchant: Address) -> Option<PaymentConfig> {
        env.storage().persistent().get(&DataKey::PaymentConfig(merchant))
    }

    /// Schedule recurring payment
    pub fn schedule_recurring(
        env: Env,
        amount: i128,
        currency: Address,
        recipient: Address,
        interval_days: u32,
        payer: Address,
    ) -> Result<u64, Error> {
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let counter: u64 = env.storage().instance()
            .get(&DataKey::RecurringCounter)
            .unwrap_or(0);
        
        let recurring_id = counter + 1;
        
        let recurring_payment = RecurringPayment {
            id: recurring_id,
            amount,
            currency,
            recipient,
            interval_days,
            next_payment: env.ledger().timestamp() + (interval_days as u64 * 24 * 60 * 60),
            active: true,
        };

        env.storage().persistent().set(&DataKey::RecurringPayment(recurring_id), &recurring_payment);
        env.storage().instance().set(&DataKey::RecurringCounter, &recurring_id);

        Ok(recurring_id)
    }

    /// Execute recurring payment (called by automation)
    pub fn execute_recurring_payment(env: Env, recurring_id: u64, payer: Address) -> Result<bool, Error> {
        let mut recurring: RecurringPayment = env.storage().persistent()
            .get(&DataKey::RecurringPayment(recurring_id))
            .ok_or(Error::InvoiceNotFound)?;

        if !recurring.active || env.ledger().timestamp() < recurring.next_payment {
            return Ok(false);
        }

        // Transfer tokens
        let token_client = token::Client::new(&env, &recurring.currency);
        token_client.transfer(&payer, &recurring.recipient, &recurring.amount);

        // Update next payment time
        recurring.next_payment = env.ledger().timestamp() + (recurring.interval_days as u64 * 24 * 60 * 60);
        env.storage().persistent().set(&DataKey::RecurringPayment(recurring_id), &recurring);

        Ok(true)
    }

    /// Cancel recurring payment
    pub fn cancel_recurring(env: Env, recurring_id: u64, payer: Address) -> Result<bool, Error> {
        payer.require_auth();

        let mut recurring: RecurringPayment = env.storage().persistent()
            .get(&DataKey::RecurringPayment(recurring_id))
            .ok_or(Error::InvoiceNotFound)?;

        recurring.active = false;
        env.storage().persistent().set(&DataKey::RecurringPayment(recurring_id), &recurring);

        Ok(true)
    }
}