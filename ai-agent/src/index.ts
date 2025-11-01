import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PaymentAgent } from './paymentAgent';
import { RealStellarClient } from './realStellarClient';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services with REAL Stellar client
const stellarClient = new RealStellarClient(
  process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  (process.env.STELLAR_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  process.env.PAYMENT_CONTRACT_ID || '',
  process.env.ROUTER_CONTRACT_ID || ''
);

const paymentAgent = new PaymentAgent(
  process.env.GEMINI_API_KEY || '',
  stellarClient
);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/command', async (req, res) => {
  try {
    const { command, userPublicKey } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required',
      });
    }

    const response = await paymentAgent.processCommand(command, userPublicKey);
    res.json(response);
  } catch (error) {
    console.error('Error processing command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

app.get('/api/invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const response = await paymentAgent.getInvoiceStatus(invoiceId);
    res.json(response);
  } catch (error) {
    console.error('Error getting invoice status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

app.post('/api/swap/quote', async (req, res) => {
  try {
    const { fromAsset, toAsset, amount } = req.body;
    
    if (!fromAsset || !toAsset || !amount) {
      return res.status(400).json({
        success: false,
        message: 'fromAsset, toAsset, and amount are required',
      });
    }

    const response = await paymentAgent.getSwapQuote(fromAsset, toAsset, amount);
    res.json(response);
  } catch (error) {
    console.error('Error getting swap quote:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

app.listen(port, () => {
  console.log(`🤖 StellarAgentPay AI Agent running on port ${port}`);
  console.log(`📡 Connected to Stellar ${process.env.STELLAR_NETWORK || 'testnet'}`);
  console.log(`🔗 Horizon URL: ${process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'}`);
});

export default app;