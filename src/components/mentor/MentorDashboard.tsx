import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MentorProfile, MenteeProfile, Meeting } from '../../types';
import { OnboardingAgent } from './OnboardingAgent';
import { Users, ClipboardList, TrendingUp, AlertCircle, ArrowUpRight, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MentorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [matchRequests, setMatchRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();

    // Poll for new match requests every 10s
    const interval = setInterval(() => {
      if (profile) fetchMatchRequests(profile.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [user, profile?.id]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setProfile(data as MentorProfile | null);
    setLoading(false);

    if (data) {
      fetchMenteesAndMeetings(data.id);
      fetchMatchRequests(data.id);
    }
  };

  const fetchMatchRequests = async (profileId: string) => {
    // DIAGNOSTIC: Fetch EVERYTHING first to see what's in the table
    const { data: allLogs } = await supabase.from('match_logs').select('*');
    console.log("FE DIAGNOSTIC: ALL MATCH LOGS IN DB", allLogs);

    // Simplify query for robustness
    const { data: logs, error: logsError } = await supabase
      .from('match_logs')
      .select('*')
      .eq('matched_mentor_id', profileId)
      .order('matched_at', { ascending: false });

    if (logsError) {
      console.error("Logs error:", logsError);
      return;
    }

    if (logs && logs.length > 0) {
      // Fetch mentee details for these logs
      const menteeIds = logs.map(l => l.mentee_id);
      const [{ data: profiles }, { data: usersData }] = await Promise.all([
        supabase.from('mentee_profiles').select('*').in('user_id', menteeIds),
        supabase.from('users').select('id, name').in('id', menteeIds)
      ]);

      if (profiles && usersData) {
        const enriched = logs.map(log => {
          const mProfile = profiles.find(p => p.user_id === log.mentee_id);
          const uData = usersData.find(u => u.id === log.mentee_id);
          return {
            ...log,
            mentee_profiles: mProfile,
            users: uData
          };
        }).filter(log => log.mentee_profiles && !log.mentee_profiles.assigned_mentor_id);
        
        setMatchRequests(enriched);
      }
    } else {
      setMatchRequests([]);
    }
  };

  const fetchMenteesAndMeetings = async (profileId: string) => {
    const [{ data: menteesData }, { data: meetingsData }] = await Promise.all([
      supabase.from('mentee_profiles').select('*, users(name)').eq('assigned_mentor_id', profileId),
      supabase.from('meetings').select('*').eq('mentor_id', profileId),
    ]);
    if (menteesData) {
      console.log("FE FETCHED MENTEES for profile", profileId, menteesData);
      setMentees(menteesData as any[]);
    }
    if (meetingsData) setMeetings(meetingsData as Meeting[]);
  };

  if (loading) return null;

  if (!profile || !profile.onboarding_complete) {
    return <OnboardingAgent onComplete={() => window.location.reload()} />;
  }

  const avgScore = meetings.length > 0
    ? Math.round(meetings.reduce((acc, m) => acc + (m.ai_score || 0), 0) / meetings.length)
    : 0;

  const handleAcceptMatch = async (logId: string, menteeId: string) => {
    if (!profile) return;
    setProcessingId(logId);
    try {
      // 1. Assign mentor
      await supabase
        .from('mentee_profiles')
        .update({ assigned_mentor_id: profile.id })
        .eq('user_id', menteeId);

      // 2. Update request status
      await supabase
        .from('mentor_requests')
        .update({ status: 'matched' })
        .eq('mentee_id', menteeId);

      // 3. Refresh
      await fetchProfile();
    } catch (err) {
      console.error("Accept error:", err);
    }
    setProcessingId(null);
  };

  const simulateMatch = async () => {
    if (!profile) {
      alert("Error: Mentor profile not loaded yet. Please wait a moment or refresh.");
      return;
    }
    
    setIsSimulating(true);
    console.log("SIMULATION STARTING for mentor", profile.id);
    
    try {
      // 1. Check for any existing mentee that isn't matched yet to avoid key errors
      const { data: existingMentees } = await supabase.from('mentee_profiles').select('user_id').limit(1);
      const targetMenteeId = existingMentees?.[0]?.user_id || `demo-st-${Math.random().toString(36).substr(2, 4)}`;

      // 2. Try to create a record only in match_logs first (most important for the sidebar)
      const { error: logError } = await supabase.from('match_logs').insert({
        mentee_id: targetMenteeId,
        matched_mentor_id: profile.id,
        match_reason: "DEMO: High alignment detected in career goals and language. This is a simulation showing the Lyzr AI flow.",
        matched_at: new Date().toISOString()
      });

      if (logError) {
        console.error("SIM LOG ERROR", logError);
        alert(`Insertion failed: ${logError.message}`);
      } else {
        alert("Success! A new match request has been generated for you.");
        await fetchMatchRequests(profile.id);
      }
    } catch (err: any) {
      console.error("Simulation error caught:", err);
      alert(`Simulation Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-24">
      <header className="max-w-3xl flex justify-between items-start">
        <div>
          <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Mentor Dashboard</span>
          <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
            Welcome back, Mentor. Your guidance is shaping the future of <span className="italic text-[#64655A]">Agaram Foundation</span>.
          </h1>
          <p className="font-body text-lg text-[#64645E] leading-relaxed">
            You have {mentees.length} active mentees. Your current average AI quality score is {avgScore}%.
          </p>
        </div>
        <button 
          onClick={simulateMatch}
          disabled={isSimulating}
          className="px-6 py-3 border border-dashed border-[#64655A]/30 text-[#64655A] font-medium rounded-lg text-xs uppercase tracking-widest hover:bg-[#64655A]/5 transition-all flex items-center gap-2"
        >
          {isSimulating ? <div className="animate-spin h-3 w-3 border-t-2 border-[#64655A]" /> : <Sparkles size={14} />}
          Simulate Demo Match
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border-l-4 border-[#64655A]">
          <Users className="text-[#64655A] mb-4" size={24} />
          <h3 className="font-label text-xs text-[#66645E]">Active Mentees</h3>
          <p className="font-headline text-4xl mt-2 text-[#1C1C1C]">{mentees.length}</p>
        </div>
        <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border-l-4 border-[#7C5E4C]">
          <ClipboardList className="text-[#7C5E4C] mb-4" size={24} />
          <h3 className="font-label text-xs text-[#66645E]">Total Sessions</h3>
          <p className="font-headline text-4xl mt-2 text-[#1C1C1C]">{meetings.length}</p>
        </div>
        <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border-l-4 border-[#71642C]">
          <Star className="text-[#71642C] mb-4" size={24} />
          <h3 className="font-label text-xs text-[#66645E]">Average AI Score</h3>
          <p className="font-headline text-4xl mt-2 text-[#1C1C1C]">{avgScore}%</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-7 space-y-8">
          <div className="flex justify-between items-baseline">
            <h2 className="font-headline text-3xl text-[#1C1C1C]">Current Mentees</h2>
            <Link to="/mentor/logs" className="text-[#7C5E4C] font-medium text-sm hover:underline underline-offset-4">View All Logs</Link>
          </div>
          <div className="space-y-6">
            {mentees.map(mentee => (
              <div key={mentee.id} className="bg-[#FDF9F3] group rounded-xl p-6 transition-all duration-300 hover:shadow-md border border-[#EBE8E0]">
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-lg bg-[#F1EDE6] flex items-center justify-center text-[#64655A] font-headline text-2xl">S</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-headline text-xl text-[#1C1C1C]">{mentee.users?.name || 'Student'}</h4>
                        <p className="text-sm text-[#66645E]">{mentee.grade} • {mentee.career_goal}</p>
                      </div>
                      <div className="px-3 py-1 bg-[#FAE8A2] text-[#4D420C] text-xs font-bold rounded-full">
                        AI Score: {meetings.filter(m => m.mentee_id === mentee.id).slice(-1)[0]?.ai_score || 'N/A'}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <Link to="/mentor/log-meeting" className="px-6 py-2 bg-[#64655A] text-white font-medium rounded-sm text-sm hover:bg-[#58594E]">Log Meeting</Link>
                      <Link to="/mentor/mentees" className="px-6 py-2 border border-[#82807A]/30 text-[#7C5E4C] font-medium rounded-sm text-sm hover:bg-[#F1EDE6]">Details</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {mentees.length === 0 && (
              <div className="p-12 text-center border border-dashed border-[#82807A]/30 rounded-xl bg-[#FDF9F3]">
                <p className="text-[#66645E] italic">No mentees assigned yet. Your journey begins soon.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-12">
          {matchRequests.length > 0 && (
            <section className="space-y-6">
              <h2 className="font-headline text-3xl text-[#1C1C1C]">Match Requests</h2>
              {matchRequests.map(req => (
                <div key={req.id} className="bg-[#64655A] text-white rounded-xl p-8 shadow-lg space-y-6 border border-[#FFFFFF]/10 relative overflow-hidden">
                  <Sparkles className="absolute -right-4 -top-4 text-white/10" size={120} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-headline text-xl">
                        {(req.users?.name || 'S')[0]}
                      </div>
                      <div>
                        <h4 className="font-headline text-xl">{req.users?.name || 'New Student'}</h4>
                        <p className="text-xs text-white/70 uppercase tracking-widest">{req.mentee_profiles.grade} • {req.mentee_profiles.career_goal}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white/10 rounded-lg text-sm italic mb-6 leading-relaxed">
                      "{req.match_reason}"
                    </div>
                    <button 
                      onClick={() => handleAcceptMatch(req.id, req.mentee_id)}
                      disabled={!!processingId}
                      className="w-full py-4 bg-white text-[#64655A] font-bold rounded-sm text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === req.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-[#64655A]" /> : <CheckCircle2 size={16} />}
                      Accept Match
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="p-8 bg-[#FFFFFF] rounded-xl border border-[#EBE8E0] shadow-sm">
            <div className="flex items-center space-x-2 text-[#7C5E4C] mb-4">
              <AlertCircle size={20} />
              <h3 className="font-headline text-xl">Program Note</h3>
            </div>
            <p className="text-sm text-[#66645E] leading-relaxed">
              Remember to log your meetings within 24 hours. Your feedback helps the AI agent provide better tips for your next interaction.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
