# 🎯 Step-by-Step Fix

## Current Problem
```
POST http://localhost:5000/api/ai/generate-exam 500 (Internal Server Error)
```

## Solution in 3 Steps

### 📋 Step 1: Copy Fixed Backend Code

Open your terminal in the project root:

```bash
cd backend
cp ../BACKEND_SETUP.js server.js
```

This copies the **fixed** backend code to your server.js file.

---

### 🔄 Step 2: Restart Backend Server

In the terminal where backend is running:
- Press **Ctrl+C** to stop it
- Run the command:

```bash
node server.js
```

**Expected output:**
```
✅ API Key loaded successfully
🚀 Secure API server running on port 5000
✅ API Key is protected on backend
📍 Base URL: http://localhost:5000/api
```

If you see this, backend is fixed! ✅

---

### ✅ Step 3: Test in Frontend

1. Go to http://localhost:3000
2. Click: **MockExams**
3. Click: **Select an exam type** (e.g., "DSA")
4. Click: **Start Exam**

**Expected result:**
- Exam questions load successfully ✅
- No 500 error ✅
- Can answer questions ✅

---

## 🔍 If It Still Doesn't Work

### Check 1: Is Backend Running?
```bash
curl http://localhost:5000/health
# Should respond with: {"status":"ok"}
```

### Check 2: Is API Key Set?
```bash
cat backend/.env
# Should show: GEMINI_API_KEY=AIza...
```

### Check 3: Is Port 5000 Available?
```bash
# Check if something else is using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows
```

### Check 4: Look at Backend Logs
In the terminal running `node server.js`, look for error messages

---

## 🎉 Success Indicators

After restart, you should see:
- ✅ Backend starts without errors
- ✅ Can generate exams
- ✅ Can complete MockExams
- ✅ Can analyze skills
- ✅ Can do mock interviews

---

## 📖 For More Details

See: [BACKEND_500_ERROR_FIX.md](./BACKEND_500_ERROR_FIX.md)

---

**That's it! Should take 2-3 minutes total.** ⏱️
