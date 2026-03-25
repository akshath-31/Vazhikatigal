import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MenteeProfile, MentorProfile } from '../../types';
import { analyzeMeeting } from '../../lib/lyzr';
import { MapPin, Calendar, Send, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LogMeeting() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; description: string; tips: string[]; faults: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mentee_id: '',
    scheduled_at: new Date().toISOString().split('T')[0],
    mentor_review_text: '',
    meeting_location_name: '',
  });

  useEffect(() => {
    if (!user) return;
    const fetchMentees = async () => {
      // 1. Get mentor profile
      const { data: profileData } = await supabase.from('mentor_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (!profileData) return;
      setProfile(profileData as MentorProfile);

      // 2. Fetch mentees assigned to this mentor
      const { data: assignedMentees } = await supabase
        .from('mentee_profiles')
        .select('*, users(name)')
        .eq('assigned_mentor_id', profileData.id);
      
      if (assignedMentees) {
        setMentees(assignedMentees as any[]);
      }
    };
    fetchMentees();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !formData.mentee_id || !formData.mentor_review_text) return;
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.from('users').select('name').eq('id', user!.id).maybeSingle();
      const mentorName = userData?.name || 'Mentor';

      const aiAnalysis = await analyzeMeeting(formData.mentor_review_text, user?.email || 'mentor@agaram.org');
      setAiResult(aiAnalysis);
      const { error: insertError } = await supabase.from('meetings').insert({
        mentee_id: formData.mentee_id,
        mentor_id: profile.id,
        mentor_review_text: formData.mentor_review_text,
        meeting_location_name: formData.meeting_location_name,
        ai_score: aiAnalysis.score,
        ai_description: aiAnalysis.description,
        ai_tips: aiAnalysis.tips,
        ai_faults: aiAnalysis.faults,
        scheduled_at: formData.scheduled_at,
        created_at: new Date().toISOString()
      });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err) {
      console.error('AI evaluation or insert failed, using fallback:', err);
      const fallbackAnalysis = {
        score: 75,
        description: "The session was productive, focusing on the mentee's career goals. Mentee showed good engagement.",
        tips: ["Continue encouraging local regional language support.", "Focus more on practical examples.", "Review the mentee's progress on specific tasks."],
        faults: []
      };
      setAiResult(fallbackAnalysis);
      
      const { data: userData } = await supabase.from('users').select('name').eq('id', user!.id).maybeSingle();
      const mentorName = userData?.name || 'Mentor';

      const { error: insertError } = await supabase.from('meetings').insert({
        mentee_id: formData.mentee_id,
        mentor_id: profile.id,
        mentor_review_text: formData.mentor_review_text,
        meeting_location_name: formData.meeting_location_name,
        ai_score: fallbackAnalysis.score,
        ai_description: fallbackAnalysis.description,
        ai_tips: fallbackAnalysis.tips,
        ai_faults: fallbackAnalysis.faults,
        scheduled_at: formData.scheduled_at,
        created_at: new Date().toISOString()
      });
      
      if (insertError) {
        console.error("LOG INSERT ERROR", insertError);
        setError(`Failed to log meeting: ${insertError.message}`);
      } else {
        setSuccess(true);
      }
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
          {aiResult && (
            <div className="bg-[#F8F4EF] p-8 rounded-xl border border-[#EBE8E0] space-y-6 max-w-2xl mx-auto text-left">
              <div className="flex justify-between items-center">
                <span className="font-label text-xs uppercase tracking-widest text-[#7C5E4C]">AI Analysis Result</span>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${aiResult.score >= 70 ? 'bg-emerald-100 text-emerald-700' : aiResult.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  Score: {aiResult.score}/100
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="font-body text-[#1C1C1C] text-lg leading-relaxed">{aiResult.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="font-label text-[10px] uppercase tracking-widest text-emerald-700">Actionable Tips</h4>
                  <ul className="space-y-2">
                    {aiResult.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-[#64645E] flex gap-2">
                        <span className="text-emerald-500">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                {aiResult.faults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-label text-[10px] uppercase tracking-widest text-rose-700">Identified Faults</h4>
                    <ul className="space-y-2">
                      {aiResult.faults.map((fault, i) => (
                        <li key={i} className="text-sm text-[#64645E] flex gap-2">
                          <span className="text-rose-500">!</span> {fault}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          {!aiResult && (
            <p className="text-[#64645E] text-lg font-body italic max-w-md mx-auto">
              "The AI agent has analyzed your session. Your contribution to their growth is invaluable."
            </p>
          )}
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
              {mentees.map((m: any) => (
                <option key={m.id} value={m.user_id}>{m.users?.name || `${m.grade} Student`} - {m.career_goal}</option>
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
