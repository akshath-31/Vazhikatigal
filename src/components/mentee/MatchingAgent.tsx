import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { getLyzrResponse } from '../../lib/lyzr';
import { Send, UserCircle, Bot, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MATCHMAKER_AGENT_ID = import.meta.env.VITE_LYZR_MATCHMAKER_AGENT_ID || '';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function MatchingAgent({ profile, onComplete }: { profile: any, onComplete: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Agaram Matchmaker. I've reviewed your profile. What are you looking for in a mentor? Tell me about your goals or if you have any specific preferences (like language or location)." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [sessionId] = useState(() => `match-session-${Math.random().toString(36).substr(2, 9)}`);
  const [mentors, setMentors] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMentors = async () => {
    const { data } = await supabase.from('mentor_profiles').select('*, users(name)').eq('onboarding_complete', true);
    if (data) setMentors(data);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    const userEmail = user?.email || 'student@agaram.org';
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // If it's the first message, prepend mentor context
      let contextualMessage = userMsg;
      if (messages.length === 1) {
        const mentorContext = mentors.map(m => `- ${m.career_domain} mentor in ${m.location} (ID: ${m.id})`).join('\n');
        contextualMessage = `USER PROFILE: ${JSON.stringify(profile)}\n\nAVAILABLE MENTORS:\n${mentorContext}\n\nUSER MESSAGE: ${userMsg}`;
      }

      const response = await getLyzrResponse(MATCHMAKER_AGENT_ID, sessionId, contextualMessage, userEmail);

      // Extract JSON match from Lyzr response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let cleanText = response.replace(/\{[\s\S]*\}/, '').trim();
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          if (data.mentor_id) {
            console.log("FE MENTOR MATCH DATA RECEIVED", data);
            setMatchData(data);
            setIsFinished(true);
            if (!cleanText) cleanText = "I've found a great match for you! Here are the details:";
          }
        } catch (e) { console.error("Parse match error", e); }
      }

      setMessages(prev => [...prev, { role: 'model', text: cleanText || "I'm still looking at our mentors. Tell me more about your interests." }]);
    } catch (err) {
      console.error("Lyzr AI Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to the matching system. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmMatch = async () => {
    if (!user || !matchData) return;
    setLoading(true);
    
    try {
      // 1. Store match log (This acts as the 'Pending Acceptance' for the mentor)
      await supabase.from('match_logs').insert({
        mentee_id: user.id,
        matched_mentor_id: matchData.mentor_id,
        match_reason: matchData.reason,
        matched_at: new Date().toISOString()
      });

      // 2. Clear old requests and set to matched
      await supabase.from('mentor_requests')
        .update({ status: 'matched' })
        .eq('mentee_id', user.id);

      onComplete();
    } catch (err) {
      console.error("Match saving error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8F4EF] z-50 flex flex-col">
      <header className="p-8 border-b border-[#EBE8E0] bg-[#F8F4EF]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-[#64655A] rounded-lg flex items-center justify-center text-white shadow-sm">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="font-headline text-2xl text-[#1C1C1C]">Expert <span className="italic text-[#64655A]">Matching</span></h2>
            <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Lyzr Assistant</p>
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

        {isFinished && matchData && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl p-10 space-y-8 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-3xl text-[#1C1C1C] flex items-center gap-3">
                <CheckCircle2 className="text-[#64655A]" size={28} />
                <span>Match <span className="italic text-[#64655A]">Found</span></span>
              </h3>
              <Sparkles className="text-[#64655A]/20" size={32} />
            </div>
            <div className="border-y border-[#EBE8E0] py-10">
              <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.2em]">Compatibility Analysis</p>
              <p className="font-body text-[#1C1C1C] text-xl mt-4 leading-relaxed">{matchData.reason}</p>
            </div>
            <button onClick={confirmMatch} disabled={loading}
              className="w-full py-5 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm & Connect with Mentor'}
            </button>
          </motion.div>
        )}
      </div>

      {!isFinished && (
        <div className="p-8 border-t border-[#EBE8E0] bg-[#F8F4EF]">
          <div className="max-w-4xl mx-auto flex gap-6">
            <input className="flex-1 bg-[#FFFFFF] border border-[#EBE8E0] rounded-sm px-8 py-5 text-[#1C1C1C] focus:border-[#64655A] outline-none transition-all font-body text-lg shadow-sm"
              placeholder="Tell me about your ideal mentor..." value={input} onChange={e => setInput(e.target.value)}
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
