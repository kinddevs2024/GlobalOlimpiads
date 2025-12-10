import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { olympiadAPI, adminAPI } from "../../services/api";
import {
  formatDate,
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded,
} from "../../utils/helpers";
import { OLYMPIAD_TYPES, USER_ROLES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [olympiadDetails, setOlympiadDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Determine user role
  const isAdminOrOwner =
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
  const isStudent = user?.role === USER_ROLES.STUDENT;

  // Students default to seeing active olympiads (null = active), admins/owners see all
  const [filter, setFilter] = useState(isAdminOrOwner ? "all" : null);

  useEffect(() => {
    fetchOlympiads();
  }, []);

  const fetchOlympiads = async () => {
    try {
      let response;
      if (isAdminOrOwner) {
        // Admins and owners should see ALL olympiads (including drafts, unpublished, etc.)
        response = await adminAPI.getAllOlympiads();
      } else {
        // Students only see published olympiads
        response = await olympiadAPI.getAll();
      }
      setOlympiads(response.data);
    } catch (error) {
      console.error("Error fetching olympiads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get olympiads by status
  const getVisibleOlympiads = () => {
    if (isAdminOrOwner) {
      // Admins and owners see ALL olympiads without any filtering
      return olympiads;
    } else {
      // Students only see published olympiads
      return olympiads.filter((olympiad) => olympiad.status === "published");
    }
  };

  const getActiveOlympiads = () => {
    return getVisibleOlympiads().filter((olympiad) =>
      isOlympiadActive(olympiad.startTime, olympiad.endTime)
    );
  };

  const getUpcomingOlympiads = () => {
    return getVisibleOlympiads().filter((olympiad) =>
      isOlympiadUpcoming(olympiad.startTime)
    );
  };

  const getEndedOlympiads = () => {
    return getVisibleOlympiads().filter((olympiad) =>
      isOlympiadEnded(olympiad.endTime)
    );
  };

  const getFilteredOlympiads = () => {
    const visibleOlympiads = getVisibleOlympiads();

    // Apply filter for admins/owners
    if (filter === "all") return visibleOlympiads;
    if (filter === "active") return getActiveOlympiads();
    if (filter === "upcoming") return getUpcomingOlympiads();
    if (filter === "ended") return getEndedOlympiads();

    return visibleOlympiads;
  };

  // Get time-based status badge (Active, Upcoming, Ended)
  const getTimeStatusBadge = (olympiad) => {
    if (isOlympiadActive(olympiad.startTime, olympiad.endTime)) {
      return <span className="status-badge status-active">Active</span>;
    }
    if (isOlympiadUpcoming(olympiad.startTime)) {
      return <span className="status-badge status-upcoming">Upcoming</span>;
    }
    return <span className="status-badge status-ended">Ended</span>;
  };

  // Get olympiad status badge (Draft, Published, Unpublished) - for admins/owners
  const getOlympiadStatusBadge = (status) => {
    if (!isAdminOrOwner) return null;

    const statusMap = {
      published: { label: "Published", class: "status-published" },
      unpublished: { label: "Unpublished", class: "status-unpublished" },
      draft: { label: "Draft", class: "status-draft" },
    };
    const statusInfo = statusMap[status] || statusMap["draft"];
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Handle olympiad click - open modal for admins/owners, navigate for students
  const handleOlympiadClick = async (olympiad) => {
    if (isAdminOrOwner) {
      setSelectedOlympiad(olympiad);
      setLoadingDetails(true);
      try {
        // Fetch full olympiad details including questions
        const response = await adminAPI.getOlympiadById(olympiad._id);
        const details = response.data.data || response.data;
        const questionsResponse = await adminAPI.getQuestions(olympiad._id);
        setOlympiadDetails({
          ...details,
          questions: questionsResponse.data || [],
        });
      } catch (error) {
        console.error("Error fetching olympiad details:", error);
        setOlympiadDetails(olympiad); // Fallback to basic data
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedOlympiad(null);
    setOlympiadDetails(null);
  };

  // Render olympiad card component
  const renderOlympiadCard = (olympiad) => {
    const cardContent = (
      <>
        <div className="olympiad-card-header">
          <h3 className="olympiad-title">{olympiad.title}</h3>
          <div className="status-badges-container">
            {getOlympiadStatusBadge(olympiad.status)}
            {getTimeStatusBadge(olympiad)}
          </div>
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
            <span className="meta-value">
              {Math.floor(olympiad.duration / 60)} minutes
            </span>
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
          {isAdminOrOwner ? (
            <span className="action-text">View Details →</span>
          ) : isOlympiadActive(olympiad.startTime, olympiad.endTime) ? (
            <span className="action-text">Start Now →</span>
          ) : isOlympiadUpcoming(olympiad.startTime) ? (
            <span className="action-text">Coming Soon</span>
          ) : (
            <span className="action-text">View Results →</span>
          )}
        </div>
      </>
    );

    // For students: use Link to navigate
    if (isStudent) {
      return (
        <Link
          key={olympiad._id}
          to={`/olympiad/${olympiad._id}/start`}
          className="olympiad-card card card-interactive"
        >
          {cardContent}
        </Link>
      );
    }

    // For admins/owners: use button to open modal
    return (
      <div
        key={olympiad._id}
        onClick={() => handleOlympiadClick(olympiad)}
        className="olympiad-card card card-interactive"
        style={{ cursor: "pointer" }}
      >
        {cardContent}
      </div>
    );
  };

  // Render section with olympiads
  const renderOlympiadSection = (
    title,
    subtitle,
    olympiadsList,
    emptyMessage
  ) => {
    if (olympiadsList.length === 0) {
      return null; // Don't show empty sections
    }

    return (
      <div className="olympiad-section">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="olympiads-grid">
          {olympiadsList.map((olympiad) => renderOlympiadCard(olympiad))}
        </div>
      </div>
    );
  };

  const filteredOlympiads = getFilteredOlympiads();
  const activeOlympiads = getActiveOlympiads();
  const upcomingOlympiads = getUpcomingOlympiads();
  const endedOlympiads = getEndedOlympiads();

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title text-glow">Olympiad Dashboard</h1>
          <p className="dashboard-subtitle">
            {isStudent
              ? filter === null
                ? "Active olympiads you can participate in right now"
                : filter === "upcoming"
                ? "Upcoming olympiads that will start soon"
                : "Finished olympiads you have completed"
              : "Select an olympiad to manage"}
          </p>
        </div>

        {isStudent ? (
          // Student view: Show filter tabs to choose between Active, Upcoming, and Ended
          <>
            <div className="dashboard-filters">
              <button
                className={`filter-button ${filter === null ? "active" : ""}`}
                onClick={() => setFilter(null)}
              >
                Active
              </button>
              <button
                className={`filter-button ${
                  filter === "upcoming" ? "active" : ""
                }`}
                onClick={() => setFilter("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`filter-button ${
                  filter === "ended" ? "active" : ""
                }`}
                onClick={() => setFilter("ended")}
              >
                Ended
              </button>
            </div>

            <div className="olympiads-grid">
              {(() => {
                let displayOlympiads = [];
                let emptyMessage = "";

                if (filter === null) {
                  // Show active olympiads (default)
                  displayOlympiads = activeOlympiads;
                  emptyMessage = "No active olympiads available at this time.";
                } else if (filter === "upcoming") {
                  // Show upcoming olympiads
                  displayOlympiads = upcomingOlympiads;
                  emptyMessage = "No upcoming olympiads.";
                } else if (filter === "ended") {
                  // Show ended olympiads
                  displayOlympiads = endedOlympiads;
                  emptyMessage = "No finished olympiads.";
                }

                if (displayOlympiads.length === 0) {
                  return (
                    <div className="empty-state">
                      <div className="empty-icon">📚</div>
                      <h3>No olympiads found</h3>
                      <p>{emptyMessage}</p>
                    </div>
                  );
                }

                return displayOlympiads.map((olympiad) =>
                  renderOlympiadCard(olympiad)
                );
              })()}
            </div>
          </>
        ) : (
          // Admin/Owner view: Show filter tabs
          <>
            <div className="dashboard-filters">
              <button
                className={`filter-button ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`filter-button ${
                  filter === "active" ? "active" : ""
                }`}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                className={`filter-button ${
                  filter === "upcoming" ? "active" : ""
                }`}
                onClick={() => setFilter("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`filter-button ${
                  filter === "ended" ? "active" : ""
                }`}
                onClick={() => setFilter("ended")}
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
                filteredOlympiads.map((olympiad) =>
                  renderOlympiadCard(olympiad)
                )
              )}
            </div>
          </>
        )}

        {/* Olympiad Details Modal for Admins/Owners */}
        {isAdminOrOwner && selectedOlympiad && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">{selectedOlympiad.title}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              {loadingDetails ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="modal-body">
                  {/* Status Badges */}
                  <div className="modal-badges">
                    {getOlympiadStatusBadge(selectedOlympiad.status)}
                    {getTimeStatusBadge(selectedOlympiad)}
                  </div>

                  {/* Basic Information */}
                  <div className="modal-section">
                    <h3 className="section-title">📋 Basic Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Subject:</span>
                        <span className="info-value">
                          {selectedOlympiad.subject}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Type:</span>
                        <span className="info-value">
                          {selectedOlympiad.type}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Duration:</span>
                        <span className="info-value">
                          {Math.floor(selectedOlympiad.duration / 60)} minutes
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value">
                          {selectedOlympiad.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {olympiadDetails?.description && (
                    <div className="modal-section">
                      <h3 className="section-title">📝 Description</h3>
                      <p className="description-text">
                        {olympiadDetails.description}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="modal-section">
                    <h3 className="section-title">📅 Schedule</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Start Time:</span>
                        <span className="info-value">
                          {formatDate(selectedOlympiad.startTime)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">End Time:</span>
                        <span className="info-value">
                          {formatDate(selectedOlympiad.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  {olympiadDetails?.questions && (
                    <div className="modal-section">
                      <h3 className="section-title">
                        ❓ Questions ({olympiadDetails.questions.length})
                      </h3>
                      <div className="questions-preview">
                        {olympiadDetails.questions.length > 0 ? (
                          <div className="questions-list">
                            {olympiadDetails.questions
                              .slice(0, 5)
                              .map((q, index) => (
                                <div
                                  key={q._id || index}
                                  className="question-preview-item"
                                >
                                  <span className="question-number">
                                    Q{index + 1}
                                  </span>
                                  <span className="question-text">
                                    {q.question || q.questionText}
                                  </span>
                                  <span className="question-points">
                                    {q.points} pts
                                  </span>
                                </div>
                              ))}
                            {olympiadDetails.questions.length > 5 && (
                              <div className="more-questions">
                                +{olympiadDetails.questions.length - 5} more
                                questions
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="no-questions">No questions added yet</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="modal-actions">
                    <button
                      className="button-secondary"
                      onClick={() => {
                        handleCloseModal();
                        navigate("/admin");
                        // Note: AdminPanel will need to handle opening edit form for this olympiad
                      }}
                    >
                      ✏️ Edit Olympiad
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        handleCloseModal();
                        navigate("/admin");
                        // Note: AdminPanel will need to handle opening question manager for this olympiad
                      }}
                    >
                      ❓ Manage Questions
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        handleCloseModal();
                        navigate(
                          `/olympiad/${selectedOlympiad._id}/leaderboard`
                        );
                      }}
                    >
                      🏆 View Leaderboard
                    </button>
                    <button
                      className="button-primary"
                      onClick={handleCloseModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
