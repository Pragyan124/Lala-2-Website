import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl shadow-2xl p-10 text-center space-y-8 animate-in fade-in zoom-in duration-500 border border-border transition-colors">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100 rounded-full">
            <ShieldAlert className="w-16 h-16 text-amber-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight transition-colors">
            Password Reset
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed transition-colors">
            For security reasons, password resets are handled manually.
          </p>
        </div>

        <div className="bg-accent rounded-2xl p-6 border border-border transition-colors">
          <div className="flex items-center justify-center space-x-3 text-foreground font-semibold mb-2 transition-colors">
            <Mail className="w-5 h-5 text-primary" />
            <span>Support Required</span>
          </div>
          <p className="text-foreground/80 font-bold text-xl uppercase tracking-wider transition-colors">
            Please contact the administrator
          </p>
          <p className="text-muted-foreground text-sm mt-2 transition-colors">
            They will verify your identity and reset your credentials.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 px-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  );
}
