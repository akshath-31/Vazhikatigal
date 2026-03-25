import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { getOnboardingAgentResponse } from '../../lib/gemini';
import { Send, UserCircle, Bot, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function OnboardingAgent({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your onboarding assistant for Agaram Foundation. We're so glad you're joining us as a mentor. To get started, what skills can you mentor students in?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userMsg }] });

      const response = await getOnboardingAgentResponse(history);

      try {
        const data = JSON.parse(response);
        setProfileData(data);
        setIsFinished(true);
        setMessages(prev => [...prev, { role: 'model', text: "Great! I've collected all your information. Here's a summary of your profile. Does everything look correct?" }]);
      } catch {
        setMessages(prev => [...prev, { role: 'model', text: response }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Could you please try again?" }]);
    }
    setLoading(false);
  };

  const confirmOnboarding = async () => {
    if (!user || !profileData) return;
    setLoading(true);
    const { error } = await supabase.from('mentor_profiles').insert({
      user_id: user.id,
      skills: profileData.skills,
      languages: profileData.languages,
      location: profileData.location,
      career_domain: profileData.career_domain,
      max_mentees: profileData.max_mentees,
      bio: `Experienced mentor in ${profileData.career_domain} based in ${profileData.location}.`,
      onboarding_complete: true,
      availability_slots: []
    });
    if (!error) onComplete();
    else console.error(error);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#F8F4EF] z-50 flex flex-col">
      <header className="p-8 border-b border-[#EBE8E0] bg-[#F8F4EF]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-[#64655A] rounded-lg flex items-center justify-center text-white shadow-sm">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="font-headline text-2xl text-[#1C1C1C]">Mentor <span className="italic text-[#64655A]">Onboarding</span></h2>
            <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Conversational Assistant</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 max-w-4xl mx-auto w-full scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-[#FFFFFF] border-[#EBE8E0]' : 'bg-[#F1EDE6] border-[#EBE8E0]'}`}>
                  {msg.role === 'user' ? <UserCircle size={20} className="text-[#7C5E4C]" /> : <Bot size={20} className="text-[#64655A]" />}
                </div>
                <div className={`p-6 rounded-xl text-lg leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#64655A] text-white font-body' : 'bg-[#FFFFFF] text-[#1C1C1C] border border-[#EBE8E0] font-body'}`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isFinished && profileData && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl p-10 space-y-8 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-3xl text-[#1C1C1C] flex items-center gap-3">
                <CheckCircle2 className="text-[#64655A]" size={28} />
                <span>Profile <span className="italic text-[#64655A]">Summary</span></span>
              </h3>
              <Sparkles className="text-[#64655A]/20" size={32} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-y border-[#EBE8E0] py-10">
              <div className="space-y-2">
                <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Career Domain</p>
                <p className="font-headline text-xl text-[#1C1C1C]">{profileData.career_domain}</p>
              </div>
              <div className="space-y-2">
                <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Location</p>
                <p className="font-headline text-xl text-[#1C1C1C]">{profileData.location}</p>
              </div>
              <div className="space-y-2">
                <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Skills</p>
                <p className="font-body text-[#64645E] leading-relaxed">{profileData.skills?.join(', ')}</p>
              </div>
              <div className="space-y-2">
                <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Languages</p>
                <p className="font-body text-[#64645E] leading-relaxed">{profileData.languages?.join(', ')}</p>
              </div>
              <div className="space-y-2">
                <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Max Mentees</p>
                <p className="font-headline text-xl text-[#1C1C1C]">{profileData.max_mentees}</p>
              </div>
            </div>
            <button onClick={confirmOnboarding} disabled={loading}
              className="w-full py-5 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs shadow-sm">
              {loading ? 'Saving Profile...' : 'Confirm & Start Mentoring'}
            </button>
          </motion.div>
        )}
      </div>

      {!isFinished && (
        <div className="p-8 border-t border-[#EBE8E0] bg-[#F8F4EF]">
          <div className="max-w-4xl mx-auto flex gap-6">
            <input className="flex-1 bg-[#FFFFFF] border border-[#EBE8E0] rounded-sm px-8 py-5 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all font-body text-lg shadow-sm"
              placeholder="Type your answer..." value={input} onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              className="h-16 w-16 bg-[#64655A] text-white rounded-sm flex items-center justify-center hover:bg-[#58594E] transition-all disabled:opacity-50 shadow-sm">
              <Send size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
