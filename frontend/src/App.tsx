import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Assets from './pages/Assets';
import Users from './pages/Users';
import Search from './pages/Search';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Tickets from './pages/Tickets';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './components/theme/ThemeProvider';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="it-inventory-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/users" element={<Users />} />
              <Route path="/search" element={<Search />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
