import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabase';
import { UserRole } from '../../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';

export function AuthPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Admin hardcoded credentials
  const ADMIN_EMAIL = 's.akshath31@gmail.com';
  const ADMIN_PASSWORD = 'Akshath3155!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Extra check for admin role
        if (role === 'admin') {
          if (formData.email !== ADMIN_EMAIL) {
            throw new Error('Only the designated admin email can access this portal.');
          }
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;
        if (!data.user) throw new Error('Sign in failed');

        // Verify the role matches
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userData && userData.role !== role) {
          await supabase.auth.signOut();
          throw new Error(`This account is registered as a ${userData.role}, not a ${role}.`);
        }

        navigate(`/${role}`);
      } else {
        if (role === 'admin') {
          throw new Error('Admin registration is not allowed.');
        }

        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Sign up failed');

        // Update the user row created by the auth trigger with the correct name and role
        const { error: updateError } = await supabase
          .from('users')
          .update({ name: formData.name, role: role as UserRole })
          .eq('id', data.user.id);

        if (updateError) throw updateError;

        navigate(`/${role}`);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    }

    setLoading(false);
  };

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  return (
    <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <span className="font-label text-xs text-[#7C5E4C] uppercase tracking-widest">
            {roleLabel} Portal
          </span>
          <h2 className="font-headline text-5xl text-[#1C1C1C]">
            {isLogin ? 'Sign In' : 'Join Us'}
          </h2>
          <p className="text-[#64645E]">
            {isLogin
              ? `Enter your details to access your ${roleLabel} dashboard.`
              : `Create your account to start your journey as a ${roleLabel}.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#EBE8E0] p-8 rounded-2xl shadow-sm space-y-6">
          {!isLogin && role !== 'admin' && (
            <div className="space-y-2">
              <label className="text-[10px] font-label text-[#7C5E4C]">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82807A]" size={18} />
                <input
                  type="text"
                  required
                  className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg pl-10 pr-4 py-3 text-sm focus:border-[#64655A] outline-none transition-all"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-label text-[#7C5E4C]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82807A]" size={18} />
              <input
                type="email"
                required
                className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg pl-10 pr-4 py-3 text-sm focus:border-[#64655A] outline-none transition-all"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-label text-[#7C5E4C]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82807A]" size={18} />
              <input
                type="password"
                required
                className="w-full bg-[#F8F4EF] border border-[#EBE8E0] rounded-lg pl-10 pr-4 py-3 text-sm focus:border-[#64655A] outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-4 bg-[#64655A] text-white rounded-lg font-headline flex items-center justify-center gap-2 hover:bg-[#58594E] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {role !== 'admin' && (
          <p className="text-center text-sm text-[#64645E]">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-[#64655A] font-bold hover:underline"
            >
              {isLogin ? 'Register now' : 'Sign in here'}
            </button>
          </p>
        )}

        <p className="text-center">
          <button onClick={() => navigate('/')} className="text-xs text-[#82807A] hover:text-[#64655A] transition-colors">
            ← Back to Landing
          </button>
        </p>
      </div>
    </div>
  );
}
