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
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (data) {
        setUser(data as User);
      } else {
        // Fallback for user record not found yet
        setUser({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.email!.split('@')[0],
          role: authUser.user_metadata?.role || 'mentee',
          created_at: authUser.created_at
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Mock login for quick testing/bypass
  const mockLogin = (role: UserRole) => {
    const ids = {
      mentee: '550e8400-e29b-41d4-a716-446655440000',
      mentor: '550e8400-e29b-41d4-a716-446655440001',
      admin: '550e8400-e29b-41d4-a716-446655440002'
    };
    setUser({
      id: ids[role],
      name: 'Test ' + role.charAt(0).toUpperCase() + role.slice(1),
      email: `test-${role}@example.com`,
      role: role,
      created_at: new Date().toISOString()
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage onSelectRole={mockLogin} />} />
          <Route path="/auth/:role" element={<AuthPage />} />
          
          {/* Protected Routes */}
          <Route path="/mentee/*" element={user?.role === 'mentee' ? <Layout><MenteeDashboard /></Layout> : <Navigate to="/" />} />
          <Route path="/mentee/request" element={user?.role === 'mentee' ? <Layout><MenteeRequest /></Layout> : <Navigate to="/" />} />
          <Route path="/mentee/logs" element={user?.role === 'mentee' ? <Layout><MenteeLogs /></Layout> : <Navigate to="/" />} />

          <Route path="/mentor/*" element={user?.role === 'mentor' ? <Layout><MentorDashboard /></Layout> : <Navigate to="/" />} />
          <Route path="/mentor/mentees" element={user?.role === 'mentor' ? <Layout><MentorMentees /></Layout> : <Navigate to="/" />} />
          <Route path="/mentor/log-meeting" element={user?.role === 'mentor' ? <Layout><LogMeeting /></Layout> : <Navigate to="/" />} />
          <Route path="/mentor/logs" element={user?.role === 'mentor' ? <Layout><MentorLogs /></Layout> : <Navigate to="/" />} />

          <Route path="/admin/*" element={user?.role === 'admin' ? <Layout><AdminDashboard /></Layout> : <Navigate to="/" />} />
          <Route path="/admin/pairs" element={user?.role === 'admin' ? <Layout><AdminPairs /></Layout> : <Navigate to="/" />} />
          <Route path="/admin/meetings" element={user?.role === 'admin' ? <Layout><AdminMeetings /></Layout> : <Navigate to="/" />} />
          <Route path="/admin/requests" element={user?.role === 'admin' ? <Layout><AdminRequests /></Layout> : <Navigate to="/" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

function LandingPage({ onSelectRole }: { onSelectRole: (role: UserRole) => void }) {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole, isMock: boolean = false) => {
    if (isMock) {
      onSelectRole(role);
      navigate(`/${role}`);
    } else {
      navigate(`/auth/${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-16">
        <div className="space-y-6">
          <span className="font-label text-xs text-[#7C5E4C] tracking-[0.2em] uppercase">Agaram Foundation</span>
          <h1 className="text-7xl md:text-8xl font-headline font-bold italic text-[#64655A] tracking-tighter pt-[10px]">வழிKaatigal</h1>
          <p className="text-[#66645E] text-xl font-headline italic max-w-lg mx-auto">
            "The Digital Journal of Mentorship. Shaping futures, one interaction at a time."
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Mentee */}
          <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-8 flex-1">
              <span className="font-label text-[10px] text-[#7C5E4C] mb-2 block uppercase tracking-widest text-left">Mentee Portal</span>
              <h3 className="text-2xl font-headline font-bold text-[#1C1C1C] text-left">Mentee Access</h3>
              <p className="text-sm text-[#66645E] mt-4 italic text-left leading-relaxed">Seek guidance and define your career path.</p>
            </div>
            <div className="p-4 bg-[#F8F4EF] border-t border-[#EBE8E0] space-y-2">
              <button onClick={() => handleRoleSelect('mentee')} className="w-full py-3 bg-[#64655A] text-white rounded-sm font-label uppercase text-[10px] tracking-widest hover:bg-[#58594E] transition-all">Sign In / Register</button>
              <button onClick={() => handleRoleSelect('mentee', true)} className="w-full py-2 text-[#7C5E4C] text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all">Quick Bypass</button>
            </div>
          </div>

          {/* Mentor */}
          <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-8 flex-1">
              <span className="font-label text-[10px] text-[#7C5E4C] mb-2 block uppercase tracking-widest text-left">Mentor Portal</span>
              <h3 className="text-2xl font-headline font-bold text-[#1C1C1C] text-left">Mentor Space</h3>
              <p className="text-sm text-[#66645E] mt-4 italic text-left leading-relaxed">Inspire and guide the next generation of students.</p>
            </div>
            <div className="p-4 bg-[#F8F4EF] border-t border-[#EBE8E0] space-y-2">
              <button onClick={() => handleRoleSelect('mentor')} className="w-full py-3 bg-[#64655A] text-white rounded-sm font-label uppercase text-[10px] tracking-widest hover:bg-[#58594E] transition-all">Sign In / Register</button>
              <button onClick={() => handleRoleSelect('mentor', true)} className="w-full py-2 text-[#7C5E4C] text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all">Quick Bypass</button>
            </div>
          </div>

          {/* Admin */}
          <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl overflow-hidden shadow-sm flex flex-col border-b-4 border-b-[#1C1C1C]">
            <div className="p-8 flex-1">
              <span className="font-label text-[10px] text-[#7C5E4C] mb-2 block uppercase tracking-widest text-left">Admin Portal</span>
              <h3 className="text-2xl font-headline font-bold text-[#1C1C1C] text-left">Central Control</h3>
              <p className="text-sm text-[#66645E] mt-4 italic text-left leading-relaxed">Oversee program metrics and orchestration.</p>
            </div>
            <div className="p-4 bg-[#F8F4EF] border-t border-[#EBE8E0] space-y-2">
              <button onClick={() => handleRoleSelect('admin')} className="w-full py-3 bg-[#1C1C1C] text-white rounded-sm font-label uppercase text-[10px] tracking-widest hover:bg-black transition-all">Admin Login</button>
              <button onClick={() => handleRoleSelect('admin', true)} className="w-full py-2 text-[#7C5E4C] text-[10px] uppercase font-bold tracking-widest hover:bg-white transition-all">Central Control Bypass</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

