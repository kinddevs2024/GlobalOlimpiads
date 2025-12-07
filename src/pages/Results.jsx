import { useState, useEffect } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { olympiadAPI, adminAPI } from "../services/api";
import { formatDate } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import "./Results.css";

const Results = () => {
  const { id } = useParams(); // olympiadId from URL (optional)
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userResult, setUserResult] = useState(null);
  const [topFive, setTopFive] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [olympiadTitle, setOlympiadTitle] = useState("");
  const [olympiadType, setOlympiadType] = useState("");
  const [allUserResults, setAllUserResults] = useState([]); // For /results page (all results)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      // If olympiad ID is provided, fetch results for that specific olympiad
      fetchResults();
    } else {
      // If no olympiad ID, fetch all user's results
      fetchAllUserResults();
    }
  }, [id, user]);

  const fetchResults = async () => {
    if (!id || !user?._id) {
      setError("Olympiad ID and User ID are required");
      setLoading(false);
      return;
    }

    try {
      // Send both olympiadId and userId to backend
      // Backend returns userResult, topFive, and totalParticipants
      const response = await olympiadAPI.getResults(id, user._id);
      const data = response.data;

      // New API structure
      if (data.success) {
        setUserResult(data.userResult || null);
        setTopFive(data.topFive || []);
        setTotalParticipants(data.totalParticipants || 0);
        setOlympiadTitle(data.olympiadTitle || "");
        setOlympiadType(data.olympiadType || "");
      } else {
        // Fallback to old structure if needed
        const resultsList = data.results || [];
        const olympiadData = data.olympiad;

        if (resultsList.length > 0) {
          // Sort results by score (highest first)
          const sortedResults = [...resultsList].sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
              return b.totalScore - a.totalScore;
            }
            const timeA = new Date(a.completedAt || 0).getTime();
            const timeB = new Date(b.completedAt || 0).getTime();
            return timeA - timeB;
          });

          // Assign ranks
          sortedResults.forEach((r, index) => {
            r.rank = index + 1;
          });

          // Find user result
          const foundUserResult = sortedResults.find((r) => {
            const resultUserId = r.user?._id || r.userId || r.user;
            return (
              resultUserId === user._id || resultUserId === user._id.toString()
            );
          });

          if (foundUserResult) {
            setUserResult(foundUserResult);
          }

          // Get top 5
          setTopFive(sortedResults.slice(0, 5));
          setTotalParticipants(sortedResults.length);
        }

        if (olympiadData) {
          setOlympiadTitle(olympiadData.title || "");
          setOlympiadType(olympiadData.type || "");
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      setError(error.response?.data?.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all user results (for /results page without olympiad ID)
  const fetchAllUserResults = async () => {
    if (!user?._id) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      // Get all submissions for the user
      const response = await adminAPI.getSubmissions(null, user._id);
      const submissions = response.data || [];

      // Get all olympiads to match with submissions
      const olympiadsResponse = await olympiadAPI.getAll();
      const olympiads = olympiadsResponse.data || [];

      // Combine submissions with olympiad data
      const resultsWithOlympiad = submissions.map((submission) => {
        const olympiad = olympiads.find((o) => o._id === submission.olympiadId);
        return {
          ...submission,
          olympiad: olympiad,
          olympiadTitle: olympiad?.title || "Unknown Olympiad",
          olympiadType: olympiad?.type || "test",
        };
      });

      // Sort by submission date (most recent first)
      resultsWithOlympiad.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.completedAt || 0);
        const dateB = new Date(b.submittedAt || b.completedAt || 0);
        return dateB - dateA;
      });

      setAllUserResults(resultsWithOlympiad);
    } catch (error) {
      console.error("Error fetching all user results:", error);
      setError(error.response?.data?.message || "Failed to fetch results");
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

  if (error) {
    return (
      <div className="results-page">
        <div className="container">
          <div className="no-results card">
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/dashboard" className="button-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If no olympiad ID, show all user results
  if (!id) {
    return (
      <div className="results-page">
        <div className="container">
          <div className="results-header">
            <h1 className="results-title text-glow">All Your Results</h1>
            <p className="results-subtitle">View all your olympiad results</p>
          </div>

          {allUserResults.length === 0 ? (
            <div className="no-results card">
              <h2>No Results Found</h2>
              <p>You haven't completed any olympiads yet.</p>
              <Link to="/dashboard" className="button-primary">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="all-results-list">
              {allUserResults.map((resultItem, index) => {
                const percentage = resultItem.olympiad?.totalPoints
                  ? Math.round(
                      (resultItem.totalScore /
                        resultItem.olympiad.totalPoints) *
                        100
                    )
                  : 0;

                return (
                  <div
                    key={resultItem._id || index}
                    className="result-item-card card"
                    onClick={() =>
                      navigate(`/olympiad/${resultItem.olympiadId}/results`)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="result-item-header">
                      <h3 className="result-item-title">
                        {resultItem.olympiadTitle}
                      </h3>
                      <div className="result-item-badge">
                        {resultItem.olympiadType}
                      </div>
                    </div>

                    <div className="result-item-content">
                      <div className="result-item-score">
                        <span className="score-value">
                          {resultItem.totalScore}
                        </span>
                        <span className="score-divider">/</span>
                        <span className="score-total">
                          {resultItem.olympiad?.totalPoints || 100}
                        </span>
                        <span className="score-percentage">
                          ({percentage}%)
                        </span>
                      </div>

                      <div className="result-item-meta">
                        <div className="meta-item">
                          <span className="meta-label">Rank:</span>
                          <span className="meta-value">
                            #{resultItem.rank || "N/A"}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Completed:</span>
                          <span className="meta-value">
                            {resultItem.submittedAt || resultItem.completedAt
                              ? formatDate(
                                  resultItem.submittedAt ||
                                    resultItem.completedAt
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="result-item-action">
                      <span className="action-text">View Details →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If olympiad ID is provided, show specific olympiad results
  if (!userResult) {
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

  const percentage =
    userResult.percentage ||
    (userResult.totalPoints
      ? Math.round((userResult.score / userResult.totalPoints) * 100)
      : 0);

  // Get top 3 from topFive
  const topThree = topFive.slice(0, 3);

  // Check if user is in top 3
  const userInTopThree = userResult.rank <= 3;

  // Helper to get position display
  const getPositionDisplay = (position) => {
    if (position) return position; // Use position from API if available
    // Fallback to generating position
    if (userResult.rank === 1) return "🥇 1st Place";
    if (userResult.rank === 2) return "🥈 2nd Place";
    if (userResult.rank === 3) return "🥉 3rd Place";
    return `#${userResult.rank}`;
  };

  return (
    <div className="results-page">
      <div className="container">
        <div className="results-header">
          <h1 className="results-title text-glow">Your Results</h1>
          {olympiadTitle && (
            <h2 className="results-subtitle">{olympiadTitle}</h2>
          )}
        </div>

        {/* User's Latest Result - Large Section */}
        {userResult && (
          <div className="user-result-large card">
            <div className="user-result-header">
              <h3 className="user-result-title">Your Latest Result</h3>
              <div className="user-rank-badge">
                {userResult.position || getPositionDisplay()}
              </div>
            </div>

            <div className="user-result-content">
              <div className="user-result-main">
                <div className="user-score-large">
                  <div className="score-number">{userResult.score}</div>
                  <div className="score-divider">/</div>
                  <div className="score-total">
                    {userResult.totalPoints || 100}
                  </div>
                </div>
                <div className="user-percentage-large">{percentage}%</div>
              </div>

              <div className="user-result-details">
                <div className="detail-item">
                  <span className="detail-label">Rank</span>
                  <span className="detail-value">
                    {userResult.position || `#${userResult.rank}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Completed</span>
                  <span className="detail-value">
                    {userResult.submittedAt || userResult.completedAt
                      ? formatDate(
                          userResult.submittedAt || userResult.completedAt
                        )
                      : "N/A"}
                  </span>
                </div>
                {totalParticipants > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Total Participants</span>
                    <span className="detail-value">{totalParticipants}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Winners Section */}
        {topThree.length > 0 && (
          <div className="top-three-section">
            <h3 className="section-title">🏆 Top 3 Winners</h3>
            <div className="top-three-grid">
              {topThree.map((topResult, index) => {
                const isCurrentUser =
                  topResult.userId === user._id ||
                  topResult.user?._id === user._id;
                const topPercentage =
                  topResult.percentage ||
                  (topResult.totalPoints
                    ? Math.round(
                        (topResult.score / topResult.totalPoints) * 100
                      )
                    : 0);

                return (
                  <div
                    key={topResult.userId || topResult._id || index}
                    className={`top-three-card card ${
                      isCurrentUser ? "current-user" : ""
                    }`}
                  >
                    <div className="top-three-rank">
                      {topResult.position ||
                        (topResult.rank === 1
                          ? "🥇"
                          : topResult.rank === 2
                          ? "🥈"
                          : "🥉")}
                    </div>
                    <div className="top-three-info">
                      <div className="top-three-name">
                        {isCurrentUser
                          ? "You"
                          : topResult.userName || "Anonymous"}
                      </div>
                      <div className="top-three-score">
                        {topResult.score} / {topResult.totalPoints || 100}
                      </div>
                      <div className="top-three-percentage">
                        {topPercentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User's Position in List (if not in top 3) */}
        {userResult && !userInTopThree && userResult.rank > 3 && (
          <div className="user-position-section">
            <h3 className="section-title">Your Position</h3>
            <div className="user-position-card card highlighted">
              <div className="position-rank">
                {userResult.position || `#${userResult.rank}`}
              </div>
              <div className="position-info">
                <div className="position-name">You</div>
                <div className="position-score">
                  {userResult.score} / {userResult.totalPoints || 100} (
                  {percentage}%)
                </div>
                <div className="position-time">
                  Completed:{" "}
                  {userResult.submittedAt || userResult.completedAt
                    ? formatDate(
                        userResult.submittedAt || userResult.completedAt
                      )
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="results-actions">
          <Link to={`/olympiad/${id}/leaderboard`} className="button-primary">
            View Full Leaderboard
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
