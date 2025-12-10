import { useState, useEffect } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import {
  olympiadAPI,
  adminAPI,
  resolterAPI,
  schoolTeacherAPI,
} from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import NotificationToast from "../../components/NotificationToast";
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
  const [allResults, setAllResults] = useState([]); // For admin/owner: all results for an olympiad
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [editForm, setEditForm] = useState({
    totalScore: "",
    maxScore: "",
    percentage: "",
  });

  // Check if user is admin, owner, resolter, or school teacher (used throughout component)
  const isAdminOrOwner =
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
  const isResolter = user?.role === USER_ROLES.RESOLTER;
  const isSchoolTeacher = user?.role === USER_ROLES.SCHOOL_TEACHER;
  const canViewAllResults = isAdminOrOwner || isResolter || isSchoolTeacher;

  useEffect(() => {
    if (!user) return; // Wait for user to be loaded

    if (id) {
      // If olympiad ID is provided, fetch results for that specific olympiad
      fetchResults();
    } else {
      // If no olympiad ID, fetch all user's results
      fetchAllUserResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?._id, user?.role]);

  const fetchResults = async () => {
    if (!id) {
      setError("Olympiad ID is required");
      setLoading(false);
      return;
    }

    try {
      let data;

      if (canViewAllResults) {
        // For admins/owners/resolters/school teachers: fetch all results for this olympiad
        let submissionsResponse;
        if (isResolter) {
          // Use resolter API endpoint
          submissionsResponse = await resolterAPI.getResults(id);
        } else if (isSchoolTeacher) {
          // Use school teacher API endpoint (filtered by school)
          submissionsResponse = await schoolTeacherAPI.getSchoolResults(id);
        } else {
          // Use admin API endpoint
          submissionsResponse = await adminAPI.getSubmissions(id, null);
        }
        const submissionsData = submissionsResponse?.data;

        // Ensure submissions is always an array
        let submissions = [];
        if (Array.isArray(submissionsData)) {
          submissions = submissionsData;
        } else if (submissionsData && typeof submissionsData === "object") {
          submissions =
            submissionsData.submissions ||
            submissionsData.data ||
            submissionsData.results ||
            [];
        }

        // Final safety check
        if (!Array.isArray(submissions)) {
          console.warn(
            "Submissions is not an array in fetchResults:",
            submissions
          );
          submissions = [];
        }

        // Get olympiad details
        const olympiadResponse = await olympiadAPI.getById(id);
        const olympiad = olympiadResponse?.data;

        // Filter by visibility: students can see results that are:
        // 1. Their own results (always visible to them)
        // 2. Results with status 'checked' AND visible === true (anyone can see)
        // 3. Results with visible === true (if not checked, only visible to admins/resolters)
        let visibleSubmissions = submissions;
        if (!canViewAllResults) {
          visibleSubmissions = submissions.filter((submission) => {
            const isOwnResult =
              submission.userId === user?._id ||
              submission.user?._id === user?._id;
            const isCheckedAndVisible =
              submission.status === "checked" && submission.visible !== false;
            const isVisible = submission.visible !== false;

            return isOwnResult || isCheckedAndVisible || isVisible;
          });
        }

        // Transform submissions to results format - with try-catch protection
        let allResults = [];
        if (visibleSubmissions.length > 0) {
          try {
            allResults = visibleSubmissions.map((submission, index) => ({
              ...submission,
              score: submission.score || submission.totalScore || 0,
              totalScore: submission.totalScore || submission.score || 0,
              totalPoints: olympiad?.totalPoints || 100,
              completedAt: submission.submittedAt || submission.completedAt,
              user: submission.user || { name: "Unknown", email: "Unknown" },
            }));
          } catch (mapError) {
            console.error(
              "Error mapping submissions in fetchResults:",
              mapError,
              "submissions:",
              visibleSubmissions
            );
            allResults = [];
          }
        }

        // Sort by score (highest first)
        if (Array.isArray(allResults)) {
          allResults.sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
              return b.totalScore - a.totalScore;
            }
            const timeA = new Date(a.completedAt || 0).getTime();
            const timeB = new Date(b.completedAt || 0).getTime();
            return timeA - timeB;
          });

          // Assign ranks
          allResults.forEach((r, index) => {
            r.rank = index + 1;
          });
        }

        // Find user result if they participated
        const userResult = Array.isArray(allResults)
          ? allResults.find((r) => {
              const resultUserId = r.user?._id || r.userId || r.user;
              return (
                user?._id &&
                (resultUserId === user._id ||
                  resultUserId === user._id.toString())
              );
            })
          : null;

        data = {
          success: true,
          userResult: userResult || null,
          topFive: Array.isArray(allResults) ? allResults.slice(0, 5) : [],
          totalParticipants: Array.isArray(allResults) ? allResults.length : 0,
          olympiadTitle: olympiad?.title || "",
          olympiadType: olympiad?.type || "",
          allResults: Array.isArray(allResults) ? allResults : [], // Store all results for admin/owner view
        };
      } else {
        // For students: fetch only their result
        if (!user?._id) {
          setError("User ID is required");
          setLoading(false);
          return;
        }
        const response = await olympiadAPI.getResults(id, user._id);
        data = response.data;
      }

      // New API structure
      if (data.success) {
        setUserResult(data.userResult || null);
        setTopFive(data.topFive || []);
        setTotalParticipants(data.totalParticipants || 0);
        setOlympiadTitle(data.olympiadTitle || "");
        setOlympiadType(data.olympiadType || "");
        if (data.allResults) {
          setAllResults(data.allResults);
        }
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
    try {
      setLoading(true);
      setError(null);
      let submissions = [];

      if (canViewAllResults) {
        // For admins/owners/resolters/school teachers: get all submissions from all olympiads
        let response;
        if (isResolter) {
          // Use resolter API endpoint
          response = await resolterAPI.getAllResults();
        } else if (isSchoolTeacher) {
          // Use school teacher API endpoint (filtered by school)
          response = await schoolTeacherAPI.getSchoolResults();
        } else {
          // Use admin API endpoint
          response = await adminAPI.getSubmissions(null, null);
        }

        const submissionsData = response?.data;

        // Handle the resolter API response structure
        // Response format: { success: true, olympiadResults: [{ olympiadId, olympiad, results: [...] }] }
        if (submissionsData && typeof submissionsData === "object") {
          // Check if it's the resolter API format with olympiadResults
          if (
            submissionsData.olympiadResults &&
            Array.isArray(submissionsData.olympiadResults)
          ) {
            // Extract and flatten all results from all olympiads
            submissions = [];
            submissionsData.olympiadResults.forEach((olympiadGroup) => {
              if (
                olympiadGroup.results &&
                Array.isArray(olympiadGroup.results)
              ) {
                // Transform each result to include olympiad info
                olympiadGroup.results.forEach((result) => {
                  submissions.push({
                    ...result,
                    _id: result.resultId || result._id,
                    olympiadId: olympiadGroup.olympiadId,
                    olympiad: olympiadGroup.olympiad,
                    olympiadTitle: olympiadGroup.olympiad?.title,
                    olympiadType: olympiadGroup.olympiad?.type,
                    user: {
                      _id: result.userId,
                      name: result.userName,
                      email: result.userEmail,
                    },
                    totalScore: result.score,
                    submittedAt: result.completedAt,
                    completedAt: result.completedAt,
                  });
                });
              }
            });
          } else if (Array.isArray(submissionsData)) {
            // Direct array of results
            submissions = submissionsData;
          } else {
            // Try to extract from other possible structures
            submissions =
              submissionsData.submissions ||
              submissionsData.data ||
              submissionsData.results ||
              [];
          }
        } else if (Array.isArray(submissionsData)) {
          submissions = submissionsData;
        } else {
          submissions = [];
        }
      } else {
        // For students: get only their submissions
        if (!user?._id) {
          setError("User ID is required");
          setLoading(false);
          return;
        }
        const response = await adminAPI.getSubmissions(null, user._id);
        const submissionsData = response?.data;
        // Ensure submissions is always an array
        if (Array.isArray(submissionsData)) {
          submissions = submissionsData;
        } else if (submissionsData && typeof submissionsData === "object") {
          // If it's an object, try to extract an array from it
          submissions =
            submissionsData.submissions || submissionsData.data || [];
        } else {
          submissions = [];
        }
      }

      // Final safety check - ensure submissions is an array
      if (!Array.isArray(submissions)) {
        console.warn("Submissions is not an array:", submissions);
        submissions = [];
      }

      // Results from resolter API already have olympiad info, so we can use them directly
      // For other APIs, we might need to fetch olympiads separately
      let resultsWithOlympiad = [];

      if (submissions.length > 0) {
        // Check if results already have olympiad info (from resolter API)
        const hasOlympiadInfo =
          submissions[0].olympiad || submissions[0].olympiadTitle;

        if (hasOlympiadInfo) {
          // Results already have olympiad info, use them as-is
          resultsWithOlympiad = submissions.map((submission) => ({
            ...submission,
            olympiadTitle:
              submission.olympiadTitle ||
              submission.olympiad?.title ||
              "Unknown Olympiad",
            olympiadType:
              submission.olympiadType || submission.olympiad?.type || "test",
          }));
        } else {
          // Need to fetch olympiads and match them
          try {
            const olympiadsResponse = await olympiadAPI.getAll();
            const olympiadsData = olympiadsResponse?.data;
            const olympiads = Array.isArray(olympiadsData) ? olympiadsData : [];

            resultsWithOlympiad = submissions.map((submission) => {
              const olympiad = olympiads.find(
                (o) => o._id === submission.olympiadId
              );
              return {
                ...submission,
                olympiad: olympiad,
                olympiadTitle: olympiad?.title || "Unknown Olympiad",
                olympiadType: olympiad?.type || "test",
              };
            });
          } catch (mapError) {
            console.error(
              "Error mapping submissions:",
              mapError,
              "submissions:",
              submissions
            );
            resultsWithOlympiad = [];
          }
        }
      }

      // Filter by visibility: students can see results that are:
      // 1. Their own results (always visible to them)
      // 2. Results with status 'checked' AND visible === true (anyone can see)
      // 3. Results with visible === true (if not checked, only visible to admins/resolters)
      let visibleResults = resultsWithOlympiad;
      if (!canViewAllResults) {
        visibleResults = resultsWithOlympiad.filter((result) => {
          const isOwnResult =
            result.userId === user?._id || result.user?._id === user?._id;
          const isCheckedAndVisible =
            result.status === "checked" && result.visible !== false;
          const isVisible = result.visible !== false;

          return isOwnResult || isCheckedAndVisible || isVisible;
        });
      }

      // Sort by submission date (most recent first)
      if (Array.isArray(visibleResults)) {
        visibleResults.sort((a, b) => {
          const dateA = new Date(a.submittedAt || a.completedAt || 0);
          const dateB = new Date(b.submittedAt || b.completedAt || 0);
          return dateB - dateA;
        });
      }

      setAllUserResults(visibleResults);
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
            <h1 className="results-title text-glow">
              {canViewAllResults ? "All Results" : "All Your Results"}
            </h1>
            <p className="results-subtitle">
              {canViewAllResults
                ? "View all olympiad results from all users"
                : "View all your olympiad results"}
            </p>
          </div>

          {allUserResults.length === 0 ? (
            <div className="no-results card">
              <h2>No Results Found</h2>
              <p>
                {canViewAllResults
                  ? "No olympiad results found yet."
                  : "You haven't completed any olympiads yet."}
              </p>
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
  // For admins/owners/resolters, show all results even if they haven't participated
  if (!userResult && !canViewAllResults) {
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

  // For admins/owners/resolters with no results at all for this olympiad
  if (canViewAllResults && allResults.length === 0 && !userResult) {
    return (
      <div className="results-page">
        <div className="container">
          <div className="no-results card">
            <h2>No Results Found</h2>
            <p>No one has completed this olympiad yet.</p>
            <Link to="/dashboard" className="button-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const percentage = userResult
    ? userResult.percentage ||
      (userResult.totalPoints
        ? Math.round((userResult.score / userResult.totalPoints) * 100)
        : 0)
    : 0;

  // Get top 3 from topFive
  const topThree = topFive.slice(0, 3);

  // Check if user is in top 3
  const userInTopThree = userResult && userResult.rank <= 3;

  const handleEditResult = async (resultId) => {
    if (!editForm.totalScore || isNaN(editForm.totalScore)) {
      setNotification({ message: "Please enter a valid score", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const updateData = {};
      if (editForm.totalScore)
        updateData.totalScore = parseFloat(editForm.totalScore);
      if (editForm.maxScore)
        updateData.maxScore = parseFloat(editForm.maxScore);
      if (editForm.percentage)
        updateData.percentage = parseFloat(editForm.percentage);

      await resolterAPI.editResult(resultId, updateData);

      setNotification({
        message: "Result updated successfully!",
        type: "success",
      });
      setEditingResult(null);
      setEditForm({ totalScore: "", maxScore: "", percentage: "" });

      // Refresh results
      if (id) {
        fetchResults();
      } else {
        fetchAllUserResults();
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to update result",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (result) => {
    setEditingResult(result);
    setEditForm({
      totalScore: result.totalScore || result.score || "",
      maxScore: result.totalPoints || result.maxScore || "",
      percentage: result.percentage || "",
    });
  };

  const closeEditModal = () => {
    setEditingResult(null);
    setEditForm({ totalScore: "", maxScore: "", percentage: "" });
  };

  // Helper to get position display
  const getPositionDisplay = (position) => {
    if (position) return position; // Use position from API if available
    if (!userResult) return "N/A";
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
          <h1 className="results-title text-glow">
            {canViewAllResults ? "All Results" : "Your Results"}
          </h1>
          {olympiadTitle && (
            <h2 className="results-subtitle">{olympiadTitle}</h2>
          )}
        </div>

        {/* Show all results table for admins/owners/resolters */}
        {canViewAllResults && allResults.length > 0 && (
          <div className="all-results-table-section">
            <h3 className="section-title">
              All Participants ({allResults.length})
            </h3>
            <div className="all-results-table card">
              <div
                className={`table-header ${isResolter ? "has-actions" : ""}`}
              >
                <div className="table-cell rank-cell">Rank</div>
                <div className="table-cell name-cell">Name</div>
                <div className="table-cell email-cell">Email</div>
                <div className="table-cell score-cell">Score</div>
                <div className="table-cell time-cell">Completed</div>
                {isResolter && (
                  <div className="table-cell actions-cell">Actions</div>
                )}
              </div>
              <div className="table-body">
                {allResults.map((result, index) => {
                  const resultPercentage = result.totalPoints
                    ? Math.round((result.totalScore / result.totalPoints) * 100)
                    : 0;
                  const isCurrentUser =
                    user?._id &&
                    (result.user?._id === user._id ||
                      result.userId === user._id ||
                      result.userId?.toString() === user._id.toString());

                  return (
                    <div
                      key={result._id || index}
                      className={`table-row ${
                        isCurrentUser ? "current-user-row" : ""
                      } ${index < 3 ? "top-three" : ""} ${
                        isResolter ? "has-actions" : ""
                      }`}
                    >
                      <div className="table-cell rank-cell">
                        <span className="rank-number">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${result.rank || index + 1}`}
                        </span>
                      </div>
                      <div className="table-cell name-cell">
                        {isCurrentUser
                          ? "You"
                          : result.user?.name || "Anonymous"}
                      </div>
                      <div className="table-cell email-cell">
                        {result.user?.email || "-"}
                      </div>
                      <div className="table-cell score-cell">
                        <span className="score-value">{result.totalScore}</span>
                        <span className="score-max">
                          / {result.totalPoints || 100}
                        </span>
                        <span className="score-percentage">
                          ({resultPercentage}%)
                        </span>
                      </div>
                      <div className="table-cell time-cell">
                        {result.completedAt || result.submittedAt
                          ? formatDate(result.completedAt || result.submittedAt)
                          : "-"}
                      </div>
                      {isResolter && (
                        <div className="table-cell actions-cell">
                          <button
                            className="button-small button-primary"
                            onClick={() => openEditModal(result)}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Edit Result Modal for Resolters */}
        {isResolter && editingResult && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Edit Result</h3>
                <button className="modal-close" onClick={closeEditModal}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>User: {editingResult.user?.name || "Anonymous"}</label>
                </div>
                <div className="form-group">
                  <label>Olympiad: {olympiadTitle || "Unknown"}</label>
                </div>
                <div className="form-group">
                  <label>
                    Current Score:{" "}
                    {editingResult.totalScore || editingResult.score || 0}
                    {editingResult.totalPoints &&
                      ` / ${editingResult.totalPoints}`}
                    {editingResult.percentage !== undefined &&
                      ` (${editingResult.percentage}%)`}
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-total-score">Total Score *</label>
                  <input
                    type="number"
                    id="edit-total-score"
                    value={editForm.totalScore}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalScore: e.target.value })
                    }
                    placeholder="Enter total score"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-max-score">Max Score (optional)</label>
                  <input
                    type="number"
                    id="edit-max-score"
                    value={editForm.maxScore}
                    onChange={(e) =>
                      setEditForm({ ...editForm, maxScore: e.target.value })
                    }
                    placeholder="Enter max score"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-percentage">Percentage (optional)</label>
                  <input
                    type="number"
                    id="edit-percentage"
                    value={editForm.percentage}
                    onChange={(e) =>
                      setEditForm({ ...editForm, percentage: e.target.value })
                    }
                    placeholder="Enter percentage"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="button-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  className="button-primary"
                  onClick={() => handleEditResult(editingResult._id)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User's Latest Result - Large Section (only show if user participated) */}
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

        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Results;
