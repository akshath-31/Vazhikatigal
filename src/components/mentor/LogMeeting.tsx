import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MenteeProfile, MentorProfile } from '../../types';
import { getAIScoreAgent } from '../../lib/gemini';
import { MapPin, Calendar, Send, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LogMeeting() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mentee_id: '',
    scheduled_at: new Date().toISOString().split('T')[0],
    mentor_review_text: '',
    meeting_location_name: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('mentor_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile(data as MentorProfile);
        supabase.from('mentee_profiles').select('*').eq('assigned_mentor_id', data.id).then(({ data: menteeData }) => {
          if (menteeData) setMentees(menteeData as MenteeProfile[]);
        });
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !formData.mentee_id || !formData.mentor_review_text) return;
    setLoading(true);
    setError(null);
    try {
      const aiAnalysis = await getAIScoreAgent(formData.mentor_review_text);
      const { error: insertError } = await supabase.from('meetings').insert({
        mentor_id: profile.id,
        mentee_id: formData.mentee_id,
        scheduled_at: formData.scheduled_at,
        status: 'completed',
        mentor_review_text: formData.mentor_review_text,
        meeting_location_name: formData.meeting_location_name,
        ai_score: aiAnalysis.score,
        ai_description: aiAnalysis.description,
        ai_tips: aiAnalysis.tips,
        ai_faults: aiAnalysis.faults,
      });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to log meeting. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-12">
        <div className="h-24 w-24 bg-[#64655A]/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="text-[#64655A]" size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="font-headline text-5xl text-[#1C1C1C]">Meeting Logged!</h2>
          <p className="text-[#64645E] text-lg font-body italic max-w-md mx-auto">
            "The AI agent has analyzed your session. Your contribution to their growth is invaluable."
          </p>
        </div>
        <div className="pt-8 flex justify-center gap-6">
          <button onClick={() => setSuccess(false)} className="px-8 py-3 bg-[#FFFFFF] border border-[#EBE8E0] text-[#1C1C1C] font-medium rounded-sm hover:bg-[#F1EDE6] transition-all">Log Another</button>
          <Link to="/mentor/logs" className="px-8 py-3 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-all flex items-center gap-2">
            View History <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Session Documentation</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Log a <span className="italic text-[#64655A]">Meeting</span>. Recording the moments of mentorship.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Share how your session went. Your insights help us understand the mentee's progress.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl p-10 shadow-sm space-y-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">Select Mentee</label>
            <select required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-sm px-4 py-3 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all font-body"
              value={formData.mentee_id} onChange={e => setFormData({...formData, mentee_id: e.target.value})}>
              <option value="">Choose a mentee...</option>
              {mentees.map(m => (
                <option key={m.id} value={m.id}>{m.grade} Student - {m.career_goal}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">Meeting Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82807A]" size={18} />
              <input type="date" required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-sm pl-12 pr-4 py-3 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all font-body"
                value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">Meeting Location</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82807A]" size={18} />
            <input type="text" required placeholder="e.g. School Library, Community Center..." className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-sm pl-12 pr-4 py-3 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all font-body"
              value={formData.meeting_location_name} onChange={e => setFormData({...formData, meeting_location_name: e.target.value})} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">How did the meeting go?</label>
          <textarea required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-sm px-6 py-5 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all h-64 resize-none text-base leading-relaxed font-body italic"
            placeholder="Share what was discussed, how the mentee responded, any concerns or highlights..."
            value={formData.mentor_review_text} onChange={e => setFormData({...formData, mentor_review_text: e.target.value})} />
          <p className="text-[10px] text-[#82807A] italic">Your review will be analyzed by our AI agent to provide growth insights.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-sm flex items-center space-x-3 text-red-600 text-sm">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        <button disabled={loading} className="w-full py-5 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-all disabled:opacity-50 flex items-center justify-center space-x-3 group">
          {loading ? (
            <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /><span className="font-label uppercase tracking-widest text-sm">AI Agent Analyzing...</span></>
          ) : (
            <><Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /><span className="font-label uppercase tracking-widest text-sm">Submit Meeting Log</span></>
          )}
        </button>
      </form>
    </div>
  );
}
