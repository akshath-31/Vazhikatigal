import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MenteeProfile, MentorProfile } from '../../types';
import { ClipboardList, Calendar, Users, Star, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MenteeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MenteeProfile | null>(null);
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [mentorUser, setMentorUser] = useState<any>(null);
  const [matchReason, setMatchReason] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchMatchReason();
  }, [user]);

  const fetchMatchReason = async () => {
    const { data } = await supabase
      .from('match_logs')
      .select('match_reason')
      .eq('mentee_id', user!.id)
      .order('matched_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setMatchReason(data.match_reason);
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('mentee_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setProfile(data as MenteeProfile);
      if (data.assigned_mentor_id) {
        fetchMentor(data.assigned_mentor_id);
      }
    }
  };

  const fetchMentor = async (mentorProfileId: string) => {
    const { data: mentorData } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('id', mentorProfileId)
      .single();

    if (mentorData) {
      setMentor(mentorData as MentorProfile);
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', mentorData.user_id)
        .single();
      if (userData) setMentorUser(userData);
    }
  };

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block">Mentee Dashboard</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Welcome, <span className="italic text-[#64655A]">{user?.name}</span>. Your journey of growth continues here.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Track your progress, manage your mentorship, and explore your potential with Agaram Foundation.
        </p>
      </header>

      <div className="grid md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="font-headline text-3xl text-[#1C1C1C]">Your Mentor</h2>
            {mentor && <span className="text-[#7C5E4C] font-medium text-sm">Active Guidance</span>}
          </div>
          <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border border-[#EBE8E0]">
            {mentor ? (
              <div className="space-y-8">
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 rounded-lg bg-[#F1EDE6] flex items-center justify-center text-3xl font-headline font-bold text-[#64655A]">
                    {mentorUser?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-headline text-2xl text-[#1C1C1C]">{mentorUser?.name}</p>
                    <p className="text-sm text-[#7C5E4C] font-medium uppercase tracking-wider">{mentor.career_domain}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-lg text-[#64645E] italic leading-relaxed">"{mentor.bio}"</p>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[#EBE8E0]">
                    {mentor.skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-[#F7F3EC] text-[#64655A] text-xs font-medium rounded-full border border-[#EBE8E0]">{skill}</span>
                    ))}
                  </div>
                  {matchReason && (
                    <div className="mt-8 p-4 bg-[#F1EDE6]/50 rounded-lg border border-[#EBE8E0]">
                      <p className="text-[10px] text-[#7C5E4C] font-label uppercase tracking-widest mb-1">Matching Insight</p>
                      <p className="text-sm text-[#64645E] italic leading-relaxed">{matchReason}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 bg-[#FDF9F3] rounded-full flex items-center justify-center mx-auto">
                  <Users className="text-[#82807A]" size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-[#1C1C1C] font-headline text-xl">No mentor assigned yet.</p>
                  <p className="text-[#66645E] text-sm max-w-xs mx-auto italic">We are currently finding the perfect match for your goals.</p>
                </div>
                <Link to="/mentee/request" className="inline-block px-8 py-3 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-colors shadow-sm">
                  Request a Mentor
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-5 space-y-8">
          <h2 className="font-headline text-3xl text-[#1C1C1C]">Engagement</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border-l-4 border-[#64655A] flex items-center justify-between">
              <div>
                <h3 className="font-label text-xs text-[#66645E]">Total Meetings</h3>
                <p className="font-headline text-4xl mt-2 text-[#1C1C1C]">0</p>
              </div>
              <ClipboardList className="text-[#64655A]/20" size={48} />
            </div>
            <div className="bg-[#F7F3EC] p-8 rounded-xl border border-[#EBE8E0]">
              <div className="flex items-center gap-2 text-[#71642C] mb-4">
                <Star size={20} />
                <h3 className="font-headline text-xl">Growth Insight</h3>
              </div>
              <p className="text-sm text-[#64645E] leading-relaxed italic">
                "Consistency is the key to mentorship. Every session brings you closer to your aspirations."
              </p>
              <div className="mt-6 flex items-center gap-2 text-[#64655A]">
                <ArrowUpRight size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Track your journey</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
