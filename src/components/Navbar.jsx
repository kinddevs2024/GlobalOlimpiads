import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <span className="text-glow">Olympiad</span>
        </Link>
        
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Dashboard</Link>
          
          {user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER ? (
            <Link to="/admin" className="navbar-link">Admin Panel</Link>
          ) : null}
          
          {user?.role === USER_ROLES.OWNER ? (
            <Link to="/owner" className="navbar-link">Owner Panel</Link>
          ) : null}
          
          <Link to="/results" className="navbar-link">Results</Link>
          
          <div className="navbar-user">
            <span className="navbar-username">{user?.email}</span>
            <span className="navbar-role">({user?.role})</span>
          </div>
          
          <button onClick={handleLogout} className="button-secondary navbar-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

