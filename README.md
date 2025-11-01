# Nexar - Next-Gen Stellar Payments

> AI-powered payment infrastructure built on Stellar blockchain with real on-chain transactions, auto-executing scheduled payments, and shareable invoice links.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Soroban-orange)](https://soroban.stellar.org/)

## 🌟 Features

### 💳 Real On-Chain Payments
- **100% Real Stellar Transactions** - Every payment executes on Stellar testnet
- **Freighter Wallet Integration** - Secure transaction signing
- **Multi-Asset Support** - XLM, USDC, and custom Stellar assets
- **Transaction Verification** - All payments verifiable on Stellar Explorer

### 📄 Public Invoice System
- **Shareable Payment Links** - Generate unique URLs for each invoice
- **QR Code Generation** - Mobile-friendly payment scanning
- **Public Payment Pages** - Anyone can pay without login
- **Real-time Status Updates** - Track invoice status (pending/paid/expired)

### ⏰ Auto-Executing Scheduled Payments
- **Background Payment Executor** - Monitors and executes payments automatically
- **Flexible Scheduling** - Once, daily, weekly, monthly, yearly
- **Retry Logic** - Handles failures gracefully
- **Real-time Notifications** - Toast alerts for payment execution

### 📊 Analytics & Insights
- **Transaction History** - Complete on-chain transaction log
- **Payment Analytics** - Volume, success rate, and trends
- **Real-time Data** - Fetched directly from Stellar Horizon API

### 👥 Social Features
- **Friends Management** - Save frequent payment recipients
- **Payment Groups** - Split bills and group expenses
- **Group Chat Integration** - Coordinate payments with team

### 🤖 AI Payment Assistant
- **Natural Language Commands** - "Send 50 USDC to @alice for design work"
- **Smart Command Parsing** - Powered by GPT-4
- **Quick Actions** - Request, schedule, and refund payments via chat

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust and Cargo (for smart contracts)
- [Freighter Wallet](https://www.freighter.app/) browser extension
- Stellar testnet account with XLM (get from [Friendbot](https://laboratory.stellar.org/#account-creator))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nexar-stellar-payments.git
cd nexar-stellar-payments
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# AI Agent (optional)
cd ../ai-agent
npm install
```

3. **Start the application**
```bash
cd frontend
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

### First Steps

1. **Connect Wallet** - Click "Connect Wallet" and approve Freighter
2. **Create Invoice** - Go to Invoices → Create Invoice
3. **Share Payment Link** - Copy link or show QR code
4. **Test Payment** - Open link in incognito and pay with different wallet
5. **Schedule Payment** - Go to Schedules → Create recurring payment

## 📋 Contract Addresses

### Stellar Testnet

```
Network: Stellar Testnet
Horizon API: https://horizon-testnet.stellar.org
Network Passphrase: Test SDF Network ; September 2015

Payment Contract: [To be deployed]
Router Contract: [To be deployed]
Admin Address: GBDJ5ILN5KWNHZX75BRZ2IJSDM3MIWL7TX7HMMBUXW5FNB4FI57XHWED
```

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Query for data fetching
- Stellar SDK for blockchain interaction
- Freighter API for wallet integration

**Smart Contracts**
- Rust + Soroban SDK
- WebAssembly compilation
- Deployed on Stellar testnet

**AI Agent**
- LangGraph.js for workflow orchestration
- OpenAI GPT-4 for natural language processing
- Command parsing and validation

**Database** (Optional)
- PostgreSQL with Prisma ORM
- Schema ready for production deployment

### Data Flow

```
User → Freighter Wallet → Stellar SDK → Horizon API → Stellar Blockchain
                                                    ↓
                                            Transaction Hash
                                                    ↓
                                            localStorage/Database
```

## 🎯 Key Features Explained

### 1. Public Invoice Payment

**How it works:**
1. User creates invoice in the app
2. System generates unique URL: `/pay/inv_123456`
3. Share link or QR code with payer
4. Payer opens link, connects wallet, and pays
5. Real Stellar transaction executes on-chain
6. Invoice status updates to "paid"

**What's Real:**
- ✅ Stellar blockchain transaction
- ✅ Transaction hash verifiable on Stellar Explorer
- ✅ XLM actually transferred between wallets

**What's Local:**
- 📦 Invoice metadata (description, dates)
- 📦 Stored in browser localStorage

### 2. Auto-Executing Scheduled Payments

**How it works:**
1. User creates scheduled payment
2. PaymentExecutor service starts with wallet connection
3. Checks every 60 seconds for due payments
4. Automatically executes real Stellar transactions
5. Updates schedule with transaction hash
6. Calculates next execution date

**Features:**
- Runs in background while wallet connected
- Handles multiple schedules simultaneously
- Retry logic for failed payments
- Toast notifications for execution status

### 3. Real Blockchain Integration

**All payments are real:**
- Transaction signing via Freighter wallet
- Submission to Stellar Horizon API
- Permanent blockchain records
- Verifiable transaction hashes
- Balance updates from network

**No mock data:**
- Every transaction hash is unique
- All hashes work in Stellar Explorer
- Payments show in Freighter wallet
- Balances change permanently

## 📱 Usage Examples

### Create and Share Invoice

```typescript
// 1. Create invoice
const invoice = invoiceService.createInvoice(
  wallet.publicKey,
  100,
  'XLM',
  'Website design services',
  24 // expires in 24 hours
)

// 2. Generate QR code
const qrCode = await invoiceService.generateQRCode(invoice)

// 3. Share link
const link = invoice.shareableLink
// http://localhost:5173/pay/inv_1730556789_abc123
```

### Schedule Recurring Payment

```typescript
// Create monthly payment
const schedule = scheduleService.createSchedule(
  wallet.publicKey,
  'GXYZ...', // recipient
  50,
  'XLM',
  'Monthly subscription',
  'monthly',
  new Date(), // start now
  undefined, // no end date
  12 // max 12 payments
)

// Payment executor automatically handles execution
```

### Execute Real Payment

```typescript
// Build and submit Stellar transaction
const txHash = await sendPayment({
  from: wallet.publicKey,
  to: recipient,
  amount: '10',
  asset: 'XLM'
})

// Verify on Stellar Explorer
// https://stellar.expert/explorer/testnet/tx/{txHash}
```

## 🧪 Testing

### Test Real Payments

1. **Get Testnet XLM**
   - Visit https://laboratory.stellar.org/#account-creator
   - Fund your Freighter wallet with test XLM

2. **Create Test Invoice**
   - Amount: 10 XLM
   - Description: "Test Payment"
   - Copy payment link

3. **Pay from Different Wallet**
   - Open link in incognito window
   - Connect different Freighter account
   - Execute payment
   - Verify transaction on Stellar Explorer

4. **Test Auto-Execution**
   - Create schedule with start time = now + 1 minute
   - Open browser console
   - Watch for executor logs
   - Payment executes automatically!

### Verify on Blockchain

Every transaction can be verified:
```
https://stellar.expert/explorer/testnet/tx/{transaction_hash}
```

## 🔧 Configuration

### Environment Variables

Create `.env` in frontend directory:

```env
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_OPENAI_API_KEY=your_openai_key_here
```

### AI Agent Setup (Optional)

```bash
cd ai-agent
cp .env.example .env
# Add your OpenAI API key
npm run dev
```

## 📊 Project Structure

```
nexar-stellar-payments/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts (Wallet, Command)
│   │   ├── pages/           # Page components
│   │   ├── services/        # Business logic services
│   │   │   ├── InvoiceService.ts
│   │   │   ├── ScheduleService.ts
│   │   │   ├── PaymentExecutor.ts
│   │   │   └── NotificationService.ts
│   │   └── utils/           # Utility functions
│   │       └── stellarTransactions.ts
│   └── package.json
├── contracts/               # Soroban smart contracts (Rust)
├── ai-agent/               # AI payment assistant
├── api/                    # Backend API (optional)
│   └── prisma/            # Database schema
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Stellar Testnet Explorer**: https://stellar.expert/explorer/testnet
- **Freighter Wallet**: https://www.freighter.app/
- **Stellar Documentation**: https://developers.stellar.org/
- **Soroban Documentation**: https://soroban.stellar.org/

## 🆘 Support

### Common Issues

**"Account not found"**
- Fund your testnet account at https://laboratory.stellar.org/#account-creator

**"Transaction failed"**
- Ensure you have enough XLM (need ~1 XLM for fees)

**"Freighter not detected"**
- Install Freighter extension: https://www.freighter.app/

**"Payment executor not starting"**
- Check browser console for errors
- Ensure wallet is connected

### Get Help

- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation in `/docs`

## 🎉 Acknowledgments

- Built with [Scaffold Stellar](https://github.com/stellar/scaffold-soroban)
- Powered by [Stellar](https://stellar.org) blockchain
- UI inspired by modern fintech applications
- AI capabilities via OpenAI GPT-4

## 📈 Roadmap

- [ ] Deploy smart contracts to mainnet
- [ ] Add backend API for multi-device sync
- [ ] Implement multi-signature wallets
- [ ] Add more payment currencies
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Payment request templates
- [ ] Webhook notifications

---

**Built with ❤️ for the Stellar ecosystem**

*Nexar - Making crypto payments as easy as sending a text message*
