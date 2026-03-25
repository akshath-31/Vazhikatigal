import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MentorProfile, Meeting } from '../../types';
import { MapPin, Star, ChevronRight, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function MentorLogs() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [menteeNames, setMenteeNames] = useState<Record<string, string>>({});
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('mentor_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data as MentorProfile);
    });
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('meetings').select('*').eq('mentor_id', profile.id).order('scheduled_at', { ascending: false }).then(({ data }) => {
      if (data) setMeetings(data as Meeting[]);
    });
  }, [profile]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 border-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-amber-600 border-amber-600 bg-amber-50';
    return 'text-rose-600 border-rose-600 bg-rose-50';
  };

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Session Archives</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Meeting <span className="italic text-[#64655A]">History</span>. Reviewing the impact of every conversation.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Review your past sessions, AI-driven analysis, and actionable feedback.
        </p>
      </header>

      <div className="space-y-12">
        <h3 className="font-headline text-3xl text-[#1C1C1C]">All Sessions</h3>
        <div className="grid gap-6">
          {meetings.map(m => (
            <div key={m.id} onClick={() => setSelectedMeeting(m)}
              className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl p-8 hover:border-[#64655A] transition-all cursor-pointer group shadow-sm hover:shadow-md flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className={`h-16 w-16 rounded-lg flex flex-col items-center justify-center font-headline font-bold text-2xl border-2 ${getScoreColor(m.ai_score || 0)}`}>
                  {m.ai_score}
                </div>
                <div>
                  <p className="font-headline text-2xl text-[#1C1C1C]">{new Date(m.scheduled_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-sm text-[#7C5E4C] font-medium flex items-center space-x-2 mt-1 uppercase tracking-wider">
                    <MapPin size={14} /><span>{m.meeting_location_name}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[#82807A] group-hover:text-[#64655A] transition-colors">
                <span className="text-xs font-label uppercase tracking-widest hidden md:block">View Analysis</span>
                <ChevronRight size={24} />
              </div>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="p-24 text-center border border-dashed border-[#EBE8E0] rounded-2xl bg-[#FFFFFF]/50">
              <p className="text-[#7C5E4C] font-headline text-xl italic">No sessions logged yet.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1C]/40 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-[#F8F4EF] border border-[#EBE8E0] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8 border-b border-[#EBE8E0] flex items-center justify-between sticky top-0 bg-[#F8F4EF] z-10">
                <div className="space-y-1">
                  <span className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-widest">AI Insight Report</span>
                  <h3 className="font-headline text-3xl text-[#1C1C1C]">Session Analysis</h3>
                </div>
                <button onClick={() => setSelectedMeeting(null)} className="p-2 hover:bg-[#F1EDE6] rounded-full text-[#82807A] hover:text-[#1C1C1C] transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-10 space-y-12">
                <div className="flex items-center space-x-8">
                  <div className={`h-24 w-24 rounded-2xl flex flex-col items-center justify-center border-2 ${getScoreColor(selectedMeeting.ai_score || 0)}`}>
                    <span className="text-4xl font-headline font-bold">{selectedMeeting.ai_score}</span>
                    <span className="text-[10px] font-label font-bold uppercase tracking-widest">Score</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-headline text-[#1C1C1C]">{new Date(selectedMeeting.scheduled_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[#7C5E4C] font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                      <MapPin size={14} />{selectedMeeting.meeting_location_name}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 bg-[#FFFFFF] p-8 rounded-xl border border-[#EBE8E0]">
                  <h4 className="font-label text-xs text-[#64655A] uppercase tracking-widest flex items-center space-x-2">
                    <Info size={14} /><span>AI Narrative</span>
                  </h4>
                  <p className="text-[#64645E] text-lg leading-relaxed italic font-headline">"{selectedMeeting.ai_description}"</p>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="font-label text-xs text-[#64655A] uppercase tracking-widest flex items-center space-x-2">
                      <Star size={14} /><span>Actionable Guidance</span>
                    </h4>
                    <ul className="space-y-4">
                      {selectedMeeting.ai_tips?.map((tip, i) => (
                        <li key={i} className="text-[#64645E] flex items-start space-x-3">
                          <span className="text-[#64655A] mt-1 font-bold">•</span>
                          <span className="text-sm leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest flex items-center space-x-2">
                      <AlertCircle size={14} /><span>Identified Faults</span>
                    </h4>
                    <ul className="space-y-4">
                      {selectedMeeting.ai_faults?.length ? selectedMeeting.ai_faults.map((fault, i) => (
                        <li key={i} className="text-[#64645E] flex items-start space-x-3">
                          <span className="text-[#7C5E4C] mt-1 font-bold">•</span>
                          <span className="text-sm leading-relaxed">{fault}</span>
                        </li>
                      )) : <li className="text-sm text-[#82807A] italic">No faults identified in this session.</li>}
                    </ul>
                  </div>
                </div>
                <div className="pt-10 border-t border-[#EBE8E0]">
                  <h4 className="font-label text-[10px] text-[#82807A] uppercase tracking-widest mb-4">Original Mentor Review</h4>
                  <p className="text-[#64645E] leading-relaxed font-body bg-[#F1EDE6]/30 p-6 rounded-lg border border-[#EBE8E0]/50">{selectedMeeting.mentor_review_text}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
