#!/bin/bash
# Quick Start Script for Secure Backend Setup
# Run this to quickly get your backend running

echo "🔐 Setting up secure API backend..."
echo ""

# Create backend directory
mkdir -p backend
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm init -y --silent
  npm install express cors dotenv @google/generative-ai --silent
fi

# Create .env file
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file..."
  cat > .env << 'EOF'
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
PORT=5000
EOF
  echo "⚠️  Please update .env with your actual API key!"
fi

# Create server.js if it doesn't exist
if [ ! -f "server.js" ]; then
  echo "📄 Creating server.js from backend template..."
  # Note: You'll need to copy the content from BACKEND_SETUP.js manually
  echo "❌ Please copy BACKEND_SETUP.js content to backend/server.js"
  exit 1
fi

# Start server
echo ""
echo "✅ Setup complete!"
echo "🚀 Starting backend server..."
echo ""
node server.js
