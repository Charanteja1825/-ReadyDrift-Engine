# 🔐 Secure API Setup Guide - Fixing Gemini API Key Leak

## Problem
Your Gemini API key was exposed in the frontend `.env` file, making it vulnerable to:
- **Source code exposure** if repo is public
- **Network requests** showing the key in browser DevTools
- **Third-party compromises** if any npm package is compromised
- **Accidental commits** to version control

## Solution
Move all API calls to a **secure backend server** where the API key is never exposed to clients.

---

## ✅ What We Fixed

### Frontend Side (.env)
```diff
- VITE_GEMINI_API_KEY=AIzaSyAZ15HBiV32Ed8oAK9zlJS8txGLs84zOss
+ VITE_API_BASE_URL=http://localhost:5000/api
```

### New Files Created
1. **`services/api.ts`** - Secure API client for frontend
2. **`BACKEND_SETUP.js`** - Template for backend server
3. **`.env.local`** - LOCAL ONLY (gitignored) - for local development

---

## 🚀 Quick Start (Local Development)

### Step 1: Setup Backend
```bash
# Create backend folder
mkdir backend
cd backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express cors dotenv @google/generative-ai

# Copy the backend code
# Create server.js with contents from BACKEND_SETUP.js
```

### Step 2: Create Backend .env
```bash
# backend/.env
GEMINI_API_KEY=AIzaSyAZ15HBiV32Ed8oAK9zlJS8txGLs84zOss
```

### Step 3: Run Backend
```bash
cd backend
node server.js
# Output: 🚀 Secure API server running on port 5000
```

### Step 4: Update Frontend
The frontend now calls the backend instead of using the API key directly.

---

## 📋 Updated Import Usage

### Before (❌ INSECURE)
```typescript
import { generateSkillGapAnalysis } from '../services/ai';
```

### After (✅ SECURE)
```typescript
import { generateSkillGapAnalysisAPI } from '../services/api';

// Usage
const result = await generateSkillGapAnalysisAPI(role, skills, time);
```

---

## 🔄 Files to Update in Components

Update these components to use the new secure API:

### 1. **SkillGap.tsx**
```diff
- import { generateSkillGapAnalysis } from '../services/ai';
+ import { generateSkillGapAnalysisAPI } from '../services/api';

- const analysis = await generateSkillGapAnalysis(targetRole, skillsArray, prepTime);
+ const analysis = await generateSkillGapAnalysisAPI(targetRole, skillsArray, prepTime);
```

### 2. **MockExams.tsx**
```diff
- import { generateExam, generateInterviewFeedback } from '../services/ai';
+ import { generateExamAPI, generateInterviewFeedbackAPI } from '../services/api';

- const questions = await generateExam(examType);
+ const questions = await generateExamAPI(examType);

- const feedback = await generateInterviewFeedback();
+ const feedback = await generateInterviewFeedbackAPI();
```

### 3. **MockInterviews.tsx**
```diff
- import { generateInterviewFeedback } from '../services/ai';
+ import { generateInterviewFeedbackAPI } from '../services/api';

- const result = await generateInterviewFeedback();
+ const result = await generateInterviewFeedbackAPI();
```

---

## 🌐 Production Deployment

### Option 1: Vercel + Backend Server
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render, Railway, or Heroku
- **Update**: Set `VITE_API_BASE_URL=https://your-backend.com/api`

### Option 2: Full Stack on Single Platform
```bash
# Single server hosts both frontend and backend
# Backend serves API routes + static frontend files
```

### Environment Variables for Production
```bash
# .env (commit to repo - no secrets)
VITE_API_BASE_URL=https://api.yourapp.com

# .env.local (DON'T commit - local only)
VITE_GEMINI_API_KEY=your_key_here

# Backend .env (DON'T commit - server only)
GEMINI_API_KEY=your_key_here
```

---

## ✨ Security Checklist

- [x] API key removed from frontend `.env`
- [x] `.env.local` created and gitignored
- [x] New `services/api.ts` created for secure calls
- [x] Backend template provided (`BACKEND_SETUP.js`)
- [ ] Update all component imports (see above)
- [ ] Test backend locally
- [ ] Deploy backend server
- [ ] Update frontend API URL for production
- [ ] Rotate your API key (as precaution)

---

## 🐛 Troubleshooting

**"Cannot reach API"**
- Ensure backend is running: `node server.js`
- Check `VITE_API_BASE_URL` in `.env`

**"CORS error"**
- Backend has CORS enabled
- If deploying, ensure CORS includes your frontend domain

**"API key not found in backend"**
- Check `backend/.env` has `GEMINI_API_KEY`
- Ensure `process.env.GEMINI_API_KEY` is loaded

---

## 📚 References
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Generative AI Node SDK](https://www.npmjs.com/package/@google/generative-ai)
- [Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Need help?** Review the backend code in `BACKEND_SETUP.js` or ask for specific component updates.
