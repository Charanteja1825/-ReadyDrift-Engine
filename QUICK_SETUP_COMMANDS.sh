#!/bin/bash
# 🔐 Gemini API Security Fix - Quick Setup Commands
# Copy and paste these commands to get your secure backend running

echo "=========================================="
echo "🔐 Secure Backend Setup"
echo "=========================================="
echo ""

# Step 1
echo "Step 1️⃣  Creating backend directory..."
mkdir -p backend
cd backend

# Step 2
echo "Step 2️⃣  Initializing Node.js project..."
npm init -y

# Step 3
echo "Step 3️⃣  Installing dependencies..."
npm install express cors dotenv @google/generative-ai

# Step 4
echo "Step 4️⃣  Creating .env file..."
cat > .env << 'EOF'
# Paste your NEW Gemini API key here (from Google Cloud Console)
GEMINI_API_KEY=AIza...your_key_here...
PORT=5000
EOF

echo "Step 5️⃣  Creating server.js from template..."
# Note: You'll need to copy content from BACKEND_SETUP.js
echo "⚠️  IMPORTANT: Copy the content from ../BACKEND_SETUP.js to ./server.js"
echo "   Then update .env with your NEW API key"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "1. Edit .env and replace 'AIza...your_key_here...' with your actual API key"
echo "2. Run: node server.js"
echo "3. In another terminal, run: npm run dev"
echo "4. Visit: http://localhost:3000"
echo ""
echo "🎉 Your API is now secure!"
