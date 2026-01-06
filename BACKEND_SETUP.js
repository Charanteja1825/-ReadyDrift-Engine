/**
 * Backend API Server (Node.js/Express)
 * Place this in a separate backend folder (e.g., backend/server.js)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a backend folder: mkdir backend
 * 2. Navigate: cd backend
 * 3. Initialize: npm init -y
 * 4. Install: npm install express cors dotenv @google/generative-ai
 * 5. Create .env file with: GEMINI_API_KEY=your_key_here
 * 6. Create server.js with the code below
 * 7. Run: node server.js
 * 8. Frontend will call http://localhost:5000/api/*
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Verify API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY not found in .env file!');
  console.error('Please create .env file with: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

console.log('✅ API Key loaded successfully');

// Initialize Gemini AI with API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Skill Gap Analysis
app.post('/api/ai/skill-gap', async (req, res) => {
  try {
    const { role, skills, time } = req.body;
    
    if (!role || !skills || !time) {
      return res.status(400).json({ error: 'Missing required fields: role, skills, time' });
    }

    console.log(`🎯 Analyzing skill gap for ${role}...`);
    
    const prompt = `Analyze career readiness for Role: ${role}. Current Skills: ${skills.join(', ')}. Prep Time: ${time}. Return ONLY valid JSON (no markdown):
{
  "analysis": {
    "requiredSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"]
  },
  "roadmap": [
    {"phase": "Phase 1", "topics": ["topic1"], "duration": "2 weeks"}
  ],
  "strategies": [
    {"phase": "Phase 1", "strategy": "Learn basics", "timeAllocation": "20 hours"}
  ]
}`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    console.log('✅ Analysis generated, parsing...');
    
    // Parse response - handle markdown code blocks
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0];
    }
    
    const result = JSON.parse(jsonText.trim());
    res.json(result);
  } catch (error) {
    console.error('❌ Skill gap error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate Exam
app.post('/api/ai/generate-exam', async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Missing exam type' });
    }

    console.log(`📝 Generating ${type} exam...`);
    
    const prompt = `Generate 5 ${type} interview questions. Return ONLY valid JSON array (no markdown, no code blocks, just JSON):
[
  {
    "type": "mcq",
    "question": "question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "why this is correct"
  },
  ...more questions
]`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    console.log('✅ Exam generated, parsing response...');
    
    // Parse the response - handle potential markdown code blocks
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0];
    }
    
    const questions = JSON.parse(jsonText.trim());
    res.json(questions);
  } catch (error) {
    console.error('❌ Exam generation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Interview Feedback
app.post('/api/ai/interview-feedback', async (req, res) => {
  try {
    console.log('🎤 Generating interview feedback...');
    
    const prompt = `Generate realistic interview feedback with scores and recommendations. Return ONLY valid JSON:
{
  "confidenceScore": 75,
  "stressLevel": 45,
  "clarityScore": 80,
  "feedback": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "tips": ["tip1", "tip2"]
  }
}`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    console.log('✅ Feedback generated, parsing...');
    
    // Parse response - handle markdown code blocks
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0];
    }
    
    const result = JSON.parse(jsonText.trim());
    res.json(result);
  } catch (error) {
    console.error('❌ Interview feedback error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Explanation for questions
app.post('/api/ai/explanation', async (req, res) => {
  try {
    const { question, answer, correctAnswer } = req.body;
    
    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Missing question or correctAnswer' });
    }

    console.log('💡 Generating explanation...');
    
    const prompt = `Question: ${question}\nUser Answer: ${answer}\nCorrect Answer: ${correctAnswer}\nProvide a brief explanation of why the correct answer is right.`;
    
    const response = await model.generateContent(prompt);
    const explanation = response.response.text();
    
    res.json({ explanation });
  } catch (error) {
    console.error('❌ Explanation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Secure API server running on port ${PORT}`);
  console.log(`✅ API Key is protected on backend`);
  console.log(`📍 Base URL: http://localhost:${PORT}/api`);
});
