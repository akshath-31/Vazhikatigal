import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MentorProfile, MenteeProfile, Meeting } from '../../types';
import { OnboardingAgent } from './OnboardingAgent';
import { Users, ClipboardList, TrendingUp, AlertCircle, ArrowUpRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MentorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

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
    }
  };

  const fetchMenteesAndMeetings = async (profileId: string) => {
    const [{ data: menteesData }, { data: meetingsData }] = await Promise.all([
      supabase.from('mentee_profiles').select('*').eq('assigned_mentor_id', profileId),
      supabase.from('meetings').select('*').eq('mentor_id', profileId),
    ]);
    if (menteesData) setMentees(menteesData as MenteeProfile[]);
    if (meetingsData) setMeetings(meetingsData as Meeting[]);
  };

  if (loading) return null;

  if (!profile || !profile.onboarding_complete) {
    return <OnboardingAgent onComplete={() => window.location.reload()} />;
  }

  const avgScore = meetings.length > 0
    ? Math.round(meetings.reduce((acc, m) => acc + (m.ai_score || 0), 0) / meetings.length)
    : 0;

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block">Mentor Dashboard</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Welcome back, Mentor. Your guidance is shaping the future of <span className="italic text-[#64655A]">Agaram Foundation</span>.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          You have {mentees.length} active mentees. Your current average AI quality score is {avgScore}%.
        </p>
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
                        <h4 className="font-headline text-xl text-[#1C1C1C]">Student</h4>
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
