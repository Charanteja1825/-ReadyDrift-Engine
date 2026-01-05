
import React, { useState, useEffect, useRef } from 'react';
import { User, Question, ExamResult } from '../types';
import { generateExam } from '../services/ai';
import { db } from '../services/db';
// Added Target to the lucide-react imports
import { Play, Loader2, CheckCircle, XCircle, Clock, Keyboard, ShieldCheck, Target } from 'lucide-react';

interface MockExamsProps {
  user: User;
}

const EXAM_TYPES = ['DSA', 'SQL', 'Computer Networks', 'DBMS', 'Operating Systems'];

const MockExams: React.FC<MockExamsProps> = ({ user }) => {
  const [stage, setStage] = useState<'selection' | 'running' | 'results'>('selection');
  const [examType, setExamType] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [typingActivity, setTypingActivity] = useState(0);
  const [aiUsageCounter, setAiUsageCounter] = useState(0); // Simulated tracking
  const [finalResult, setFinalResult] = useState<ExamResult | null>(null);

  // Changed NodeJS.Timeout to any to avoid "Cannot find namespace 'NodeJS'" error in browser environments
  const timerRef = useRef<any>(null);

  const startExam = async (type: string) => {
    setLoading(true);
    setExamType(type);
    try {
      const q = await generateExam(type);
      setQuestions(q);
      setStage('running');
      setStartTime(Date.now());
      setAnswers({});
      setCurrentIndex(0);
      setTypingActivity(0);
      setAiUsageCounter(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = () => {
    setTypingActivity(prev => prev + 1);
  };

  const submitExam = async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    let correctCount = 0;
    
    const results = questions.map(q => {
      const isCorrect = answers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase();
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        userAnswer: answers[q.id] || '',
        isCorrect,
        explanation: q.explanation
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const aiUsagePercent = Math.min(Math.round(aiUsageCounter * 10), 100); // Mock logic
    
    // Determine weak topics (if coding question or mcq was wrong)
    const weakTopics = questions.filter((_, i) => !results[i].isCorrect).map(q => q.type);

    const resultData = await db.saveExamResult({
      userId: user.id,
      examType,
      score,
      totalQuestions: questions.length,
      accuracy: score,
      timeSpent,
      aiUsagePercent,
      weakTopics,
      results
    });

    setFinalResult(resultData);
    setStage('results');
  };

  if (stage === 'selection') {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Technical Mock Exams</h1>
        <p className="text-slate-400 mb-10">Select a subject to test your core engineering knowledge.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXAM_TYPES.map((type) => (
            <div key={type} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500 transition-all group">
              <div className="bg-indigo-600/10 p-4 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 transition-colors">
                <Play className="w-8 h-8 text-indigo-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">{type}</h3>
              <p className="text-slate-400 text-sm mb-6">Foundational concepts and practical coding implementation.</p>
              <button
                onClick={() => startExam(type)}
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {loading && examType === type ? <Loader2 className="animate-spin w-5 h-5" /> : 'Start Mock'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'running') {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-slate-800/50 p-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-indigo-400 font-bold">Question {currentIndex + 1} of {questions.length}</span>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              {Math.floor((Date.now() - startTime) / 60000)}m
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-xs text-slate-500">
               <Keyboard className="w-3 h-3" /> {typingActivity}
             </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">{q.question}</h2>
            {q.type === 'coding' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-emerald-400 text-sm italic">
                // Implement your logic below...
              </div>
            )}
          </div>

          <div className="space-y-3">
            {q.options ? (
              q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    answers[q.id] === opt 
                      ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' 
                      : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="mr-3 text-slate-500 font-bold">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))
            ) : (
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600 h-48"
                placeholder="Write your answer or pseudo-code here..."
                value={answers[q.id] || ''}
                onKeyDown={handleKeyPress}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-800/20 border-t border-slate-800 flex justify-between">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="px-6 py-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-0"
          >
            Previous
          </button>
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={submitExam}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              Finish Exam
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'results' && finalResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center relative overflow-hidden">
           <div className="relative z-10">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${finalResult.score >= 70 ? 'bg-emerald-600/20 text-emerald-500' : 'bg-red-600/20 text-red-500'}`}>
              <CheckCircle className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-slate-100 mb-2">Exam Result: {finalResult.score}%</h1>
            <p className="text-slate-400 mb-8">Subject: {finalResult.examType}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Time Spent</p>
                <p className="text-xl font-bold text-slate-100">{Math.floor(finalResult.timeSpent / 60)}m {finalResult.timeSpent % 60}s</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Accuracy</p>
                <p className="text-xl font-bold text-slate-100">{finalResult.accuracy}%</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">AI Dependency</p>
                <p className="text-xl font-bold text-slate-100">{finalResult.aiUsagePercent}%</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Questions</p>
                <p className="text-xl font-bold text-slate-100">{finalResult.totalQuestions}</p>
              </div>
            </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-500" />
              Detailed Explanations
            </h2>
            {finalResult.results.map((res, i) => {
              const q = questions.find(q => q.id === res.questionId);
              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-200">Q{i + 1}: {q?.question}</h4>
                    {res.isCorrect ? <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" /> : <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />}
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-400 mb-2">Your Answer: <span className={res.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{res.userAnswer}</span></p>
                    <div className="bg-indigo-600/10 p-4 rounded-xl border border-indigo-600/20">
                      <p className="text-indigo-400 font-bold mb-1 text-xs uppercase tracking-wider">AI Explanation</p>
                      <p className="text-slate-300 leading-relaxed">{res.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sticky top-8">
               <h3 className="text-xl font-bold text-slate-100 mb-4">Improvement Tips</h3>
               {finalResult.weakTopics.length > 0 ? (
                 <div className="space-y-4">
                   <p className="text-slate-400 text-sm">Focus more on these areas identified in your performance:</p>
                   {finalResult.weakTopics.map((topic, i) => (
                     <div key={i} className="flex items-center gap-3 bg-red-500/10 p-3 rounded-xl text-red-400 border border-red-500/20">
                       <Target className="w-5 h-5" />
                       <span className="font-medium uppercase text-xs">{topic}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-emerald-400 text-sm">Great job! You've mastered these concepts.</p>
               )}
               <button 
                 onClick={() => setStage('selection')}
                 className="w-full mt-8 bg-indigo-600 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-600/20"
               >
                 Back to Selection
               </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MockExams;
