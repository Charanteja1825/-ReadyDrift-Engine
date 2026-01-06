// Secure API calls to backend - API keys are never exposed to frontend
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function generateSkillGapAnalysisAPI(role: string, skills: string[], time: string) {
  try {
    const response = await fetch(`${API_BASE}/ai/skill-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, skills, time })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Skill gap analysis failed:', error);
    throw error;
  }
}

export async function generateExamAPI(type: string) {
  try {
    const response = await fetch(`${API_BASE}/ai/generate-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Exam generation failed:', error);
    throw error;
  }
}

export async function generateInterviewFeedbackAPI() {
  try {
    const response = await fetch(`${API_BASE}/ai/interview-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Interview feedback generation failed:', error);
    throw error;
  }
}

export async function getExplanationAPI(question: string, answer: string, correctAnswer: string) {
  try {
    const response = await fetch(`${API_BASE}/ai/explanation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, correctAnswer })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Explanation generation failed:', error);
    throw error;
  }
}

export async function validateCodingAPI(question: string, answer: string, correctAnswer?: string) {
  try {
    const response = await fetch(`${API_BASE}/ai/explanation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, correctAnswer, validate: true })
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Code validation failed:', error);
    throw error;
  }
}
