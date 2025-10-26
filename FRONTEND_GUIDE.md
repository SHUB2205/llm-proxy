# 🎯 Complete Frontend Guide

## 🚀 How to Run

### **Step 1: Start Backend**
```powershell
cd c:\Users\paras\Downloads\llm-proxy\backend
python main.py
```
Backend runs on: **http://localhost:8000**

### **Step 2: Start Frontend**
```powershell
cd c:\Users\paras\Downloads\llm-proxy\frontend
npm run dev
```
Frontend runs on: **http://localhost:3000**

---

## 📊 **All Available Pages**

### **1. Dashboard** (`/`)
- Overview of your LLM usage
- Total requests, flagged requests, cost, latency
- Recent requests list
- **What you see:** Stats cards + recent activity

### **2. FinOps** (`/finops`) ⭐ NEW
- **Complete AI spend visibility**
- Total spend, tokens, calls
- Agent spend breakdown
- Model spend breakdown
- Optimization opportunities
- **This is where you track costs!**

### **3. Prompt Optimizer** (`/optimizer`) ⭐ NEW
- **Analyze prompts before sending**
- Get reliability score
- See issues found
- Get optimized version
- Pre-built templates
- **This prevents hallucinations!**

### **4. Safety Flags** (`/flags`)
- View all detected hallucinations
- Filter by severity
- Resolve flags
- **See what AI got wrong**

### **5. All Requests** (`/runs`)
- List of all API calls
- Click to see details
- View tokens, latency, cost

### **6. Settings** (`/settings`) ⭐ NEW
- **View your proxy API key**
- Copy integration code
- Account information
- Quick links to all features
- **THIS IS WHERE YOU GET YOUR API KEY!**

---

## 🔑 **How to Get Your Proxy Key**

### **After Signup:**
1. You'll see it on the success screen
2. Copy it immediately
3. **Or go to Settings page anytime:** http://localhost:3000/settings

### **If You Already Signed Up:**
1. Go to: http://localhost:3000/settings
2. Your proxy key is displayed there
3. Click "Copy" to copy it

---

## 🎯 **Testing All Features**

### **1. Test FinOps (Spend Tracking)**

```powershell
# Go to: http://localhost:3000/finops
```

**What you'll see:**
- Total spend (currently $0 if no requests yet)
- Agent breakdown
- Model breakdown
- Optimization opportunities

**To populate data:**
- Make some API requests using your proxy key
- Refresh the FinOps page
- See costs appear!

---

### **2. Test Prompt Optimizer**

```powershell
# Go to: http://localhost:3000/optimizer
```

**Try this prompt:**
```
Tell me about AI
```

**Click "Analyze Prompt"**

**You'll see:**
- Reliability score (probably low ~35%)
- Issues found (too vague, missing context)
- Optimized version
- Suggestions for improvement

**Try a better prompt:**
```
Based on the last 5 years of research, list 3 key components of transformer neural networks with brief descriptions. Format as numbered list.
```

**You'll see:**
- Higher reliability score (~85%+)
- Fewer issues
- Better structure

---

### **3. Test Hallucination Detection**

**Make an API request with your proxy key:**

```python
import httpx

response = httpx.post(
    "http://localhost:8000/v1/chat/completions",
    headers={
        "Authorization": "Bearer YOUR_PROXY_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "What was the revenue growth last quarter?"}
        ]
    }
)

print(response.json())
```

**Then go to:** http://localhost:3000/flags

**You'll see:**
- Any hallucinations detected
- Severity level
- What was flagged
- Why it was flagged

---

### **4. Test Settings Page**

```powershell
# Go to: http://localhost:3000/settings
```

**You'll see:**
- ✅ Your email
- ✅ Your proxy API key (with copy button)
- ✅ Integration example code
- ✅ Quick links to all features

---

## 💡 **Complete Workflow**

### **First Time Setup:**

1. **Start both servers:**
   - Backend: `cd backend && python main.py`
   - Frontend: `cd frontend && npm run dev`

2. **Sign up:**
   - Go to: http://localhost:3000/onboard
   - Enter email, company, OpenAI key
   - **COPY YOUR PROXY KEY!**

3. **Go to Settings:**
   - http://localhost:3000/settings
   - See your proxy key anytime

4. **Test Prompt Optimizer:**
   - http://localhost:3000/optimizer
   - Analyze a prompt
   - See optimization suggestions

5. **Make API requests:**
   - Use your proxy key
   - Send requests through the proxy

6. **View Results:**
   - Dashboard: See stats
   - FinOps: See costs
   - Flags: See hallucinations
   - Requests: See all calls

---

## 🎯 **Key Features You Asked About**

### **✅ Proxy Key After Signup**
**Location:** http://localhost:3000/settings
- Always visible
- Copy button
- Integration examples

### **✅ FinOps (Spend Tracking)**
**Location:** http://localhost:3000/finops
- Total spend
- Agent breakdown
- Model breakdown
- Optimization opportunities
- **This is the competitor feature + more!**

### **✅ Hallucination Detection**
**Location:** http://localhost:3000/flags
- All detected hallucinations
- Severity levels
- Automatic flagging
- **This is unique to you!**

### **✅ Prompt Optimization**
**Location:** http://localhost:3000/optimizer
- Analyze prompts
- Get reliability scores
- See optimized versions
- Pre-built templates
- **This is unique to you!**

---

## 📱 **Navigation**

The sidebar shows all pages:
- 📊 Dashboard - Overview
- 💰 FinOps - Spend tracking ⭐
- 🎯 Prompt Optimizer - Optimize prompts ⭐
- 🚨 Safety Flags - Hallucinations
- 📝 All Requests - Request history
- ⚙️ Settings - API key & settings ⭐

---

## 🔧 **Troubleshooting**

### **"Can't see my proxy key"**
- Go to: http://localhost:3000/settings
- It's right there at the top

### **"FinOps page is empty"**
- Make some API requests first
- Data appears after requests are made
- Refresh the page

### **"Optimizer not working"**
- Make sure backend is running
- Check: http://localhost:8000/docs
- Should see API documentation

### **"No data in dashboard"**
- Make API requests using your proxy key
- Data appears in real-time
- Refresh to see updates

---

## 🎉 **Summary**

**You now have:**

✅ **Complete dashboard** with all features
✅ **FinOps page** - Track every dollar (like competitors)
✅ **Prompt Optimizer** - Prevent hallucinations (unique to you)
✅ **Hallucination Detection** - Catch errors (unique to you)
✅ **Settings page** - View proxy key anytime
✅ **Full navigation** - Easy access to everything

**All the features you asked about are now accessible!**

---

## 🚀 **Quick Links**

- **Dashboard:** http://localhost:3000
- **FinOps:** http://localhost:3000/finops
- **Optimizer:** http://localhost:3000/optimizer
- **Flags:** http://localhost:3000/flags
- **Settings:** http://localhost:3000/settings
- **API Docs:** http://localhost:8000/docs

**Your complete platform is ready!** 🎯
