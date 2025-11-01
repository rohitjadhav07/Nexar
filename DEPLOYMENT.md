# Nexar Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Deploy Frontend to Vercel (Recommended - Free)

Vercel is perfect for React apps and offers free hosting with automatic deployments.

#### Steps:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy Frontend**
```bash
cd frontend
vercel
```

4. **Follow prompts:**
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name? **nexar** (or your choice)
   - Directory? **./frontend**
   - Override settings? **N**

5. **Production Deployment**
```bash
vercel --prod
```

**Your app will be live at**: `https://nexar-yourusername.vercel.app`

#### Configure Environment Variables in Vercel:

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

---

### Option 2: Deploy to Netlify (Also Free)

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Deploy**
```bash
cd frontend
netlify deploy
```

4. **Production Deploy**
```bash
netlify deploy --prod
```

---

### Option 3: Deploy to GitHub Pages (Free)

1. **Add to package.json** (in frontend directory):
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

2. **Install gh-pages**
```bash
cd frontend
npm install --save-dev gh-pages
```

3. **Update vite.config.ts**:
```typescript
export default defineConfig({
  base: '/Nexar/', // Your repo name
  // ... rest of config
})
```

4. **Deploy**
```bash
npm run deploy
```

**Your app will be at**: `https://rohitjadhav07.github.io/Nexar/`

---

### Option 4: Deploy Smart Contracts to Stellar Testnet

#### Prerequisites:
- Stellar CLI installed
- Funded testnet account

#### Deploy Contracts:

1. **Build Contracts**
```bash
cd contracts/stellar_agent_pay
cargo build --target wasm32-unknown-unknown --release
```

2. **Optimize WASM**
```bash
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm
```

3. **Deploy to Testnet**
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

4. **Save Contract ID**
Copy the contract ID and update `.env.contracts`

---

## 🎯 Recommended Full Stack Deployment

### Frontend: Vercel
- Free tier
- Automatic deployments from GitHub
- Custom domain support
- SSL included

### Smart Contracts: Stellar Testnet
- Deploy payment contracts
- Update contract IDs in frontend

### Database (Optional): Supabase
- Free PostgreSQL database
- Use the Prisma schema from `api/prisma/schema.prisma`

---

## 📋 Step-by-Step: Complete Deployment

### 1. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Production deployment
vercel --prod
```

### 2. Configure Environment Variables

In Vercel Dashboard:
```
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### 3. Deploy Smart Contracts (Optional)

```bash
# Build contracts
cd contracts/stellar_agent_pay
cargo build --target wasm32-unknown-unknown --release

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

### 4. Update Contract Addresses

Update `.env.contracts` with deployed contract IDs:
```
PAYMENT_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 5. Test Your Deployment

1. Visit your Vercel URL
2. Connect Freighter wallet
3. Create test invoice
4. Execute test payment
5. Verify on Stellar Explorer

---

## 🔧 Custom Domain Setup (Optional)

### Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Netlify:
1. Go to Domain Settings
2. Add custom domain
3. Configure DNS

---

## 🌐 Environment-Specific Configurations

### Development
```env
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### Production (when ready for mainnet)
```env
VITE_STELLAR_NETWORK=mainnet
VITE_STELLAR_HORIZON_URL=https://horizon.stellar.org
```

---

## 📊 Monitoring & Analytics

### Add Analytics (Optional)

1. **Vercel Analytics**
```bash
npm install @vercel/analytics
```

Add to `main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

// In your app
<Analytics />
```

2. **Google Analytics**
Add tracking code to `index.html`

---

## 🔒 Security Checklist

- [ ] Environment variables configured
- [ ] No private keys in code
- [ ] HTTPS enabled (automatic with Vercel/Netlify)
- [ ] CORS configured properly
- [ ] Rate limiting on API endpoints (if using backend)

---

## 🚨 Troubleshooting

### Issue: "Failed to fetch"
**Solution**: Check CORS settings and Horizon URL

### Issue: "Contract not found"
**Solution**: Verify contract is deployed and ID is correct

### Issue: "Wallet connection failed"
**Solution**: Ensure Freighter is installed and on correct network

---

## 📱 Mobile Deployment (Future)

For mobile app deployment:
1. Use React Native or Capacitor
2. Deploy to App Store / Play Store
3. Integrate mobile wallet SDKs

---

## 🎉 Quick Start Commands

**Deploy to Vercel (Fastest)**:
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

**Deploy to Netlify**:
```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Deploy to GitHub Pages**:
```bash
cd frontend
npm install --save-dev gh-pages
npm run deploy
```

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Stellar Docs**: https://developers.stellar.org

---

**Recommended**: Start with Vercel for frontend deployment. It's the easiest and most reliable option for React apps.
