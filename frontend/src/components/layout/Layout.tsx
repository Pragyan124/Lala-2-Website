import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, Users, LogOut, Search, Ticket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '../theme/ThemeToggle';

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
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex transition-colors">
        <Link 
          to="/dashboard" 
          className="h-16 flex items-center px-6 border-b hover:bg-accent transition-colors cursor-pointer"
        >
          <Package className="w-6 h-6 mr-2 text-primary" />
          <span className="text-md font-semibold tracking-tight text-card-foreground">DCO Assam IT Inventory</span>
        </Link>
        <nav className="flex-1 p-4 space-y-1">
            <Link to="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-card-foreground transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3 text-muted-foreground" />
            Dashboard
          </Link>
          <Link to="/assets" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-card-foreground transition-colors">
            <Package className="w-5 h-5 mr-3 text-muted-foreground" />
            Assets
          </Link>
          <Link to="/tickets" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-card-foreground transition-colors">
            <Ticket className="w-5 h-5 mr-3 text-muted-foreground" />
            Complaints
          </Link>
          {(user?.role === 'SUPERADMIN' || (user?.role === 'ADMIN' && user?.permitted_type === 'ALL')) && (
            <Link to="/users" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-card-foreground transition-colors">
              <Users className="w-5 h-5 mr-3 text-muted-foreground" />
              Users
            </Link>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center mb-4 px-3">
            <div className={`w-8 h-8 rounded-full ${user?.role === 'SUPERADMIN' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-primary/10 text-primary'} flex items-center justify-center font-bold mr-3 uppercase transition-colors`}>
              {user?.username?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{user?.username}</p>
              <div className="flex flex-col gap-1 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block w-fit transition-colors ${
                  user?.role === 'SUPERADMIN' 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}>
                  {user?.role}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground px-2 uppercase tracking-tight transition-colors">
                  Access: {user?.permitted_type || 'Full'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 transition-colors">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="md:hidden flex items-center space-x-2">
              <div className="p-1.5 bg-primary rounded-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-card-foreground tracking-tight">IT Inventory</span>
            </Link>
            
            <div className="flex items-center bg-accent/50 rounded-md px-3 py-1.5 w-64 md:w-96 border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Search assets, users..." 
                className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <div className="flex items-center ml-4">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
