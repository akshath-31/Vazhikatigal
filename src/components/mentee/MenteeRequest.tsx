import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MenteeProfile, MentorRequest as RequestType } from '../../types';
import { MatchingAgent } from './MatchingAgent';
import { Send, CheckCircle2, Clock, User, MapPin, GraduationCap, Target, Globe } from 'lucide-react';

export function MenteeRequest() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MenteeProfile | null>(null);
  const [request, setRequest] = useState<RequestType | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ mentor_name: string; match_score: number; reason: string } | null>(null);
  const [showMatchingAgent, setShowMatchingAgent] = useState(false);

  const [formData, setFormData] = useState({
    grade: '',
    interests: '',
    language_preference: '',
    location: '',
    career_goal: ''
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: profileData } = await supabase
      .from('mentee_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (profileData) setProfile(profileData as MenteeProfile);

    const { data: requestData } = await supabase
      .from('mentor_requests')
      .select('*')
      .eq('mentee_id', user!.id)
      .maybeSingle();
    if (requestData) setRequest(requestData as RequestType);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('mentee_profiles').insert({
      user_id: user.id,
      grade: formData.grade,
      interests: formData.interests.split(',').map(i => i.trim()),
      language_preference: formData.language_preference,
      location: formData.location,
      career_goal: formData.career_goal,
    });
    if (!error) await fetchData();
    setLoading(false);
  };

  const handleRequestMentor = async () => {
    setShowMatchingAgent(true);
  };

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <span className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">Step 1: Profile</span>
          <h2 className="font-headline text-5xl text-[#1C1C1C]">Complete Your <span className="italic text-[#64655A]">Identity</span></h2>
          <p className="font-body text-lg text-[#64645E] max-w-xl mx-auto">Tell us about your aspirations and background so we can find the perfect mentor to guide your journey.</p>
        </header>

        <form onSubmit={handleProfileSubmit} className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-2xl p-6 md:p-10 shadow-sm space-y-8">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-[#7C5E4C] flex items-center gap-2">
                <GraduationCap size={14} className="text-[#64655A]" /> Current Grade
              </label>
              <input required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg px-4 py-3 text-[#1C1C1C] font-body focus:ring-1 focus:ring-[#64655A] outline-none transition-all"
                placeholder="e.g. 10th Grade" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-widest text-[#7C5E4C] flex items-center gap-2">
                <MapPin size={14} className="text-[#64655A]" /> Location
              </label>
              <input required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg px-4 py-3 text-[#1C1C1C] font-body focus:ring-1 focus:ring-[#64655A] outline-none transition-all"
                placeholder="City/Town" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-label text-[10px] uppercase tracking-widest text-[#7C5E4C] flex items-center gap-2">
              <User size={14} className="text-[#64655A]" /> Interests (comma separated)
            </label>
            <input required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg px-4 py-3 text-[#1C1C1C] font-body focus:ring-1 focus:ring-[#64655A] outline-none transition-all"
              placeholder="e.g. Science, Football, Coding" value={formData.interests} onChange={e => setFormData({...formData, interests: e.target.value})} />
          </div>

          <div className="space-y-3">
            <label className="font-label text-[10px] uppercase tracking-widest text-[#7C5E4C] flex items-center gap-2">
              <Globe size={14} className="text-[#64655A]" /> Language Preference
            </label>
            <input required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg px-4 py-3 text-[#1C1C1C] font-body focus:ring-1 focus:ring-[#64655A] outline-none transition-all"
              placeholder="e.g. Tamil, English" value={formData.language_preference} onChange={e => setFormData({...formData, language_preference: e.target.value})} />
          </div>

          <div className="space-y-3">
            <label className="font-label text-[10px] uppercase tracking-widest text-[#7C5E4C] flex items-center gap-2">
              <Target size={14} className="text-[#64655A]" /> Career Goal
            </label>
            <textarea required className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg px-4 py-3 text-[#1C1C1C] font-body focus:ring-1 focus:ring-[#64655A] outline-none transition-all h-32 resize-none"
              placeholder="What do you want to become?" value={formData.career_goal} onChange={e => setFormData({...formData, career_goal: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full py-4 bg-[#1C1C1C] text-[#F8F4EF] font-headline text-lg rounded-lg hover:bg-[#64655A] transition-all disabled:opacity-50 shadow-lg">
            {loading ? 'Saving Identity...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-16">
      <header className="text-center space-y-4">
        <span className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">Step 2: Connection</span>
        <h2 className="font-headline text-5xl text-[#1C1C1C]">Find Your <span className="italic text-[#64655A]">Guide</span></h2>
        <p className="font-body text-lg text-[#64645E] max-w-xl mx-auto">Connect with a mentor who can help you navigate your path to success.</p>
      </header>

      <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-2xl p-16 text-center space-y-10 shadow-sm">
        {!request ? (
          <>
            <div className="h-24 w-24 bg-[#F8F4EF] border border-[#EBE8E0] rounded-full flex items-center justify-center mx-auto">
              <Send className="text-[#64655A]" size={40} />
            </div>
            <div className="space-y-4">
              <h3 className="font-headline text-3xl text-[#1C1C1C]">Ready to start?</h3>
              <p className="font-body text-[#64645E] max-w-md mx-auto">Your profile is complete. Click below to request a mentor who matches your interests and goals.</p>
            </div>
            <button onClick={handleRequestMentor} disabled={loading}
              className="px-12 py-4 bg-[#1C1C1C] text-[#F8F4EF] font-headline text-lg rounded-lg hover:bg-[#64655A] transition-all disabled:opacity-50 shadow-lg">
              {loading ? 'Requesting...' : 'Request a Mentor'}
            </button>
          </>
        ) : (
          <div className="space-y-10">
            {request.status === 'pending' ? (
              <>
                <div className="h-24 w-24 bg-[#F8F4EF] border border-[#EBE8E0] rounded-full flex items-center justify-center mx-auto">
                  <Clock className="text-[#7C5E4C]" size={40} />
                </div>
                <div className="space-y-4">
                  <h3 className="font-headline text-3xl text-[#1C1C1C]">Request <span className="italic text-[#64655A]">Pending</span></h3>
                  <p className="font-body text-[#64645E] max-w-md mx-auto">We are currently matching you with the best available mentor. This usually takes 24-48 hours.</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-24 w-24 bg-[#F1EDE6] border border-[#EBE8E0] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="text-[#64655A]" size={40} />
                </div>
                <div className="space-y-4">
                  <h3 className="font-headline text-3xl text-[#1C1C1C]">Matched <span className="italic text-[#64655A]">Successfully</span>!</h3>
                  {matchResult ? (
                    <div className="bg-[#F8F4EF] p-8 rounded-xl border border-[#EBE8E0] space-y-4 max-w-lg mx-auto text-left">
                      <div className="flex justify-between items-center">
                        <span className="font-label text-xs uppercase tracking-widest text-[#7C5E4C]">AI Match Result</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${matchResult.match_score >= 70 ? 'bg-emerald-100 text-emerald-700' : matchResult.match_score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {matchResult.match_score}% Match
                        </span>
                      </div>
                      <div>
                        <h4 className="font-headline text-xl text-[#1C1C1C]">{matchResult.mentor_name}</h4>
                        <p className="font-body text-[#64645E] mt-2 leading-relaxed">{matchResult.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="font-body text-[#64645E] max-w-md mx-auto">You have been assigned a mentor. Your journey of growth begins now.</p>
                  )}
                </div>
                <a href="/mentee" className="inline-block px-12 py-4 bg-[#1C1C1C] text-[#F8F4EF] font-headline text-lg rounded-lg hover:bg-[#64655A] transition-all shadow-lg">
                  Go to Dashboard
                </a>
              </>
            )}
          </div>
        )}
      </div>
      {showMatchingAgent && profile && (
        <MatchingAgent profile={profile} onComplete={() => {
          setShowMatchingAgent(false);
          fetchData();
        }} />
      )}
    </div>
  );
}
