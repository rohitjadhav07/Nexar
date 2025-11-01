# Deploy Nexar from Vercel Dashboard (Easy Way)

## 🎯 Step-by-Step Guide

### 1. Go to Vercel
Visit: https://vercel.com

### 2. Sign In
- Click "Sign Up" or "Log In"
- Choose "Continue with GitHub"
- Authorize Vercel to access your GitHub

### 3. Import Your Project
- Click "Add New..." → "Project"
- Find "Nexar" in your repository list
- Click "Import"

### 4. Configure Project Settings

**Important Settings:**

- **Framework Preset**: Vite
- **Root Directory**: `frontend` ⚠️ **IMPORTANT!**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 5. Add Environment Variables

Click "Environment Variables" and add:

```
Name: VITE_STELLAR_NETWORK
Value: testnet

Name: VITE_STELLAR_HORIZON_URL
Value: https://horizon-testnet.stellar.org
```

### 6. Deploy!
- Click "Deploy"
- Wait 2-3 minutes
- Your app will be live! 🎉

### 7. Get Your URL
After deployment completes, you'll get a URL like:
```
https://nexar-xyz123.vercel.app
```

---

## ✅ Post-Deployment Checklist

1. **Visit your live URL**
2. **Test wallet connection** - Connect Freighter
3. **Create test invoice** - Make sure it works
4. **Test payment** - Execute a real payment
5. **Check Stellar Explorer** - Verify transaction

---

## 🔧 If You Need to Update

### Update Environment Variables:
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add/Edit variables
4. Redeploy

### Redeploy:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

Or just push to GitHub - auto-deploys!

---

## 🎨 Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your domain (e.g., nexar.yourdomain.com)
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

---

## 📊 Monitor Your App

- **Analytics**: Settings → Analytics (enable)
- **Logs**: Deployments → Click deployment → Logs
- **Performance**: Automatically monitored

---

## 🚨 Common Issues

### Issue: Build fails
**Solution**: Make sure Root Directory is set to `frontend`

### Issue: Environment variables not working
**Solution**: Redeploy after adding variables

### Issue: 404 on routes
**Solution**: Already configured in vercel.json (rewrites)

---

## 🎉 You're Done!

Your Nexar payment app is now live on the internet!

Share your URL:
```
https://your-nexar-app.vercel.app
```

---

## 📱 Next Steps

1. **Share with friends** - Let them test payments
2. **Add to README** - Update GitHub with live demo link
3. **Deploy contracts** - When ready for production
4. **Custom domain** - Make it professional

---

**Need help?** Check Vercel docs: https://vercel.com/docs
