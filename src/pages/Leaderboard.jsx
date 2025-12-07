import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { olympiadAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const { id } = useParams();
  const { on } = useSocket();
  const [results, setResults] = useState([]);
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    
    if (on) {
      on('leaderboard-update', (data) => {
        if (data.olympiadId === id) {
          setResults(data.results);
        }
      });
    }
  }, [id, on]);

  const fetchLeaderboard = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    try {
      // For leaderboard, we only need olympiadId to get all results
      // Backend returns full list of results for that olympiad
      const response = await olympiadAPI.getResults(id);
      setResults(response.data.results || []);
      setOlympiad(response.data.olympiad);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title text-glow">Leaderboard</h1>
          {olympiad && (
            <h2 className="leaderboard-subtitle">{olympiad.title}</h2>
          )}
        </div>

        <div className="leaderboard-table card">
          <div className="table-header">
            <div className="table-cell rank-cell">Rank</div>
            <div className="table-cell name-cell">Name</div>
            <div className="table-cell email-cell">Email</div>
            <div className="table-cell score-cell">Score</div>
            <div className="table-cell time-cell">Time</div>
          </div>

          {results.length === 0 ? (
            <div className="empty-leaderboard">
              <p>No results yet</p>
            </div>
          ) : (
            <div className="table-body">
              {results.map((result, index) => (
                <div 
                  key={result._id} 
                  className={`table-row ${index < 3 ? 'top-three' : ''}`}
                >
                  <div className="table-cell rank-cell">
                    <span className="rank-number">{getRankIcon(index + 1)}</span>
                  </div>
                  <div className="table-cell name-cell">
                    {result.user?.name || 'Anonymous'}
                  </div>
                  <div className="table-cell email-cell">
                    {result.user?.email || '-'}
                  </div>
                  <div className="table-cell score-cell">
                    <span className="score-value">{result.totalScore}</span>
                    <span className="score-max">/ {olympiad?.totalPoints || 100}</span>
                  </div>
                  <div className="table-cell time-cell">
                    {result.completedAt 
                      ? new Date(result.completedAt).toLocaleTimeString()
                      : '-'
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

