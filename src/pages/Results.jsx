import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { olympiadAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import './Results.css';

const Results = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await olympiadAPI.getResults(id);
      const results = response.data.results || [];
      const userResult = results.find(r => r.user?._id === localStorage.getItem('userId')) || results[0];
      setResult(userResult);
      setOlympiad(response.data.olympiad);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-page">
        <div className="container">
          <div className="no-results card">
            <h2>No Results Found</h2>
            <p>You haven't completed this olympiad yet.</p>
            <Link to="/dashboard" className="button-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const percentage = olympiad?.totalPoints 
    ? Math.round((result.totalScore / olympiad.totalPoints) * 100)
    : 0;

  return (
    <div className="results-page">
      <div className="container">
        <div className="results-header">
          <h1 className="results-title text-glow">Your Results</h1>
          {olympiad && (
            <h2 className="results-subtitle">{olympiad.title}</h2>
          )}
        </div>

        <div className="results-summary card">
          <div className="summary-item">
            <div className="summary-label">Total Score</div>
            <div className="summary-value score-value">
              {result.totalScore} / {olympiad?.totalPoints || 100}
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">Percentage</div>
            <div className="summary-value percentage-value">
              {percentage}%
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">Rank</div>
            <div className="summary-value rank-value">
              #{result.rank || 'N/A'}
            </div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">Completed At</div>
            <div className="summary-value time-value">
              {result.completedAt ? formatDate(result.completedAt) : 'N/A'}
            </div>
          </div>
        </div>

        <div className="results-actions">
          <Link to={`/olympiad/${id}/leaderboard`} className="button-primary">
            View Leaderboard
          </Link>
          <Link to="/dashboard" className="button-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Results;

