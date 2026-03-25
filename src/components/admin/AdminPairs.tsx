import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { MentorProfile, MenteeProfile, Meeting } from '../../types';

export function AdminPairs() {
  const [mentors, setMentors] = useState<Record<string, MentorProfile>>({});
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: mt }, { data: me }, { data: m }, { data: u }] = await Promise.all([
        supabase.from('mentee_profiles').select('*').not('assigned_mentor_id', 'is', null),
        supabase.from('mentor_profiles').select('*'),
        supabase.from('meetings').select('*'),
        supabase.from('users').select('*'),
      ]);

      if (mt) setMentees(mt as MenteeProfile[]);
      if (me) {
        const mData: Record<string, MentorProfile> = {};
        (me as MentorProfile[]).forEach(mp => { mData[mp.id!] = mp; });
        setMentors(mData);
      }
      if (m) setMeetings(m as Meeting[]);
      if (u) {
        const uData: Record<string, any> = {};
        (u as any[]).forEach(usr => { uData[usr.id] = usr; });
        setUsers(uData);
      }
    };
    fetchAll();
  }, []);

  const getPairStats = (menteeUserId: string, mentorProfileId: string) => {
    const pairMeetings = meetings.filter(m => m.mentee_id === menteeUserId && m.mentor_id === mentorProfileId);
    const avgScore = pairMeetings.length > 0
      ? Math.round(pairMeetings.reduce((acc, m) => acc + (m.ai_score || 0), 0) / pairMeetings.length)
      : 0;
    let healthColor = 'text-[#7C5E4C] bg-[#F7F3EC]';
    if (pairMeetings.length > 0) {
      if (avgScore >= 70) healthColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
      else if (avgScore >= 50) healthColor = 'text-amber-700 bg-amber-50 border-amber-100';
      else healthColor = 'text-rose-700 bg-rose-50 border-rose-100';
    }
    return { count: pairMeetings.length, avgScore, healthColor };
  };

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Ecosystem Monitor</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Active <span className="italic text-[#64655A]">Pairs</span>. Cultivating meaningful connections.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Tracking the health and engagement of all mentorship pairs within the program.
        </p>
      </header>

      <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FBF9F6] border-b border-[#EBE8E0]">
              <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Mentor</th>
              <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Mentee</th>
              <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em] text-center">Sessions</th>
              <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em] text-center">Avg Score</th>
              <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em] text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE8E0]">
            {mentees.map(mentee => {
              const mentor = mentors[mentee.assigned_mentor_id!];
              const stats = getPairStats(mentee.user_id!, mentee.assigned_mentor_id!);
              return (
                <tr key={mentee.id} className="hover:bg-[#FBF9F6] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-[#F1EDE6] flex items-center justify-center font-headline text-lg text-[#64655A]">
                        {users[mentor?.user_id]?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-headline text-lg text-[#1C1C1C]">{users[mentor?.user_id]?.name}</p>
                        <p className="text-xs text-[#7C5E4C] font-medium uppercase tracking-wider">{mentor?.career_domain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-[#F7F3EC] flex items-center justify-center font-headline text-lg text-[#7C5E4C]">
                        {users[mentee.user_id!]?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-headline text-lg text-[#1C1C1C]">{users[mentee.user_id!]?.name}</p>
                        <p className="text-xs text-[#7C5E4C] font-medium uppercase tracking-wider">{mentee.grade} Student</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-body text-sm text-[#64645E]">{stats.count}</td>
                  <td className="px-8 py-6 text-center font-headline text-lg text-[#1C1C1C]">{stats.avgScore}%</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#EBE8E0] ${stats.healthColor}`}>
                        {stats.avgScore >= 70 ? 'Thriving' : stats.avgScore >= 50 ? 'Stable' : stats.count === 0 ? 'Pending' : 'At Risk'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {mentees.length === 0 && (
          <div className="p-24 text-center border-t border-[#EBE8E0] bg-[#FFFFFF]/50">
            <p className="text-[#7C5E4C] font-headline text-xl italic">No active pairs found in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
