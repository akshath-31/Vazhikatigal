import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { MentorProfile, MenteeProfile, MentorRequest } from '../../types';
import { getMatchingAgent } from '../../lib/lyzr';
import { User, ArrowRight, Sparkles } from 'lucide-react';

export function AdminRequests() {
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [mentees, setMentees] = useState<Record<string, MenteeProfile>>({});
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const fetchAll = async () => {
    const [{ data: r }, { data: mt }, { data: m }, { data: u }] = await Promise.all([
      supabase.from('mentor_requests').select('*').order('requested_at', { ascending: false }),
      supabase.from('mentee_profiles').select('*'),
      supabase.from('mentor_profiles').select('*').eq('onboarding_complete', true),
      supabase.from('users').select('*'),
    ]);

    if (r) setRequests(r as MentorRequest[]);
    if (m) setMentors(m as MentorProfile[]);
    if (mt) {
      const mData: Record<string, MenteeProfile> = {};
      (mt as MenteeProfile[]).forEach(mentee => { mData[mentee.user_id!] = mentee; });
      setMentees(mData);
    }
    if (u) {
      const uData: Record<string, any> = {};
      (u as any[]).forEach(usr => { uData[usr.id] = usr; });
      setUsers(uData);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const triggerMatching = async (request: MentorRequest) => {
    const mentee = mentees[request.mentee_id];
    if (!mentee || mentors.length === 0) return;
    setLoading(request.id!);
    try {
      const match = await getMatchingAgent(mentee, mentors);

      // 1. Create match log (Proposal for mentor to accept)
      await supabase.from('match_logs').insert({
        mentee_id: request.mentee_id,
        matched_mentor_id: match.mentor_id,
        match_reason: match.match_reason,
        matched_at: new Date().toISOString(),
      });

      // 2. Update request status
      await supabase
        .from('mentor_requests')
        .update({ status: 'matched' })
        .eq('id', request.id!);

      await fetchAll();
    } catch (err) {
      console.error(err);
    }
    setLoading(null);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Matching Queue</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Pending <span className="italic text-[#64655A]">Requests</span>. Orchestrating the perfect mentorship match.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Review unmatched mentees and leverage our AI Matching Agent to find the most compatible mentor.
        </p>
      </header>

      <div className="grid gap-8">
        {pendingRequests.map(req => {
          const mentee = mentees[req.mentee_id];
          const user = users[req.mentee_id];
          return (
            <div key={req.id} className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center space-x-6">
                <div className="h-16 w-16 rounded-lg bg-[#F1EDE6] flex items-center justify-center text-[#64655A]">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="font-headline text-2xl text-[#1C1C1C]">{user?.name}</h3>
                  <p className="text-sm text-[#7C5E4C] font-medium uppercase tracking-wider">{mentee?.grade} Student • {mentee?.location}</p>
                </div>
              </div>

              <div className="flex-1 max-w-md space-y-3">
                <div className="flex flex-wrap gap-2">
                  {mentee?.interests?.map(i => (
                    <span key={i} className="px-3 py-1 bg-[#F7F3EC] text-[#64655A] text-[10px] uppercase font-bold rounded-full border border-[#EBE8E0]">{i}</span>
                  ))}
                </div>
                <p className="text-sm text-[#64645E] italic leading-relaxed">Goal: {mentee?.career_goal}</p>
              </div>

              <button onClick={() => triggerMatching(req)} disabled={!!loading}
                className="px-8 py-4 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-all disabled:opacity-50 flex items-center gap-3 group">
                {loading === req.id ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /><span className="font-label uppercase tracking-widest text-xs">Matching...</span></>
                ) : (
                  <><Sparkles size={18} className="group-hover:rotate-12 transition-transform" /><span className="font-label uppercase tracking-widest text-xs">Trigger Matching Agent</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          );
        })}
        {pendingRequests.length === 0 && (
          <div className="p-24 text-center border border-dashed border-[#EBE8E0] rounded-2xl bg-[#FFFFFF]/50">
            <p className="text-[#7C5E4C] font-headline text-xl italic">No pending requests at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
