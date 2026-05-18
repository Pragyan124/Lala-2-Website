import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, Users, LogOut, Search, Ticket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '../theme/ThemeToggle';
import InstitutionalHeader from './InstitutionalHeader';


export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!location.pathname.includes('/search')) {
      setSearchQuery('');
    }
  }, [location.pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground transition-colors duration-500 relative">
      {/* Global Tricolor Bar - Absolute at the very top of the screen */}

      {/* Institutional Header */}
      <div className="flex-shrink-0">
        <InstitutionalHeader />
      </div>
      
      <div className="flex flex-1 overflow-hidden relative z-40">

        {/* Sidebar */}
        <aside className="w-72 border-r bg-card flex flex-col hidden md:flex transition-all duration-500 relative z-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(58,125,73,0.03),transparent_50%)] pointer-events-none" />
          
          <Link 
            to="/dashboard" 
            className="h-20 flex items-center px-8 border-b hover:bg-accent/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
            <div className="p-2 bg-primary/10 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-foreground uppercase">DCO Assam</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] -mt-0.5">Inventory Portal</span>
            </div>
          </Link>

          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 ml-2 opacity-50">Navigation</div>
            
            <Link to="/dashboard" className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${location.pathname === '/dashboard' ? 'emerald-gradient text-white shadow-lg shadow-primary/20' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
              <LayoutDashboard className={`w-5 h-5 mr-3 ${location.pathname === '/dashboard' ? 'text-white' : 'text-muted-foreground'}`} />
              Dashboard
            </Link>
            
            <Link to="/assets" className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/assets') ? 'emerald-gradient text-white shadow-lg shadow-primary/20' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
              <Package className={`w-5 h-5 mr-3 ${location.pathname.startsWith('/assets') ? 'text-white' : 'text-muted-foreground'}`} />
              Assets Registry
            </Link>
            
            <Link to="/tickets" className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/tickets') ? 'emerald-gradient text-white shadow-lg shadow-primary/20' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
              <Ticket className={`w-5 h-5 mr-3 ${location.pathname.startsWith('/tickets') ? 'text-white' : 'text-muted-foreground'}`} />
              Complaints Hub
            </Link>

            {(user?.role === 'SUPERADMIN' || (user?.role === 'ADMIN' && user?.permitted_type === 'ALL')) && (
              <>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-8 mb-4 ml-2 opacity-50">Administration</div>
                <Link to="/users" className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${location.pathname.startsWith('/users') ? 'emerald-gradient text-white shadow-lg shadow-primary/20' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                  <Users className={`w-5 h-5 mr-3 ${location.pathname.startsWith('/users') ? 'text-white' : 'text-muted-foreground'}`} />
                  Personnel Control
                </Link>
              </>
            )}
          </nav>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-accent/30 rounded-[1.5rem] border border-border/50 backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl ${user?.role === 'SUPERADMIN' ? 'emerald-gradient' : 'bg-primary/20'} flex items-center justify-center font-black text-white text-lg shadow-lg`}>
                    {user?.username?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-black text-foreground truncate">{user?.username}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{user?.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="flex w-full items-center justify-center px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20">
                <LogOut className="w-4 h-4 mr-2" />
                Terminate Session
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
          <main className="flex-1 overflow-auto p-8 relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10">
              <Outlet />
            </div>
          </main>

          <header className="h-20 glass border-t flex items-center justify-between px-8 relative z-40">
            <div className="flex items-center space-x-6 w-full">
              <Link to="/dashboard" className="md:hidden flex items-center space-x-3">
                <div className="p-2 emerald-gradient rounded-xl shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">DCO Assam</span>
              </Link>
              
              <div className="flex-1 max-w-2xl relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search institutional assets, personnel or records..." 
                  className="w-full bg-accent/20 hover:bg-accent/40 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="h-8 w-[1px] bg-border mx-2 hidden md:block" />
                <ThemeToggle />
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Server Identity</span>
                    <span className="text-xs font-bold text-primary">{user?.username || 'Guest'}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>
    </div>
  );


}
