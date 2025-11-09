# Nexar AI Agent - Deployment Guide

## Quick Deploy Options

### Option 1: Render (Recommended - Free Tier Available)

1. **Push code to GitHub** (already done)

2. **Go to [Render Dashboard](https://dashboard.render.com/)**

3. **Create New Web Service**
   - Connect your GitHub repository
   - Select the `stellar-agent-pay` repository
   - Root directory: `ai-agent`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

4. **Set Environment Variables**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   STELLAR_NETWORK=testnet
   PAYMENT_CONTRACT_ID=your_contract_id
   ROUTER_CONTRACT_ID=your_router_contract_id
   PORT=3001
   ```

5. **Deploy!** - Render will auto-deploy on every push to main

**Your API will be available at:** `https://nexar-ai-agent.onrender.com`

---

### Option 2: Railway (Easy & Fast)

1. **Go to [Railway](https://railway.app/)**

2. **New Project → Deploy from GitHub**
   - Select your repository
   - Railway will auto-detect the Node.js app

3. **Set Environment Variables** (same as above)

4. **Deploy!**

**Your API will be available at:** `https://nexar-ai-agent.up.railway.app`

---

### Option 3: Docker (Any Platform)

```bash
# Build the image
cd ai-agent
docker build -t nexar-ai-agent .

# Run locally
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  -e STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org \
  -e STELLAR_NETWORK=testnet \
  nexar-ai-agent

# Or deploy to any cloud platform that supports Docker
```

---

### Option 4: Vercel (Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in the ai-agent directory
3. Follow prompts
4. Set environment variables in Vercel dashboard

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `STELLAR_HORIZON_URL` | Stellar Horizon endpoint | `https://horizon-testnet.stellar.org` |
| `STELLAR_NETWORK` | Network type | `testnet` or `mainnet` |
| `PAYMENT_CONTRACT_ID` | Smart contract ID | `C...` |
| `ROUTER_CONTRACT_ID` | Router contract ID | `C...` |
| `PORT` | Server port (optional) | `3001` |

---

## Update Frontend to Use Deployed Backend

After deployment, update your frontend `.env`:

```env
VITE_AI_AGENT_URL=https://your-deployed-backend.onrender.com
```

---

## Health Check

Test your deployment:
```bash
curl https://your-deployed-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Monitoring

- **Render**: Built-in logs and metrics
- **Railway**: Real-time logs in dashboard
- **Docker**: Use `docker logs <container-id>`

---

## Troubleshooting

### Build fails
- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

### API not responding
- Verify environment variables are set
- Check if PORT is correctly configured
- Review application logs

### CORS errors
- Backend already has CORS enabled
- If issues persist, check frontend URL configuration

---

## Cost Estimates

- **Render Free Tier**: $0/month (sleeps after 15 min inactivity)
- **Railway Free Tier**: $5 credit/month
- **Vercel**: Free for hobby projects
- **Docker on VPS**: $5-10/month (DigitalOcean, Linode)

---

## Production Checklist

- [ ] Set all environment variables
- [ ] Use production Stellar network (mainnet)
- [ ] Enable HTTPS (automatic on Render/Railway)
- [ ] Set up monitoring/alerts
- [ ] Configure rate limiting
- [ ] Add authentication if needed
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling (if needed)

---

## Support

For issues, check:
1. Application logs
2. Environment variables
3. Network connectivity
4. Stellar Horizon status

Need help? Open an issue on GitHub!
