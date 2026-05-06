import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Package, ArrowRight, User, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

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
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password to continue.');
      return;
    }
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-background text-foreground transition-colors duration-300">
      {/* Left side - Visual Hero */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-indigo-600/90 to-primary/80" />
        <img 
          src="https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1000"
          alt="Clean Tech Workspace" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16">
          <div className="absolute top-12 left-16 flex items-center">
            <div className="p-3 bg-white dark:bg-white/90 rounded-2xl shadow-xl">
              <img 
                src="/census_logo.png" 
                alt="Census Logo" 
                className="h-20 w-auto"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <Package className="w-10 h-10 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">DCO Assam IT Inventory</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            All in one platform <br/> to manage inventory
          </h2>
          <div className="flex gap-4">
            <div className="h-1 w-12 bg-white rounded-full" />
            <div className="h-1 w-4 bg-white/40 rounded-full" />
            <div className="h-1 w-4 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right side - Interactive Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Sign in to manage your digital ecosystem.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder="admin_jane"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-11 pr-12 py-3.5 rounded-2xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-medium flex items-center animate-shake">
                 <Lock className="w-4 h-4 mr-2" />
                 {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full group relative flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-primary/20 dark:shadow-primary/10 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-all duration-300 disabled:opacity-70 transform hover:-translate-y-1"
            >
              {loginMutation.isPending ? 'Verifying...' : (
                <>
                  Sign in to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium tracking-widest">DCO Assam IT Inventory</span>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              disabled
              title="Registration is restricted to administrators"
              className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-accent text-muted-foreground font-bold cursor-not-allowed flex items-center justify-center transition-all"
            >
              Create an account
            </button>
            <p className="text-center text-xs text-muted-foreground italic">
              Public registration is currently disabled. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}