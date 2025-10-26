# 🎨 How to Run the Frontend

## ⚡ Quick Fix for Your Error

You need to BUILD first, then START:

```powershell
# In the frontend directory
npm run build    # Build the production version
npm start        # Start the production server
```

**OR** use development mode (easier for development):

```powershell
npm run dev      # Runs on http://localhost:3000
```

---

## 📋 Complete Setup (First Time)

### **Step 1: Install Dependencies**

```powershell
cd C:\Users\paras\Downloads\llm-proxy\frontend
npm install
```

This installs all required packages.

---

### **Step 2: Configure Backend URL**

Create `.env.local` file:

```powershell
notepad .env.local
```

Add this:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Save and close.

---

### **Step 3: Choose Your Mode**

#### **Option A: Development Mode (Recommended for Development)**

```powershell
npm run dev
```

**Pros:**
- ✅ Hot reload (changes appear instantly)
- ✅ Better error messages
- ✅ Faster to start
- ✅ No build step needed

**Runs on:** http://localhost:3000

---

#### **Option B: Production Mode**

```powershell
# Build first (takes 1-2 minutes)
npm run build

# Then start
npm start
```

**Pros:**
- ✅ Faster performance
- ✅ Optimized bundle
- ✅ Production-ready

**Runs on:** http://localhost:3000

---

## 🚀 Quick Start Commands

### **Development (Use This for Now)**
```powershell
cd frontend
npm install          # First time only
npm run dev          # Start dev server
```

### **Production**
```powershell
cd frontend
npm install          # First time only
npm run build        # Build
npm start            # Start production server
```

---

## 🎯 What You'll See

Once running, open http://localhost:3000

You should see:
- 📊 Dashboard with analytics
- 🎯 Prompt optimizer interface
- 🔍 Hallucination detection results
- 📈 Usage statistics
- ⚙️ Settings and configuration

---

## 🔧 Troubleshooting

### **Error: "Cannot find module"**
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

### **Error: "Port 3000 already in use"**
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001; npm run dev
```

### **Error: "Backend not responding"**
Make sure backend is running:
```powershell
# In backend directory
cd ..\backend
.\run.ps1
```

### **Error: "Module not found: Can't resolve..."**
```powershell
npm install <missing-package>
```

---

## 📁 Frontend Structure

```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Dashboard pages
│   ├── analytics/         # Analytics pages
│   └── settings/          # Settings pages
├── components/            # React components
│   ├── PromptOptimizer.tsx
│   ├── FlagsList.tsx
│   └── Analytics.tsx
├── lib/                   # Utilities
│   └── api.ts            # API client
├── public/               # Static files
├── .env.local           # Environment variables (create this)
├── package.json         # Dependencies
└── next.config.js       # Next.js config
```

---

## 🎨 Available Scripts

```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter
npm run type-check   # Check TypeScript types
```

---

## 🔗 Connect to Backend

The frontend expects the backend at `http://localhost:8000`

Make sure:
1. ✅ Backend is running (`.\run.ps1` in backend directory)
2. ✅ Backend is on port 8000
3. ✅ `.env.local` has correct API URL

Test backend:
```powershell
curl http://localhost:8000/docs
```

Should return the API documentation page.

---

## 💡 Development Tips

### **1. Use Dev Mode for Development**
```powershell
npm run dev
```
Changes appear instantly!

### **2. Check Browser Console**
Press F12 in browser to see errors

### **3. Check Network Tab**
See API calls in browser DevTools → Network

### **4. Use React DevTools**
Install React DevTools browser extension

---

## 🚀 You're Ready!

**For Development:**
```powershell
# Terminal 1: Backend
cd backend
.\run.ps1

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Then visit:** http://localhost:3000

**Your full-stack platform is now running!** 🎉

---

## 📚 Next Steps

1. **Explore the dashboard** - See all features
2. **Try prompt optimizer** - Test with your prompts
3. **View analytics** - See usage statistics
4. **Configure settings** - Set up your preferences
5. **Customize UI** - Edit components in `components/` directory

---

## 🎯 Common Workflows

### **Workflow 1: Daily Development**
```powershell
# Start backend
cd backend
.\run.ps1

# In new terminal, start frontend
cd frontend
npm run dev

# Edit files, see changes instantly
```

### **Workflow 2: Test Production Build**
```powershell
cd frontend
npm run build
npm start
```

### **Workflow 3: Deploy**
```powershell
# Build optimized version
npm run build

# Deploy .next folder to hosting
# (Vercel, Netlify, etc.)
```

---

## 🎉 Summary

**Your Error:** Tried to run production mode without building
**Solution:** Use `npm run dev` for development OR `npm run build` then `npm start` for production

**Recommended for now:**
```powershell
npm run dev
```

**Your platform is ready to use!** 🚀
