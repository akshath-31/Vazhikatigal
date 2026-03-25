import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../App';
import { MentorProfile, MenteeProfile } from '../../types';
import { GraduationCap, Target, Languages, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MentorMentees() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);

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

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Mentee Management</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Your <span className="italic text-[#64655A]">Mentees</span>. Guiding the next generation of leaders.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          Manage and support your assigned students. Track their progress and provide the guidance they need.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        {mentees.map(mentee => (
          <div key={mentee.id} className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border border-[#EBE8E0] space-y-8 group hover:shadow-md transition-all">
            <div className="flex items-center space-x-6">
              <div className="h-16 w-16 rounded-lg bg-[#F1EDE6] flex items-center justify-center text-[#64655A]">
                <User size={32} />
              </div>
              <div>
                <h3 className="font-headline text-2xl text-[#1C1C1C]">{mentee.grade} Student</h3>
                <p className="text-sm text-[#7C5E4C] font-medium uppercase tracking-wider">{mentee.location}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 py-6 border-y border-[#F1EDE6]">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#7C5E4C] font-label text-[10px] uppercase tracking-widest">
                  <Target size={12} /><span>Career Goal</span>
                </div>
                <p className="text-sm text-[#1C1C1C] font-medium italic">{mentee.career_goal}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#7C5E4C] font-label text-[10px] uppercase tracking-widest">
                  <Languages size={12} /><span>Language</span>
                </div>
                <p className="text-sm text-[#1C1C1C] font-medium italic">{mentee.language_preference}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-[#7C5E4C] font-label text-[10px] uppercase tracking-widest">
                <GraduationCap size={12} /><span>Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mentee.interests.map(interest => (
                  <span key={interest} className="px-3 py-1 bg-[#F7F3EC] text-[#64655A] text-xs font-medium rounded-full border border-[#EBE8E0]">{interest}</span>
                ))}
              </div>
            </div>
            <div className="pt-4">
              <Link to="/mentor/log-meeting" className="w-full py-4 bg-[#64655A] text-white font-medium rounded-sm hover:bg-[#58594E] transition-all flex items-center justify-center gap-2 group-hover:gap-4">
                Log a Meeting <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ))}
        {mentees.length === 0 && (
          <div className="col-span-2 p-24 text-center border border-dashed border-[#EBE8E0] rounded-2xl bg-[#FFFFFF]/50">
            <p className="text-[#7C5E4C] font-headline text-xl italic">No mentees assigned yet. We'll notify you when a match is found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
