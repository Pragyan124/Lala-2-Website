import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Package, ArrowLeft, User, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [permittedType, setPermittedType] = useState('ALL');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const userStr = sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const handleSignup = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      console.log('Attempting signup for:', username);
      const response = await api.post('/auth/signup', { username, password, role, permitted_type: permittedType });
      console.log('Signup response:', response.data);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Signup error detail:', err);
      const serverError = err.response?.data?.error;
      const status = err.response?.status;
      setError(serverError || `Connection error (Status: ${status || 'N/A'}). Is the server running?`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 transition-colors">
        <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl shadow-2xl p-10 text-center space-y-6 border border-border">
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 rounded-full animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Account Created!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your account has been created successfully. You can now use your credentials to access the dashboard.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 px-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 dark:shadow-primary/10 flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-background text-foreground transition-colors duration-300">
      {/* Left side - Visual Hero */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-indigo-600/90 to-primary/80" />
        <img 
          src="/signup.png"
          alt="Clean Tech Workspace" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <Package className="w-10 h-10 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">DCO Assam IT Inventory</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Start managing IT assets today.
          </h2>
          
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center text-sm font-bold text-primary mb-8 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Create Account
            </h1>
            <p className="text-muted-foreground text-lg">
              Fill in your details to get started.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Desired Username</label>
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

            {currentUser?.role === 'SUPERADMIN' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground ml-1">Assign User Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full px-4 py-3.5 rounded-2xl border border-input bg-card text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium"
                  >
                    <option value="USER">Standard User (Assets Only)</option>
                    <option value="ADMIN">Administrator (Can add users)</option>
                    <option value="SUPERADMIN">SuperAdmin (Full Master Access)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground ml-1">Permitted Asset Category</label>
                  <select
                    value={permittedType}
                    onChange={(e) => setPermittedType(e.target.value)}
                    className="block w-full px-4 py-3.5 rounded-2xl border border-input bg-card text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium"
                  >
                    <option value="ALL">Full Access (All Types)</option>
                    <option value="MACHINE">Machines Only</option>
                    <option value="NETWORK">Networks Only</option>
                    <option value="PRINTER">Printers Only</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground ml-1 italic">Determines which items this user can Create/Edit/Delete</p>
                </div>
              </>
            )}

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
                  onChange={(e) => setPassword(e.target.value)}
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

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-medium flex items-center transition-colors">
                <Lock className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-primary/20 dark:shadow-primary/10 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-70"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
