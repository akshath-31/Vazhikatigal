import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { Meeting } from '../../types';
import { MapPin, Star, ChevronRight, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function MenteeLogs() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('meetings')
      .select('*')
      .eq('mentee_id', user.id)
      .order('scheduled_at', { ascending: false })
      .then(({ data }) => {
        if (data) setMeetings(data as Meeting[]);
      });
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-[#64655A] bg-[#F1EDE6] border-[#EBE8E0]';
    if (score >= 50) return 'text-[#7C5E4C] bg-[#F7F3EC] border-[#EBE8E0]';
    return 'text-[#8B4513] bg-[#FDF5E6] border-[#EBE8E0]';
  };

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Growth Journey</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          My <span className="italic text-[#64655A]">Progress</span>. Reflecting on every milestone.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Review your mentorship sessions, track your growth, and gain insights from AI-driven analysis.
        </p>
      </header>

      <div className="grid gap-6">
        {meetings.map(m => (
          <div key={m.id} onClick={() => setSelectedMeeting(m)}
            className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl p-8 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className={`h-16 w-16 rounded-lg flex items-center justify-center font-headline text-2xl font-bold border ${getScoreColor(m.ai_score || 0)}`}>
                {m.ai_score}
              </div>
              <div>
                <p className="font-headline text-xl text-[#1C1C1C] mb-1">{new Date(m.scheduled_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-sm text-[#7C5E4C] font-medium uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} className="text-[#64655A]" />
                  <span>{m.meeting_location_name}</span>
                </p>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full border border-[#EBE8E0] flex items-center justify-center text-[#EBE8E0] group-hover:text-[#64655A] group-hover:border-[#64655A] transition-all">
              <ChevronRight size={24} />
            </div>
          </div>
        ))}
        {meetings.length === 0 && (
          <div className="p-24 text-center border border-dashed border-[#EBE8E0] rounded-2xl bg-[#FFFFFF]/50">
            <p className="text-[#7C5E4C] font-headline text-xl italic">No sessions logged yet. Your journey is just beginning.</p>
          </div>
        )}
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
                    <p className="font-headline text-2xl text-[#1C1C1C]">Meeting on {new Date(selectedMeeting.scheduled_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p className="font-body text-[#7C5E4C] italic">{selectedMeeting.meeting_location_name}</p>
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
                      <Star size={14} className="text-[#64655A]" /> Tips for You
                    </h4>
                    <ul className="space-y-4">
                      {selectedMeeting.ai_tips?.map((tip, i) => (
                        <li key={i} className="font-body text-sm text-[#64645E] flex items-start gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#64655A] mt-1.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="font-label text-xs text-[#7C5E4C] uppercase tracking-[0.2em] flex items-center gap-3">
                      <AlertCircle size={14} className="text-[#8B4513]" /> Areas of Improvement
                    </h4>
                    <ul className="space-y-4">
                      {selectedMeeting.ai_faults?.length ? selectedMeeting.ai_faults.map((fault, i) => (
                        <li key={i} className="font-body text-sm text-[#64645E] flex items-start gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8B4513] mt-1.5 shrink-0" />
                          <span>{fault}</span>
                        </li>
                      )) : <li className="font-body text-sm text-[#7C5E4C] italic">No specific issues identified. Keep it up!</li>}
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
