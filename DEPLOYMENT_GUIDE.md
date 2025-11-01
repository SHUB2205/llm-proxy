# 🚀 Deployment Guide - Free Hosting

This guide will help you deploy both the frontend and backend for **FREE**.

## 📋 Prerequisites

1. GitHub account
2. Vercel account (sign up with GitHub at vercel.com)
3. Render account (sign up with GitHub at render.com)
4. Supabase account (for database - supabase.com)

---

## 🗄️ Step 1: Set Up Database (Supabase - Free)

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Name: `llm-proxy-db`
4. Database Password: (save this!)
5. Region: Choose closest to you
6. Click "Create new project"

### 1.2 Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Open `backend/schema.sql` from your project
3. Copy and paste the entire SQL into the editor
4. Click "Run"
5. Repeat for `backend/schema_ai_finops.sql`
6. Repeat for `backend/schema_enterprise.sql`

### 1.3 Get Connection Details
1. Go to **Settings** → **Database**
2. Copy the **Connection String** (URI mode)
3. Save this as `SUPABASE_URL` (format: `postgresql://...`)
4. Go to **Settings** → **API**
5. Copy the **anon/public** key
6. Save this as `SUPABASE_KEY`

---

## 🔧 Step 2: Deploy Backend (Render - Free)

### 2.1 Push Code to GitHub
```bash
cd llm-proxy
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2.2 Create Render Web Service
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `llm-proxy` repository

### 2.3 Configure Service
**Basic Settings:**
- **Name**: `llm-proxy-backend`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Select **Free** tier

### 2.4 Add Environment Variables
Click "Advanced" → "Add Environment Variable":

```
SUPABASE_URL=your_supabase_connection_string_from_step_1.3
SUPABASE_KEY=your_supabase_anon_key_from_step_1.3
OPENAI_API_KEY=your_openai_api_key
PYTHON_VERSION=3.11.0
```

### 2.5 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Once deployed, copy the URL (e.g., `https://llm-proxy-backend.onrender.com`)
4. **Save this URL** - you'll need it for frontend!

---

## 🎨 Step 3: Deploy Frontend (Vercel - Free)

### 3.1 Create Vercel Project
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the `llm-proxy` repository

### 3.2 Configure Project
**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `frontend`

**Build Settings:**
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

### 3.3 Add Environment Variables
Click "Environment Variables":

```
NEXT_PUBLIC_API_URL=https://llm-proxy-backend.onrender.com
```
(Use the URL from Step 2.5)

### 3.4 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Once deployed, you'll get a URL like `https://llm-proxy.vercel.app`

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend
Visit: `https://your-backend-url.onrender.com/docs`
- You should see the FastAPI Swagger documentation

### 4.2 Test Frontend
1. Visit your Vercel URL
2. You should see the landing page
3. Click "Get Started" → Register
4. After registration, you should see the dashboard

### 4.3 Test Full Flow
1. Register a new account
2. Copy your API key from settings
3. Make a test API call:

```python
import httpx

response = httpx.post(
    "https://your-backend-url.onrender.com/v1/chat/completions",
    headers={
        "Authorization": "Bearer your_proxy_key",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)
print(response.json())
```

---

## 🎯 Important Notes

### Free Tier Limitations

**Render (Backend):**
- ⚠️ **Spins down after 15 minutes of inactivity**
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month free (enough for 24/7 if only one service)
- 512 MB RAM, 0.1 CPU

**Vercel (Frontend):**
- ✅ No sleep/wake issues
- 100 GB bandwidth/month
- Unlimited requests
- Fast global CDN

**Supabase (Database):**
- 500 MB database storage
- 2 GB bandwidth/month
- Pauses after 1 week of inactivity (free tier)

### Performance Tips

1. **Keep Backend Awake:**
   - Use a free uptime monitoring service (e.g., UptimeRobot)
   - Ping your backend every 10 minutes

2. **Optimize Cold Starts:**
   - Backend cold start is ~30 seconds
   - Consider upgrading to Render's paid tier ($7/month) for always-on

3. **Database Connection:**
   - Supabase has connection pooling built-in
   - No additional configuration needed

---

## 🔄 Updating Your Deployment

### Update Backend
```bash
git add backend/
git commit -m "Update backend"
git push origin main
```
Render will auto-deploy in ~5 minutes

### Update Frontend
```bash
git add frontend/
git commit -m "Update frontend"
git push origin main
```
Vercel will auto-deploy in ~2 minutes

---

## 🐛 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs: Dashboard → Logs
- Verify environment variables are set
- Check database connection string

**"Module not found"**
- Ensure all dependencies are in `requirements.txt`
- Check build logs for errors

### Frontend Issues

**"Failed to fetch"**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Open browser console for errors

**"Page not found"**
- Verify root directory is set to `frontend`
- Check build logs in Vercel

### Database Issues

**"Connection refused"**
- Verify Supabase project is active
- Check connection string format
- Ensure database schema is created

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Upgrade |
|---------|-----------|--------------|
| **Vercel** | Free forever | $20/month (Pro) |
| **Render** | Free (with sleep) | $7/month (always-on) |
| **Supabase** | 500MB DB | $25/month (Pro) |
| **Total** | **$0/month** | $52/month (all paid) |

---

## 🎉 You're Live!

Your LLM Observability Platform is now deployed and accessible worldwide!

**Frontend:** `https://your-app.vercel.app`
**Backend:** `https://your-backend.onrender.com`
**Database:** Supabase (managed)

Share your landing page URL with users and start monitoring LLM requests! 🚀
