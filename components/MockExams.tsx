
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Question, ExamResult } from '../types';
import { generateExamAPI } from '../services/api';
import { db } from '../services/db';
// Added Target to the lucide-react imports
import { Play, Loader2, CheckCircle, XCircle, Clock, Keyboard, ShieldCheck, Target } from 'lucide-react';

interface MockExamsProps {
  user: User;
}

const CORE_EXAM_TYPES = ['DSA', 'SQL', 'Computer Networks', 'DBMS', 'Operating Systems'];

// Mapping of interests/skills to exam domains
const INTEREST_TO_EXAM: Record<string, string> = {
  'Frontend': 'Frontend Development',
  'Backend': 'Backend Development',
  'Fullstack': 'Full Stack Development',
  'Data Science': 'Data Science & ML',
  'Machine Learning': 'Data Science & ML',
  'DevOps': 'DevOps & Cloud',
  'SRE': 'System Reliability Engineering',
  'QA': 'Quality Assurance Testing',
  'JavaScript': 'JavaScript Fundamentals',
  'TypeScript': 'TypeScript Advanced',
  'React': 'React & Frontend Frameworks',
  'Node.js': 'Node.js Backend',
  'Python': 'Python Programming',
  'AWS': 'Cloud Computing (AWS)',
  'Docker': 'Containerization & Docker',
  'Kubernetes': 'Kubernetes & Orchestration',
  'System Design': 'System Design',
  'Microservices': 'Microservices Architecture',
  'API Design': 'API Design & REST',
  'Database Design': 'Advanced Database Design',
  'Aptitude': 'Aptitude & Reasoning',
  'Reasoning': 'Aptitude & Reasoning',
  'Quantitative': 'Quantitative Aptitude',
  'Verbal': 'Verbal Ability'
};

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
  const [history, setHistory] = useState<ExamResult[]>([]);

  // Compute available exam types from core + interests/skills
  const availableExamTypes = useMemo(() => {
    const set = new Set(CORE_EXAM_TYPES);
    
    // Add exams from interests
    if (user.interests && Array.isArray(user.interests)) {
      user.interests.forEach(interest => {
        const examType = INTEREST_TO_EXAM[interest];
        if (examType) set.add(examType);
      });
    }
    
    // Add exams from skills
    if (user.skills && Array.isArray(user.skills)) {
      user.skills.forEach(skill => {
        const examType = INTEREST_TO_EXAM[skill];
        if (examType) set.add(examType);
      });
    }
    
    return Array.from(set).sort();
  }, [user.interests, user.skills]);

  // Load previous exams when component mounts or user changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await db.getExamResults(user.id);
        if (mounted) setHistory(h || []);
      } catch (e) {
        console.error('Failed to load exam history', e);
      }
    })();
    return () => { mounted = false; };
  }, [user.id]);
  const [codeValues, setCodeValues] = useState<Record<string, string>>({});
  const [consoleOutputs, setConsoleOutputs] = useState<Record<string, string[]>>({});
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | undefined>>({});

  // Changed NodeJS.Timeout to any to avoid "Cannot find namespace 'NodeJS'" error in browser environments
  const timerRef = useRef<any>(null);

  const startExam = async (type: string) => {
    setLoading(true);
    setExamType(type);
    try {
      const q = await generateExamAPI(type);
      // Normalize questions: ensure each question has an id and valid type
      const normalized = q.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        type: item.type === 'mcq' ? 'mcq' : item.type === 'explanation' ? 'explanation' : 'mcq'
      }));
      // Ensure 8 MCQs + 2 Explanations. Shuffle to vary questions each time.
      const shuffle = <T extends { id?: string }>(arr: T[]) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const allMcqs = shuffle(normalized.filter(i => i.type === 'mcq'));
      const allExplanations = shuffle(normalized.filter(i => i.type === 'explanation'));

      const mcqs = allMcqs.slice(0, 8);
      const explanations = allExplanations.slice(0, 2);

      let combined = [...mcqs, ...explanations];

      // If AI returned fewer than required, fill from normalized list
      if (combined.length < 10) {
        const remaining = shuffle(normalized.filter(i => !combined.find(c => (c.id || '') === (i.id || ''))));
        for (const r of remaining) {
          if (combined.length >= 10) break;
          combined.push(r);
        }
      }

      // final shuffle so order is mixed
      combined = shuffle(combined).slice(0, 10);

      setQuestions(combined);
      setStage('running');
      setStartTime(Date.now());
      setAnswers({});
      setCurrentIndex(0);
      setTypingActivity(0);
      setAiUsageCounter(0);

      // fetch latest history as we start an exam
      const h = await db.getExamResults(user.id);
      setHistory(h);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = () => {
    setTypingActivity(prev => prev + 1);
  };

  // Listen for messages from sandboxed iframes (console output)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'console') return;
      const { id, output } = e.data as { id: string; output: string };
      setConsoleOutputs(prev => ({ ...prev, [id]: [...(prev[id] || []), String(output)] }));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const runUserCode = (id: string, code: string) => {
    // append a run header
    setConsoleOutputs(prev => ({ ...prev, [id]: [...(prev[id] || []), '--- Run started ---'] }));

    // cleanup previous iframe if present
    if (iframeRefs.current[id]) {
      try { iframeRefs.current[id]!.remove(); } catch (e) {}
      delete iframeRefs.current[id];
    }

    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframeRefs.current[id] = iframe;

    const safeCode = (code || '').replace(/<\/script>/gi, '<\\/script>');
    const html = `<!doctype html><html><body><script>
      (function(){
        function send(msg){ parent.postMessage({type:'console', id:'${id}', output: String(msg)}, '*'); }
        console.log = function(){ send(Array.prototype.slice.call(arguments).join(' ')); };
        console.error = console.log;
        console.info = console.log;
        try {
          ${safeCode}
        } catch(e) { send('Error: ' + (e && e.message ? e.message : e)); }
      })();\n<\/script></body></html>`;

    try {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    } catch (e) {
      setConsoleOutputs(prev => ({ ...prev, [id]: [...(prev[id] || []), 'Error launching sandbox: ' + String(e)] }));
    }
  };

  const clearConsole = (id: string) => setConsoleOutputs(prev => ({ ...prev, [id]: [] }));

  const stopUserCode = (id: string) => {
    const f = iframeRefs.current[id];
    if (f) {
      try { f.remove(); } catch (e) {}
      delete iframeRefs.current[id];
    }
    setConsoleOutputs(prev => ({ ...prev, [id]: [...(prev[id] || []), '--- Run stopped ---'] }));
  };

  const submitExam = async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    let correctCount = 0;

    const results: any[] = [];

    for (const q of questions) {
      const userAnswer = (answers[q.id] || '').toString().trim();

      if (q.type === 'explanation') {
        // Validate explanation answers using backend
        try {
          const validation = await (await import('../services/api')).validateCodingAPI(q.question, userAnswer, q.correctAnswer);
          const isCorrect = validation && validation.valid === true;
          if (isCorrect) correctCount++;
          results.push({
            questionId: q.id,
            questionText: q.question,
            correctAnswer: q.correctAnswer,
            questionType: q.type,
            userAnswer,
            isCorrect,
            explanation: validation && validation.feedback ? validation.feedback : q.explanation
          });
        } catch (e) {
          // on error, fallback to marking as incorrect with error message
          results.push({
            questionId: q.id,
            questionText: q.question,
            correctAnswer: q.correctAnswer,
            questionType: q.type,
            userAnswer,
            isCorrect: false,
            explanation: 'Validation error: ' + (e?.message || String(e))
          });
        }
      } else {
        // MCQ: simple string comparison
        const isCorrect = userAnswer.toLowerCase() === (q.correctAnswer || '').toLowerCase();
        if (isCorrect) correctCount++;
        results.push({
          questionId: q.id,
          questionText: q.question,
          correctAnswer: q.correctAnswer,
          questionType: q.type,
          userAnswer,
          isCorrect,
          explanation: q.explanation
        });
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const aiUsagePercent = Math.min(Math.round(aiUsageCounter * 10), 100); // Mock logic

    // Determine weak topics (if question was wrong)
    const weakTopics: string[] = Array.from(new Set(results.filter(r => !r.isCorrect).map(r => r.questionType)));

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

    // refresh history
    const history = await db.getExamResults(user.id);

    setFinalResult(resultData);
    setStage('results');
    // set local history to refreshed list
    setHistory(history);
  };

  if (stage === 'selection') {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500 relative">
        {/* Animated background visuals (CSS-based, accessible via aria-hidden) */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-24 -top-16 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-600 to-pink-600 opacity-20 blur-3xl animate-blob" />
          <div className="absolute -right-24 -bottom-16 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-15 blur-3xl animate-blob animation-delay-2000" />

          {/* Floating SVG accent */}
          <svg className="absolute -top-8 right-8 w-36 h-36 animate-float opacity-40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="12" r="8" fill="#7c3aed" />
            <rect x="34" y="32" width="18" height="10" rx="2" fill="#06b6d4" transform="rotate(-18 34 32)" />
            <path d="M14 46c6-8 18-10 26-6" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Animation styles (inline for component) */}
        <style>{`@keyframes blob { 0%{ transform: translateY(0) scale(1);} 50%{ transform: translateY(-18px) scale(1.04);} 100%{ transform: translateY(0) scale(1);} }
        .animate-blob { animation: blob 7s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 1.8s; }
        @keyframes float { 0%{ transform: translateY(0);} 50%{ transform: translateY(-14px);} 100%{ transform: translateY(0);} }
        .animate-float { animation: float 4.5s ease-in-out infinite; }
        /* Confetti animation uses translateY and rotate for variety */
        @keyframes confettiFall { 0%{ transform: translateY(-10vh) rotate(0deg); opacity:0; } 10%{ opacity:1 } 100%{ transform: translateY(120vh) rotate(360deg); opacity:0.8 } }
        .confetti-piece { position:absolute; width:8px; height:14px; border-radius:2px; opacity:0.9; }
        `}</style>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Technical Mock Exams</h1>
            <p className="text-slate-400">Select a subject to test your core engineering knowledge.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableExamTypes.map((type) => {
            const isCore = CORE_EXAM_TYPES.includes(type);
            return (
              <div key={type} className={`border p-8 rounded-3xl hover:border-indigo-500 transition-all group relative overflow-hidden ${isCore ? 'bg-slate-900' : 'bg-slate-900/80 border-indigo-500/30'}`}>
                {/* background mask */}
                <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-20 blur-3xl pointer-events-none" />

                <div className="bg-indigo-600/10 p-4 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 transition-colors">
                  <Play className="w-8 h-8 text-indigo-500 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{type}</h3>
                {!isCore && <div className="text-xs text-indigo-400 mb-2 font-semibold">Based on your interests</div>}
                <p className="text-slate-400 text-sm mb-6">Foundational concepts and practical coding implementation.</p>
                <button
                  onClick={() => startExam(type)}
                  disabled={loading}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                  {loading && examType === type ? <Loader2 className="animate-spin w-5 h-5" /> : 'Start Mock'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Previous Exams History */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100">Previous Exams</h3>
            <p className="text-sm text-slate-400">{history.length} attempts</p>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No previous exams yet. Take one to build history.</p>
          ) : (
            <ul className="space-y-2">
              {history.slice().reverse().map(h => (
                <li key={h.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                  <div>
                    <div className="text-sm text-slate-300 font-medium">{h.examType}</div>
                    <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold">{h.score}%</div>
                    <button onClick={() => { setFinalResult(h); setStage('results'); }} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">View</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
              <>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-emerald-400 text-sm italic">
                  // Implement your logic below...
                </div>
                <p className="text-sm text-slate-500 mt-2">Tip: Click inside the editor below and type your answer or paste code. Press Tab for indentation.</p>
              </>
            )}
          </div>

          <div className="space-y-3">
            {(q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0) ? (
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
              // For explanation questions: text input area
              <textarea
                name={`answer-${q.id}`}
                aria-label="Answer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-600 h-32"
                placeholder="Write your detailed explanation here..."
                value={answers[q.id] ?? ''}
                onKeyDown={handleKeyPress}
                onChange={(e) => { setAnswers({ ...answers, [q.id]: e.target.value }); handleKeyPress(); }}
                spellCheck={true}
                autoCapitalize="sentences"
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
           {/* Celebratory confetti for good scores (pure CSS + small elements) */}
           {finalResult.score >= 70 && (
             <div aria-hidden className="absolute inset-0 pointer-events-none">
               <div className="absolute inset-0">
                 <span className="confetti-piece" style={{left:'8%', background:'#f97316', transform:'translateY(-20vh)', animation:'confettiFall 2500ms linear 0ms forwards'}} />
                 <span className="confetti-piece" style={{left:'22%', background:'#60a5fa', width:10, height:12, transform:'translateY(-20vh)', animation:'confettiFall 2600ms linear 120ms forwards'}} />
                 <span className="confetti-piece" style={{left:'36%', background:'#34d399', transform:'translateY(-20vh)', animation:'confettiFall 2400ms linear 70ms forwards'}} />
                 <span className="confetti-piece" style={{left:'55%', background:'#f472b6', transform:'translateY(-20vh)', animation:'confettiFall 2800ms linear 220ms forwards'}} />
                 <span className="confetti-piece" style={{left:'72%', background:'#fde68a', transform:'translateY(-20vh)', animation:'confettiFall 3000ms linear 180ms forwards'}} />
               </div>
             </div>
           )}

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
              const questionText = q?.question ?? res.questionText ?? '';
              const correctAnswer = res.correctAnswer || q?.correctAnswer || '';

              // Build platform-specific search links that include the question text
              const qType = res.questionType || q?.type || (res.userAnswer ? 'coding' : 'mcq');
              const buildSearch = (platform: 'leetcode' | 'hackerrank' | 'gfg' | 'tutorialspoint') => {
                const query = encodeURIComponent(questionText);
                switch(platform) {
                  case 'leetcode': return { label: 'LeetCode', url: `https://leetcode.com/problemset/all/?search=${query}` };
                  case 'hackerrank': return { label: 'HackerRank', url: `https://www.hackerrank.com/search?query=${query}` };
                  case 'gfg': return { label: 'GeeksforGeeks', url: `https://www.geeksforgeeks.org/?s=${query}` };
                  case 'tutorialspoint': return { label: 'TutorialsPoint', url: `https://www.tutorialspoint.com/search.php?search=${query}` };
                }
              };

              const suggestions = qType === 'coding' || ['DSA', 'Operating Systems', 'DBMS'].includes(finalResult.examType)
                ? [buildSearch('leetcode'), buildSearch('hackerrank')]
                : [buildSearch('gfg'), buildSearch('tutorialspoint')];

              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-200">Q{i + 1}: {questionText}</h4>
                    {res.isCorrect ? <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" /> : <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />}
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-400 mb-2">Your Answer: <span className={res.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{res.userAnswer}</span></p>
                    <p className="text-slate-300 mb-2">Correct Answer: <span className="font-medium text-emerald-300">{correctAnswer || '—'}</span></p>
                    <div className="bg-indigo-600/10 p-4 rounded-xl border border-indigo-600/20">
                      <p className="text-indigo-400 font-bold mb-1 text-xs uppercase tracking-wider">AI Explanation</p>
                      <p className="text-slate-300 leading-relaxed">{res.explanation}</p>
                    </div>

                    {!res.isCorrect && (
                      <div className="mt-3">
                        <p className="text-slate-400 text-sm mb-2">Try similar problems (question included in the platform search):</p>
                        <div className="flex gap-2">
                          {suggestions.map(s => (
                            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-indigo-300 text-sm underline">{s?.label}</a>
                          ))}
                        </div>
                      </div>
                    )}
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
