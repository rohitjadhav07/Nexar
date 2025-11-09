# 🚀 Nexar Deployment Checklist

## Quick Deploy - Backend (AI Agent)

### ✅ Step 1: Deploy to Render (Easiest - 5 minutes)

1. **Go to Render**: https://dashboard.render.com/
2. **Click "New +" → "Web Service"**
3. **Connect GitHub**: Select your `Nexar` repository
4. **Configure**:
   - Name: `nexar-ai-agent`
   - Root Directory: `ai-agent`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free

5. **Add Environment Variables**:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   STELLAR_NETWORK=testnet
   PORT=3001
   ```

6. **Click "Create Web Service"**

7. **Wait 2-3 minutes** for deployment

8. **Copy your backend URL**: `https://nexar-ai-agent.onrender.com`

---

### ✅ Step 2: Update Frontend

1. **Update frontend/.env**:
   ```env
   VITE_AI_AGENT_URL=https://nexar-ai-agent.onrender.com
   ```

2. **Commit and push**:
   ```bash
   git add frontend/.env
   git commit -m "Update backend URL"
   git push origin main
   ```

3. **Vercel will auto-deploy** (if connected)

---

### ✅ Step 3: Test

1. **Health Check**:
   ```bash
   curl https://nexar-ai-agent.onrender.com/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **Test AI Command**:
   ```bash
   curl -X POST https://nexar-ai-agent.onrender.com/api/command \
     -H "Content-Type: application/json" \
     -d '{
       "command": "What is my balance?",
       "userPublicKey": "GXYZ..."
     }'
   ```

3. **Open your frontend** and try the AI assistant!

---

## Alternative: Railway (Also Easy)

```bash
cd ai-agent
npm install -g railway
railway login
railway init
railway up
```

Set environment variables in Railway dashboard.

---

## Alternative: Docker (Any Platform)

```bash
cd ai-agent

# Build
docker build -t nexar-ai-agent .

# Run locally
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  -e STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org \
  -e STELLAR_NETWORK=testnet \
  nexar-ai-agent

# Test
curl http://localhost:3001/health
```

---

## 🎯 Quick Links

- **Render Dashboard**: https://dashboard.render.com/
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Full Deployment Guide**: [ai-agent/DEPLOYMENT.md](./ai-agent/DEPLOYMENT.md)

---

## 🔑 Get API Keys

### Gemini API Key (Free)
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to Render environment variables

### OpenAI API Key (Alternative)
1. Go to: https://platform.openai.com/api-keys
2. Create new key
3. Update code to use OpenAI instead of Gemini

---

## 📊 Monitoring

### Render
- View logs in dashboard
- Auto-restarts on crashes
- Free tier sleeps after 15 min inactivity

### Railway
- Real-time logs
- $5 free credit/month
- Always-on

---

## 🐛 Troubleshooting

### "Build failed"
- Check Node.js version (18+)
- Verify package.json exists
- Check build logs

### "API not responding"
- Verify environment variables
- Check if service is running
- Review application logs

### "CORS errors"
- Backend has CORS enabled
- Check frontend URL configuration

---

## ✅ Production Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend updated with backend URL
- [ ] Environment variables set
- [ ] Health check passing
- [ ] AI commands working
- [ ] HTTPS enabled (automatic)
- [ ] Monitoring set up

---

## 🎉 You're Done!

Your Nexar backend is now live and ready to process AI payment commands!

**Next steps**:
1. Test the AI assistant in your frontend
2. Monitor logs for any issues
3. Share your deployed app!

Need help? Check [DEPLOYMENT.md](./ai-agent/DEPLOYMENT.md) or open an issue!
