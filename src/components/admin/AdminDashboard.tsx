import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { MentorProfile, MenteeProfile, Meeting, MentorRequest } from '../../types';
import { Users, ClipboardList, Clock, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function AdminDashboard() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [requests, setRequests] = useState<MentorRequest[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: m }, { data: mt }, { data: me }, { data: r }] = await Promise.all([
        supabase.from('mentor_profiles').select('*'),
        supabase.from('mentee_profiles').select('*'),
        supabase.from('meetings').select('*').order('created_at', { ascending: true }),
        supabase.from('mentor_requests').select('*'),
      ]);
      if (m) setMentors(m as MentorProfile[]);
      if (mt) setMentees(mt as MenteeProfile[]);
      if (me) setMeetings(me as Meeting[]);
      if (r) setRequests(r as MentorRequest[]);
    };
    fetchAll();
  }, []);

  const avgScore = meetings.length > 0
    ? Math.round(meetings.reduce((acc, m) => acc + (m.ai_score || 0), 0) / meetings.length)
    : 0;

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const activeMatches = mentees.filter(m => m.assigned_mentor_id).length;

  const chartData = meetings.map(m => ({
    date: new Date(m.scheduled_at).toLocaleDateString(),
    score: m.ai_score
  }));

  const meetingsPerWeek = meetings.reduce((acc: any, m) => {
    const week = new Date(m.scheduled_at).toLocaleDateString();
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(meetingsPerWeek).map(week => ({ week, count: meetingsPerWeek[week] }));

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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatCard icon={<Users className="text-[#64655A]" size={20} />} label="Mentors" value={mentors.length} />
        <StatCard icon={<Users className="text-[#7C5E4C]" size={20} />} label="Mentees" value={mentees.length} />
        <StatCard icon={<Clock className="text-[#64655A]" size={20} />} label="Pending" value={pendingRequests} />
        <StatCard icon={<ClipboardList className="text-[#7C5E4C]" size={20} />} label="Matches" value={activeMatches} />
        <StatCard icon={<TrendingUp className="text-[#64655A]" size={20} />} label="Avg Score" value={`${avgScore}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border border-[#EBE8E0] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-2xl text-[#1C1C1C]">AI Performance Trend</h3>
            <Activity className="text-[#64655A]/20" size={24} />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDE6" vertical={false} />
                <XAxis dataKey="date" stroke="#82807A" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#82807A" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #EBE8E0', borderRadius: '4px' }} itemStyle={{ color: '#64655A', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="score" stroke="#64655A" strokeWidth={3} dot={{ fill: '#64655A', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[#7C5E4C] italic text-center">Average sentiment and engagement scores over time.</p>
        </div>

        <div className="bg-[#FFFFFF] p-8 rounded-xl shadow-sm border border-[#EBE8E0] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-2xl text-[#1C1C1C]">Meetings Activity</h3>
            <ClipboardList className="text-[#7C5E4C]/20" size={24} />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDE6" vertical={false} />
                <XAxis dataKey="week" stroke="#82807A" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#82807A" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #EBE8E0', borderRadius: '4px' }} itemStyle={{ color: '#7C5E4C', fontWeight: 'bold' }} />
                <Bar dataKey="count" fill="#7C5E4C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[#7C5E4C] italic text-center">Frequency of mentorship sessions across the program.</p>
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
