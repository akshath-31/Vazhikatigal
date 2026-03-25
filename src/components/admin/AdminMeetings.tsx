import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Meeting } from '../../types';
import { Star, ChevronRight, AlertCircle, Info, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [mentorProfiles, setMentorProfiles] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: m }, { data: u }, { data: mp }] = await Promise.all([
        supabase.from('meetings').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*'),
        supabase.from('mentor_profiles').select('*'),
      ]);
      if (m) setMeetings(m as Meeting[]);
      if (u) {
        const uData: Record<string, any> = {};
        (u as any[]).forEach(usr => { uData[usr.id] = usr; });
        setUsers(uData);
      }
      if (mp) {
        const mpData: Record<string, any> = {};
        (mp as any[]).forEach(p => { mpData[p.id] = p; });
        setMentorProfiles(mpData);
      }
    };
    fetchAll();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-[#64655A] bg-[#F1EDE6] border-[#EBE8E0]';
    if (score >= 50) return 'text-[#7C5E4C] bg-[#F7F3EC] border-[#EBE8E0]';
    return 'text-[#8B4513] bg-[#FDF5E6] border-[#EBE8E0]';
  };

  // Get mentor's user record via their profile
  const getMentorUser = (mentorProfileId: string) => {
    const profile = mentorProfiles[mentorProfileId];
    if (!profile) return null;
    return users[profile.user_id];
  };

  const filteredMeetings = meetings.filter(m => {
    const mentorUser = getMentorUser(m.mentor_id);
    const mentorName = mentorUser?.name || '';
    const menteeName = users[m.mentee_id]?.name || '';
    const location = m.meeting_location_name || '';
    const search = searchTerm.toLowerCase();
    return mentorName.toLowerCase().includes(search) || menteeName.toLowerCase().includes(search) || location.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="max-w-2xl">
          <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Program Oversight</span>
          <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
            Meeting <span className="italic text-[#64655A]">Interactions</span>. Monitoring the pulse of mentorship.
          </h1>
          <p className="font-body text-lg text-[#64645E] leading-relaxed">
            A comprehensive log of all mentorship sessions, providing transparency and AI-driven insights.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C5E4C]" size={18} />
          <input type="text" placeholder="Search by mentor, mentee, or location..."
            className="w-full bg-[#FFFFFF] border border-[#EBE8E0] rounded-sm pl-12 pr-4 py-4 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all font-body shadow-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </header>

      <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#EBE8E0]">
                <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Mentor</th>
                <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Mentee</th>
                <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Location</th>
                <th className="px-8 py-6 font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em] text-center">AI Score</th>
                <th className="px-8 py-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E0]">
              {filteredMeetings.map(m => (
                <tr key={m.id} className="hover:bg-[#FBF9F6] transition-colors cursor-pointer group" onClick={() => setSelectedMeeting(m)}>
                  <td className="px-8 py-6 font-body text-sm text-[#64645E]">{new Date(m.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-8 py-6 font-headline text-lg text-[#1C1C1C]">{getMentorUser(m.mentor_id)?.name}</td>
                  <td className="px-8 py-6 font-headline text-lg text-[#1C1C1C]">{users[m.mentee_id]?.name}</td>
                  <td className="px-8 py-6 font-body text-sm text-[#7C5E4C] italic truncate max-w-[150px]">{m.meeting_location_name}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${getScoreColor(m.ai_score || 0)}`}>{m.ai_score}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <ChevronRight size={18} className="text-[#EBE8E0] group-hover:text-[#64655A] transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-[#F8F4EF] border border-[#EBE8E0] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8 border-b border-[#EBE8E0] flex items-center justify-between sticky top-0 bg-[#F8F4EF] z-10">
                <h3 className="font-headline text-3xl text-[#1C1C1C]">Session <span className="italic text-[#64655A]">Analysis</span></h3>
                <button onClick={() => setSelectedMeeting(null)} className="h-10 w-10 rounded-full border border-[#EBE8E0] flex items-center justify-center text-[#7C5E4C] hover:bg-[#EBE8E0] transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-10 space-y-12">
                <div className="flex items-center space-x-8">
                  <div className={`h-24 w-24 rounded-2xl flex flex-col items-center justify-center border-2 ${getScoreColor(selectedMeeting.ai_score || 0)}`}>
                    <span className="text-4xl font-headline font-bold">{selectedMeeting.ai_score}</span>
                    <span className="text-[10px] font-label uppercase tracking-[0.2em] mt-1">Score</span>
                  </div>
                  <div className="space-y-2">
                    <p className="font-headline text-2xl text-[#1C1C1C]">Mentor: {getMentorUser(selectedMeeting.mentor_id)?.name}</p>
                    <p className="font-body text-[#7C5E4C] italic">Mentee: {users[selectedMeeting.mentee_id]?.name}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-label text-xs text-[#7C5E4C] uppercase tracking-[0.2em] flex items-center gap-3">
                    <Info size={14} className="text-[#64655A]" /> AI Narrative Analysis
                  </h4>
                  <p className="font-body text-lg text-[#64645E] leading-relaxed italic border-l-2 border-[#EBE8E0] pl-6 py-2">"{selectedMeeting.ai_description}"</p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="font-label text-xs text-[#7C5E4C] uppercase tracking-[0.2em] flex items-center gap-3">
                      <Star size={14} className="text-[#64655A]" /> Actionable Guidance
                    </h4>
                    <ul className="space-y-4">
                      {selectedMeeting.ai_tips?.map((tip, i) => (
                        <li key={i} className="font-body text-sm text-[#64645E] flex items-start gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#64655A] mt-1.5 shrink-0" /><span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="font-label text-xs text-[#7C5E4C] uppercase tracking-[0.2em] flex items-center gap-3">
                      <AlertCircle size={14} className="text-[#8B4513]" /> Identified Faults
                    </h4>
                    <ul className="space-y-4">
                      {selectedMeeting.ai_faults?.length ? selectedMeeting.ai_faults.map((fault, i) => (
                        <li key={i} className="font-body text-sm text-[#64645E] flex items-start gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8B4513] mt-1.5 shrink-0" /><span>{fault}</span>
                        </li>
                      )) : <li className="font-body text-sm text-[#7C5E4C] italic">No significant faults identified by AI.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
