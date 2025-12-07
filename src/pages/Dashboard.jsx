import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { olympiadAPI } from '../services/api';
import { formatDate, isOlympiadActive, isOlympiadUpcoming, isOlympiadEnded } from '../utils/helpers';
import { OLYMPIAD_TYPES, USER_ROLES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, upcoming, ended

  useEffect(() => {
    fetchOlympiads();
  }, []);

  const fetchOlympiads = async () => {
    try {
      const response = await olympiadAPI.getAll();
      setOlympiads(response.data);
    } catch (error) {
      console.error('Error fetching olympiads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOlympiads = () => {
    // Show all olympiads to owners and admins, only published to students
    const isAdminOrOwner = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
    const visibleOlympiads = isAdminOrOwner 
      ? olympiads 
      : olympiads.filter(olympiad => olympiad.status === 'published');
    
    if (filter === 'all') return visibleOlympiads;
    return visibleOlympiads.filter(olympiad => {
      if (filter === 'active') return isOlympiadActive(olympiad.startTime, olympiad.endTime);
      if (filter === 'upcoming') return isOlympiadUpcoming(olympiad.startTime);
      if (filter === 'ended') return isOlympiadEnded(olympiad.endTime);
      return true;
    });
  };

  const getStatusBadge = (olympiad) => {
    if (isOlympiadActive(olympiad.startTime, olympiad.endTime)) {
      return <span className="status-badge status-active">Active</span>;
    }
    if (isOlympiadUpcoming(olympiad.startTime)) {
      return <span className="status-badge status-upcoming">Upcoming</span>;
    }
    return <span className="status-badge status-ended">Ended</span>;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const filteredOlympiads = getFilteredOlympiads();

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title text-glow">Olympiad Dashboard</h1>
          <p className="dashboard-subtitle">Select an olympiad to participate</p>
        </div>

        <div className="dashboard-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-button ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`filter-button ${filter === 'ended' ? 'active' : ''}`}
            onClick={() => setFilter('ended')}
          >
            Ended
          </button>
        </div>

        <div className="olympiads-grid">
          {filteredOlympiads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No olympiads found</h3>
              <p>There are no olympiads matching your filter.</p>
            </div>
          ) : (
            filteredOlympiads.map((olympiad) => (
              <Link
                key={olympiad._id}
                to={`/olympiad/${olympiad._id}/start`}
                className="olympiad-card card card-interactive"
              >
                <div className="olympiad-card-header">
                  <h3 className="olympiad-title">{olympiad.title}</h3>
                  {getStatusBadge(olympiad)}
                </div>

                <div className="olympiad-meta">
                  <div className="olympiad-meta-item">
                    <span className="meta-label">Subject:</span>
                    <span className="meta-value">{olympiad.subject}</span>
                  </div>
                  <div className="olympiad-meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{olympiad.type}</span>
                  </div>
                  <div className="olympiad-meta-item">
                    <span className="meta-label">Duration:</span>
                    <span className="meta-value">{Math.floor(olympiad.duration / 60)} minutes</span>
                  </div>
                </div>

                <div className="olympiad-dates">
                  <div className="date-item">
                    <span className="date-label">Starts:</span>
                    <span className="date-value">{formatDate(olympiad.startTime)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Ends:</span>
                    <span className="date-value">{formatDate(olympiad.endTime)}</span>
                  </div>
                </div>

                <div className="olympiad-action">
                  {isOlympiadActive(olympiad.startTime, olympiad.endTime) ? (
                    <span className="action-text">Start Now →</span>
                  ) : isOlympiadUpcoming(olympiad.startTime) ? (
                    <span className="action-text">Coming Soon</span>
                  ) : (
                    <span className="action-text">View Results →</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

