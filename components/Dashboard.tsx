
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { BookOpen, Award, Clock, Zap, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    totalExams: 0,
    avgScore: 0,
    studyHoursThisWeek: 0,
    streak: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const s = await db.getDashboardStats(user.id);
      setStats(s);

      const logs = await db.getLogs(user.id);
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const log = logs.find(l => l.date === dateStr);
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          hours: log ? log.hours : 0
        };
      });
      setChartData(last7Days);
    };
    fetchData();
  }, [user.id]);

  const cards = [
    { title: 'Total Exams', value: stats.totalExams, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Average Score', value: `${stats.avgScore}%`, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Study Hours (Week)', value: stats.studyHoursThisWeek, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Prep Streak', value: `${stats.streak} Days`, icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome back, {user.name}! 👋</h1>
        <p className="text-slate-400">Here's your preparation overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className={`${card.bg} p-3 rounded-2xl`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-slate-400 font-medium">{card.title}</h3>
              </div>
              <p className="text-3xl font-bold text-slate-100">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Learning Activity
            </h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-center">
           <h2 className="text-xl font-bold text-slate-100 mb-4 text-center">AI Readiness Score</h2>
           <div className="relative flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-[12px] border-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl font-black text-indigo-500">{stats.avgScore}</span>
                  <p className="text-slate-400 text-sm mt-1">Average</p>
                </div>
              </div>
              <svg className="absolute w-48 h-48 transform -rotate-90">
                <circle 
                  cx="96" cy="96" r="84" 
                  fill="transparent" 
                  stroke="#6366f1" 
                  strokeWidth="12" 
                  strokeDasharray={`${(stats.avgScore / 100) * 527} 527`}
                  strokeLinecap="round"
                />
              </svg>
           </div>
           <p className="text-slate-400 text-sm mt-8 text-center italic">
             "Consistent practice is the key to mastering your technical skills."
           </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
