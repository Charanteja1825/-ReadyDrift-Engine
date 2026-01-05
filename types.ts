
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SkillGapReport {
  id: string;
  userId: string;
  targetRole: string;
  currentSkills: string[];
  preparationTime: string;
  analysis: {
    requiredSkills: string[];
    missingSkills: string[];
  };
  roadmap: {
    phase: string;
    topics: string[];
    duration: string;
  }[];
  strategies: {
    phase: string;
    strategy: string;
    timeAllocation: string;
  }[];
  createdAt: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  examType: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent: number; // in seconds
  aiUsagePercent: number;
  weakTopics: string[];
  results: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  confidenceScore: number;
  stressLevel: number;
  clarityScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    tips: string[];
  };
  createdAt: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  hours: number;
  date: string;
}
