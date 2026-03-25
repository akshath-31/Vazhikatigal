import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { User, UserRole } from './types';
import { Layout } from './components/Layout';
import { AuthPage } from './components/auth/AuthPage';

// Portals
import { MenteeDashboard } from './components/mentee/MenteeDashboard';
import { MenteeRequest } from './components/mentee/MenteeRequest';
import { MenteeLogs } from './components/mentee/MenteeLogs';

import { MentorDashboard } from './components/mentor/MentorDashboard';
import { MentorMentees } from './components/mentor/MentorMentees';
import { LogMeeting } from './components/mentor/LogMeeting';
import { MentorLogs } from './components/mentor/MentorLogs';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminPairs } from './components/admin/AdminPairs';
import { AdminMeetings } from './components/admin/AdminMeetings';
import { AdminRequests } from './components/admin/AdminRequests';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // No loading since we mock it

  // Function to simulate login with a specific role for testing
  const mockLogin = (role: UserRole) => {
    setUser({
      id: 'mock-id',
      name: 'Test ' + role.charAt(0).toUpperCase() + role.slice(1),
      email: 'test@example.com',
      role: role,
      created_at: new Date().toISOString()
    });
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage onSelectRole={mockLogin} />} />
          
          {/* Mentee Portal */}
          <Route path="/mentee/*" element={<Layout><MenteeDashboard /></Layout>} />
          <Route path="/mentee/request" element={<Layout><MenteeRequest /></Layout>} />
          <Route path="/mentee/logs" element={<Layout><MenteeLogs /></Layout>} />

          {/* Mentor Portal */}
          <Route path="/mentor/*" element={<Layout><MentorDashboard /></Layout>} />
          <Route path="/mentor/mentees" element={<Layout><MentorMentees /></Layout>} />
          <Route path="/mentor/log-meeting" element={<Layout><LogMeeting /></Layout>} />
          <Route path="/mentor/logs" element={<Layout><MentorLogs /></Layout>} />

          {/* Admin Portal */}
          <Route path="/admin/*" element={<Layout><AdminDashboard /></Layout>} />
          <Route path="/admin/pairs" element={<Layout><AdminPairs /></Layout>} />
          <Route path="/admin/meetings" element={<Layout><AdminMeetings /></Layout>} />
          <Route path="/admin/requests" element={<Layout><AdminRequests /></Layout>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

function LandingPage({ onSelectRole }: { onSelectRole: (role: UserRole) => void }) {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    onSelectRole(role);
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-16">
        <div className="space-y-6">
          <span className="font-label text-xs text-[#7C5E4C] tracking-[0.2em] uppercase">Agaram Foundation</span>
          <h1 className="text-7xl md:text-8xl font-headline font-bold italic text-[#64655A] tracking-tighter">Vazhikatigal</h1>
          <p className="text-[#66645E] text-xl font-headline italic max-w-lg mx-auto">
            "The Digital Journal of Mentorship. Shaping futures, one interaction at a time."
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
          <button
            onClick={() => handleRoleSelect('mentee')}
            className="group p-8 bg-[#FFFFFF] border border-[#EBE8E0] hover:border-[#64655A] rounded-xl transition-all text-left shadow-sm hover:shadow-md"
          >
            <span className="font-label text-[10px] text-[#7C5E4C] mb-2 block">Portal One</span>
            <div className="text-2xl font-headline font-bold text-[#1C1C1C] group-hover:text-[#64655A] transition-colors">I am a Mentee</div>
            <p className="text-sm text-[#66645E] mt-2 italic">I seek guidance and growth.</p>
          </button>

          <button
            onClick={() => handleRoleSelect('mentor')}
            className="group p-8 bg-[#FFFFFF] border border-[#EBE8E0] hover:border-[#64655A] rounded-xl transition-all text-left shadow-sm hover:shadow-md"
          >
            <span className="font-label text-[10px] text-[#7C5E4C] mb-2 block">Portal Two</span>
            <div className="text-2xl font-headline font-bold text-[#1C1C1C] group-hover:text-[#64655A] transition-colors">I am a Mentor</div>
            <p className="text-sm text-[#66645E] mt-2 italic">I wish to guide the next generation.</p>
          </button>
        </div>

        <button
          onClick={() => handleRoleSelect('admin')}
          className="text-[#7C5E4C] hover:text-[#64655A] text-sm font-label transition-colors border-b border-transparent hover:border-[#64655A]"
        >
          Administrator Access
        </button>
      </div>
    </div>
  );
}

