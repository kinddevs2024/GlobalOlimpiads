import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import TestOlympiad from './pages/TestOlympiad';
import EssayOlympiad from './pages/EssayOlympiad';
import Leaderboard from './pages/Leaderboard';
import Results from './pages/Results';
import AdminPanel from './pages/AdminPanel';
import OwnerPanel from './pages/OwnerPanel';
import { USER_ROLES } from './utils/constants';
import './styles/globals.css';
import './styles/animations.css';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} 
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/olympiad/:id"
        element={
          <ProtectedRoute>
            <TestOlympiad />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/olympiad/:id/essay"
        element={
          <ProtectedRoute>
            <EssayOlympiad />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/olympiad/:id/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/olympiad/:id/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.OWNER}>
            <OwnerPanel />
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

