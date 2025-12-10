import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TestOlympiad from "./pages/TestOlympiad";
import EssayOlympiad from "./pages/EssayOlympiad";
import StartOlympiad from "./pages/StartOlympiad";
import Leaderboard from "./pages/Leaderboard";
import Results from "./pages/Results";
import AdminPanel from "./pages/AdminPanel";
import OwnerPanel from "./pages/OwnerPanel";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import CompleteProfile from "./pages/CompleteProfile";
import ResolterPanel from "./pages/ResolterPanel";
import SchoolTeacherPanel from "./pages/SchoolTeacherPanel";
import { USER_ROLES, GOOGLE_CLIENT_ID } from "./utils/constants";
import "./styles/globals.css";
import "./styles/animations.css";

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
        path="/olympiad/:id/start"
        element={
          <ProtectedRoute>
            <StartOlympiad />
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

      <Route
        path="/resolter"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.RESOLTER}>
            <ResolterPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/school-teacher"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.SCHOOL_TEACHER}>
            <SchoolTeacherPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <ProfileEdit />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <ScrollToTop />
            <div className="app">
              <Navbar />
              <main className="main-content">
                <AppRoutes />
              </main>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
