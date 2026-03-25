import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { LogOut, Bell, Settings, UserCircle } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menteeLinks = [
    { to: '/mentee', label: 'Dashboard' },
    { to: '/mentee/request', label: 'Mentor' },
    { to: '/mentee/logs', label: 'My Journey' },
  ];

  const mentorLinks = [
    { to: '/mentor', label: 'Dashboard' },
    { to: '/mentor/mentees', label: 'My Mentees' },
    { to: '/mentor/log-meeting', label: 'Log Meeting' },
    { to: '/mentor/logs', label: 'Meeting History' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/pairs', label: 'Pairs' },
    { to: '/admin/meetings', label: 'Meetings' },
    { to: '/admin/requests', label: 'Requests' },
  ];

  const links = user?.role === 'mentee' ? menteeLinks : user?.role === 'mentor' ? mentorLinks : adminLinks;

  return (
    <div className="min-h-screen bg-[#F8F4EF] text-[#1C1C1C] font-body">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#FFFBFF]/80 backdrop-blur-md border-b border-[#EBE8E0]">
        <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="font-headline text-2xl font-bold italic text-[#64655A]">
              Vazhikatigal
            </Link>
            
            <div className="hidden md:flex gap-8 items-center">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`font-headline text-lg tracking-tight transition-all duration-200 ${
                      isActive 
                        ? 'text-[#64655A] border-b-2 border-[#64655A] pb-1' 
                        : 'text-[#7C5E4C] hover:text-[#64655A]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4 items-center text-[#64655A]">
              <button className="p-2 hover:opacity-80 transition-opacity">
                <Bell size={20} />
              </button>
              <button className="p-2 hover:opacity-80 transition-opacity">
                <Settings size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-[#EBE8E0]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-[#7C5E4C] capitalize mt-1">{user?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1 rounded-full border border-[#EBE8E0] hover:bg-[#F1EDE6] transition-colors"
                title="Logout"
              >
                <LogOut size={18} className="text-[#7C5E4C]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#FFFBFF] border-t border-[#EBE8E0] flex justify-around py-4 z-50">
        {links.slice(0, 4).map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link 
              key={link.to}
              to={link.to} 
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#64655A]' : 'text-[#7C5E4C]'}`}
            >
              <span className="text-[10px] font-label font-bold uppercase tracking-tighter">{link.label.slice(0, 4)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
