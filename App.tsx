
import React, { useState, useEffect } from 'react';
import { User } from './types';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SkillGap from './components/SkillGap';
import MockExams from './components/MockExams';
import MockInterviews from './components/MockInterviews';
import DriftAnalyzer from './components/DriftAnalyzer';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('cr_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('cr_current_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cr_current_user');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'skill-gap':
        return <SkillGap user={user} />;
      case 'mock-exams':
        return <MockExams user={user} />;
      case 'mock-interviews':
        return <MockInterviews user={user} />;
      case 'drift-analyzer':
        return <DriftAnalyzer user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        onLogout={handleLogout} 
      />
      <main className="pl-64 min-h-screen">
        <div className="p-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
