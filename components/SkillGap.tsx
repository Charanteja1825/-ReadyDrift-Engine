
import React, { useState, useEffect } from 'react';
import { User, SkillGapReport } from '../types';
import { generateSkillGapAnalysisAPI } from '../services/api';
import { db } from '../services/db';
import { Search, Loader2, Rocket, Map, Target, Calendar } from 'lucide-react';

interface SkillGapProps {
  user: User;
}

const SkillGap: React.FC<SkillGapProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [report, setReport] = useState<SkillGapReport | null>(null);
  const [reports, setReports] = useState<SkillGapReport[]>([]);

  const IMPORTANT_ROLES = [
    'Full Stack Engineer',
    'Backend Engineer',
    'Frontend Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps / SRE'
  ];

  useEffect(() => {
    const fetchReports = async () => {
      const r = await db.getSkillReports(user.id);
      setReports(r);
      if (r.length > 0) {
        setReport(r[r.length - 1]);
      }
    };
    fetchReports();
  }, [user.id]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    // choose custom role if provided else selected role
    const role = (customRole || targetRole || '').trim();
    if (!role) {
      alert('Please choose a target role or type one');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = currentSkills.split(',').map(s => s.trim()).filter(Boolean);
      const analysisData = await generateSkillGapAnalysisAPI(role, skillsArray, prepTime);

      const newReport = await db.saveSkillReport({
        userId: user.id,
        targetRole: role,
        currentSkills: skillsArray,
        preparationTime: prepTime,
        ...analysisData
      });

      // update local lists so history shows the new item immediately
      setReport(newReport);
      setReports(prev => [...prev, newReport]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Skill Gap Analysis</h1>
        <p className="text-slate-600 mb-8">AI-driven mapping of your current abilities to your dream role.</p>

        <form onSubmit={handleAnalyze} className="bg-white border border-gray-300 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-slate-900 font-medium">Target Role</label>
              <div className="relative">
                <Target className="absolute left-3 top-3.5 w-5 h-5 text-slate-600" />
                <input
                  type="text"
                  placeholder="e.g., Full Stack Engineer"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={customRole || targetRole}
                  onChange={(e) => { setCustomRole(e.target.value); if (e.target.value) setTargetRole(''); }}
                />
                <p className="text-xs text-slate-600 mt-2">Choose a suggested role below or type your own. Typed role will take precedence.</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {IMPORTANT_ROLES.map(r => (
                    <button key={r} type="button" onClick={() => { setTargetRole(r); setCustomRole(''); }} className={`px-3 py-1 rounded-full text-sm ${targetRole === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-900'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-900 font-medium">Preparation Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-600" />
                <input
                  type="text"
                  placeholder="e.g., 4 weeks"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-slate-900 font-medium">Current Skills (comma separated)</label>
            <textarea
              placeholder="e.g., JavaScript, React, HTML, CSS"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 h-24"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            Analyze Gap & Generate Path
          </button>
        </form>
      </div>

      {report && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Analysis Card */}
          <div className="bg-white border border-gray-300 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-emerald-700">
              <Target className="w-6 h-6" />
              <h2 className="text-xl font-bold">Skill Analysis</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-slate-600 text-sm font-bold uppercase mb-3">Required for {report.targetRole}</h3>
                <div className="flex flex-wrap gap-2">
                  {report.analysis.requiredSkills.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-slate-900 rounded-full text-sm border border-gray-300">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-red-700 text-sm font-bold uppercase mb-3">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {report.analysis.missingSkills.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-300">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap Card */}
          <div className="bg-white border border-gray-300 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-blue-700">
              <Map className="w-6 h-6" />
              <h2 className="text-xl font-bold">Personalized Roadmap</h2>
            </div>
            <div className="space-y-6 relative border-l border-gray-300 pl-6 ml-3">
              {report.roadmap.map((phase, i) => {
                const deadlineDate = phase.deadline ? new Date(phase.deadline) : null;
                const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                const isNear = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
                const isOverdue = daysLeft !== null && daysLeft < 0;

                return (
                  <div key={i} className={`relative ${isNear ? 'bg-amber-50 p-4 rounded-xl border border-amber-200 -mx-4' : ''} ${isOverdue ? 'bg-red-50 p-4 rounded-xl border border-red-200 -mx-4' : ''}`}>
                    <div className={`absolute ${isNear || isOverdue ? '-left-[15px]' : '-left-[31px]'} top-1.5 w-3 h-3 rounded-full ${isOverdue ? 'bg-red-600 ring-red-100' : isNear ? 'bg-amber-600 ring-amber-100' : 'bg-blue-600 ring-blue-100'} ring-4`} />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {phase.phase}
                          {isNear && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">Due Soon</span>}
                          {isOverdue && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">Overdue</span>}
                        </h4>
                        <span className="text-slate-600 font-normal text-sm block mt-1">Estimates: {phase.duration}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 text-slate-600"
                            value={phase.deadline || ''}
                            onChange={async (e) => {
                              const newDeadline = e.target.value;
                              // Create immutable copy
                              const updatedRoadmap = [...report.roadmap];
                              updatedRoadmap[i] = { ...updatedRoadmap[i], deadline: newDeadline };
                              const updatedReport = { ...report, roadmap: updatedRoadmap };

                              setReport(updatedReport);
                              // Update in local list as well
                              setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
                              // Persist
                              await db.updateSkillReport(updatedReport);
                            }}
                          />
                          <button
                            onClick={() => {
                              if (!phase.deadline) {
                                alert('Please set a deadline date first!');
                                return;
                              }
                              // Check for existing reminder to avoid duplicates? 
                              // For simplicity, just add.
                              if ('Notification' in window && Notification.permission !== 'granted') {
                                Notification.requestPermission();
                              }

                              const reminders = JSON.parse(localStorage.getItem(`reminders_${user.id}`) || '[]');
                              const newReminder = {
                                id: Date.now().toString(),
                                userId: user.id,
                                title: `Finish ${phase.phase} - Skill Gap`,
                                time: '09:00',
                                days: [],
                                date: phase.deadline,
                                enabled: true,
                                createdAt: new Date().toISOString()
                              };

                              localStorage.setItem(`reminders_${user.id}`, JSON.stringify([...reminders, newReminder]));
                              alert(`✅ Reminder set for ${phase.deadline} at 9:00 AM!`);
                            }}
                            title="Set Reminder"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Search className="w-4 h-4 hidden" /> {/* Dummy hidden icon to keep import valid if needed, but better to import Bell */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1">
                      {phase.topics.map((t, j) => (
                        <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>

                    {deadlineDate && (
                      <div className={`mt-3 text-xs flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-medium' : isNear ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? `Overdue by ${Math.abs(daysLeft!)} days` : `Deadline: ${deadlineDate.toLocaleDateString()}`}
                        {isNear && ` (${daysLeft} days left)`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy Card */}
          <div className="bg-white border border-gray-300 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-amber-700">
              <Rocket className="w-6 h-6" />
              <h2 className="text-xl font-bold">Learning Strategies</h2>
            </div>
            <div className="space-y-8">
              {report.strategies.map((strat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900">{strat.phase}</h4>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-300">{strat.timeAllocation}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{strat.strategy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="max-w-6xl mx-auto mt-4">
        <div className="bg-white border border-gray-300 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">History of Analyses</h3>
            <p className="text-sm text-slate-600">{reports.length} total</p>
          </div>

          {reports.length === 0 ? (
            <p className="text-sm text-slate-600">No previous analyses yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...reports].slice().reverse().map(r => (
                <li key={r.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <div className="text-sm text-slate-900 font-medium">{r.targetRole}</div>
                    <div className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setReport(r)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">View</button>
                    <button onClick={() => { setReports(prev => prev.filter(x => x.id !== r.id)); /* optional delete from backend later */ }} className="px-3 py-1 rounded border border-gray-300 text-slate-900 text-sm">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
};

export default SkillGap;
