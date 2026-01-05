
import React, { useState, useEffect } from 'react';
import { User, SkillGapReport } from '../types';
import { generateSkillGapAnalysis } from '../services/ai';
import { db } from '../services/db';
import { Search, Loader2, Rocket, Map, Target, Calendar } from 'lucide-react';

interface SkillGapProps {
  user: User;
}

const SkillGap: React.FC<SkillGapProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [report, setReport] = useState<SkillGapReport | null>(null);

  useEffect(() => {
    const fetchLastReport = async () => {
      const reports = await db.getSkillReports(user.id);
      if (reports.length > 0) {
        setReport(reports[reports.length - 1]);
      }
    };
    fetchLastReport();
  }, [user.id]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = currentSkills.split(',').map(s => s.trim());
      const analysisData = await generateSkillGapAnalysis(targetRole, skillsArray, prepTime);
      
      const newReport = await db.saveSkillReport({
        userId: user.id,
        targetRole,
        currentSkills: skillsArray,
        preparationTime: prepTime,
        ...analysisData
      });

      setReport(newReport);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Skill Gap Analysis</h1>
        <p className="text-slate-400 mb-8">AI-driven mapping of your current abilities to your dream role.</p>

        <form onSubmit={handleAnalyze} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Target Role</label>
              <div className="relative">
                <Target className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g., Full Stack Engineer"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Preparation Time</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g., 4 weeks"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-slate-300 font-medium">Current Skills (comma separated)</label>
            <textarea
              placeholder="e.g., JavaScript, React, HTML, CSS"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 h-24"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            Analyze Gap & Generate Path
          </button>
        </form>
      </div>

      {report && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Analysis Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-emerald-400">
              <Target className="w-6 h-6" />
              <h2 className="text-xl font-bold">Skill Analysis</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase mb-3">Required for {report.targetRole}</h3>
                <div className="flex flex-wrap gap-2">
                  {report.analysis.requiredSkills.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm border border-slate-700">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-red-400 text-sm font-bold uppercase mb-3">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {report.analysis.missingSkills.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm border border-red-500/20">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-indigo-400">
              <Map className="w-6 h-6" />
              <h2 className="text-xl font-bold">Personalized Roadmap</h2>
            </div>
            <div className="space-y-6 relative border-l border-slate-800 pl-6 ml-3">
              {report.roadmap.map((phase, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-600/20" />
                  <h4 className="font-bold text-slate-100">{phase.phase} <span className="text-slate-500 font-normal ml-2">({phase.duration})</span></h4>
                  <ul className="mt-2 space-y-1">
                    {phase.topics.map((t, j) => (
                      <li key={j} className="text-sm text-slate-400">• {t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-amber-400">
              <Rocket className="w-6 h-6" />
              <h2 className="text-xl font-bold">Learning Strategies</h2>
            </div>
            <div className="space-y-8">
              {report.strategies.map((strat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-100">{strat.phase}</h4>
                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md border border-amber-500/20">{strat.timeAllocation}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{strat.strategy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGap;
