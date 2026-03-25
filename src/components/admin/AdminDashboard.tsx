import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { MentorProfile, MenteeProfile, Meeting, MentorRequest } from '../../types';
import { Users, ClipboardList, Clock, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function AdminDashboard() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: m }, { data: mt }, { data: me }, { data: matched }] = await Promise.all([
        supabase.from('mentor_profiles').select('*'),
        supabase.from('mentee_profiles').select('*'),
        supabase.from('meetings').select('*').order('created_at', { ascending: false }),
        supabase.from('matches').select('*').order('created_at', { ascending: false }),
      ]);
      if (m) setMentors(m as MentorProfile[]);
      if (mt) setMentees(mt as MenteeProfile[]);
      if (me) setMeetings(me as any[]);
      if (matched) setMatches(matched);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const avgScore = meetings.length > 0
    ? Math.round(meetings.reduce((acc, m: any) => acc + (m.score || 0), 0) / meetings.length)
    : 0;

  const activeMatches = matches.length;

  const chartData = meetings.map((m: any) => ({
    date: new Date(m.created_at).toLocaleDateString(),
    score: m.score
  }));

  const meetingsPerWeek = meetings.reduce((acc: any, m: any) => {
    const week = new Date(m.created_at).toLocaleDateString();
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(meetingsPerWeek).map(week => ({ week, count: meetingsPerWeek[week] }));

  if (loading) return <div className="py-24 text-center font-headline text-2xl text-[#64655A] animate-pulse">Analyzing Program Health...</div>;

  return (
    <div className="space-y-24">
      <header className="max-w-3xl">
        <span className="font-label text-xs text-[#7C5E4C] mb-4 block uppercase tracking-widest">Administrative Overview</span>
        <h1 className="font-headline text-5xl md:text-6xl text-[#1C1C1C] leading-[1.1] mb-6">
          Agaram Foundation <span className="italic text-[#64655A]">Program Health</span>. Monitoring the reach of mentorship.
        </h1>
        <p className="font-body text-lg text-[#64645E] leading-relaxed">
          A comprehensive view of engagement, performance, and impact across the Vazhikatigal platform.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-[#64655A]" size={20} />} label="Mentors" value={mentors.length} />
        <StatCard icon={<Users className="text-[#7C5E4C]" size={20} />} label="Mentees" value={mentees.length} />
        <StatCard icon={<ClipboardList className="text-[#7C5E4C]" size={20} />} label="Total Matches" value={activeMatches} />
        <StatCard icon={<TrendingUp className="text-[#64655A]" size={20} />} label="Engagement Score" value={`${avgScore}%`} />
      </div>

      <div className="space-y-12">
        <h2 className="font-headline text-3xl text-[#1C1C1C]">Mentor-Mentee <span className="italic text-[#64655A]">Pairs</span></h2>
        <div className="bg-[#FFFFFF] border border-[#EBE8E0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left font-body">
            <thead className="bg-[#F8F4EF] border-b border-[#EBE8E0]">
              <tr>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7C5E4C]">Mentee</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7C5E4C]">Mentor</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7C5E4C]">Match Score</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7C5E4C]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1EDE6]">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-[#F8F4EF]/50 transition-colors">
                  <td className="px-6 py-4 text-[#1C1C1C] font-medium">Mentee ID: {match.mentee_id.split('-')[0]}...</td>
                  <td className="px-6 py-4 text-[#64645E]">{match.mentor_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${match.match_score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {match.match_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] uppercase tracking-widest text-[#64655A]">Active</td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-[#64645E] italic">No active matches found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-12">
        <h2 className="font-headline text-3xl text-[#1C1C1C]">Meeting <span className="italic text-[#64655A]">Logs</span></h2>
        <div className="grid gap-6">
          {meetings.map((meeting: any) => (
            <div key={meeting.id} className="bg-[#FFFFFF] border border-[#EBE8E0] p-8 rounded-xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-headline text-xl text-[#1C1C1C]">Meeting with {meeting.mentor_name}</h4>
                  <p className="text-[10px] text-[#7C5E4C] uppercase tracking-[0.15em] mt-1">{new Date(meeting.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${meeting.score >= 70 ? 'bg-emerald-100 text-emerald-700' : meeting.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {meeting.score}% Growth
                </span>
              </div>
              <p className="font-body text-[#64645E] leading-relaxed italic">"{meeting.review}"</p>
              <div className="pt-4 border-t border-[#F1EDE6]">
                <p className="text-xs text-[#1C1C1C] font-bold mb-2">AI Analysis:</p>
                <p className="text-sm text-[#64645E]">{meeting.description}</p>
              </div>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="bg-[#F8F4EF] p-12 text-center rounded-xl border border-[#EBE8E0] text-[#64645E] italic">
              No meetings have been logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-[#FFFFFF] p-6 rounded-xl shadow-sm border border-[#EBE8E0] flex flex-col justify-between h-32">
      <div className="opacity-60">{icon}</div>
      <div>
        <p className="font-headline text-3xl text-[#1C1C1C]">{value}</p>
        <p className="font-label text-[10px] text-[#7C5E4C] uppercase tracking-[0.15em] mt-1">{label}</p>
      </div>
    </div>
  );
}
