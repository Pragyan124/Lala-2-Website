import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import InstitutionalHeader from '../components/layout/InstitutionalHeader';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/login', { username, password });
      return res.data;
    },
    onSuccess: (data) => {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    },
    onError: () => {
      setError('Invalid credentials.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfc] font-sans">
      {/* Institutional Header at top */}
      <InstitutionalHeader />

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-12">
        {/* Main Title Section */}
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-black text-[#1a3821] tracking-tight">
            Inventory Management System
          </h1>
          <p className="text-sm md:text-base font-bold text-[#3a7d49] uppercase tracking-wider">
            DIRECTORATE OF CENSUS OPERATIONS, ASSAM
          </p>
          <div className="h-[2px] w-48 bg-[#3a7d49]/30 mx-auto rounded-full mt-4" />
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-10 md:p-12 relative overflow-hidden animate-zoom">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#1a3821]" />

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1a3821]">User Login</h2>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3a7d49] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-14 pr-5 py-4 rounded-2xl bg-[#edf2f7] border-transparent focus:bg-white focus:ring-4 focus:ring-[#3a7d49]/10 focus:border-[#3a7d49] transition-all duration-300 outline-none font-medium text-slate-700"
                  placeholder="admin"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3a7d49] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-14 pr-14 py-4 rounded-2xl bg-[#edf2f7] border-transparent focus:bg-white focus:ring-4 focus:ring-[#3a7d49]/10 focus:border-[#3a7d49] transition-all duration-300 outline-none font-medium text-slate-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-[#3a7d49] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-4 px-6 rounded-2xl bg-[#1a3821] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#1a3821]/20 hover:bg-[#122a18] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 flex items-center justify-center space-x-2"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>LOGIN TO PORTAL</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info Section */}
        <div className="flex flex-col items-center space-y-6 text-center animate-slide-down">
          <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
            Secure access to establishment records and digital census archives.
          </p>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 bg-[#edf2f7] rounded-full border border-slate-100 text-[#1a3821]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Secure Data</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-[#edf2f7] rounded-full border border-slate-100 text-[#1a3821]">
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Authorized Only</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}