import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { olympiadAPI } from "../../services/api";
import {
  formatDate,
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded,
  getTimeRemaining,
  isProfileComplete,
  getMissingProfileFields,
} from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import NotificationToast from "../../components/NotificationToast";
import "./StartOlympiad.css";

const StartOlympiad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(0);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  useEffect(() => {
    fetchOlympiad();
    
    // Check profile completeness for students
    if (user && user.role === USER_ROLES.STUDENT) {
      const complete = isProfileComplete(user);
      setProfileIncomplete(!complete);
      if (!complete) {
        setMissingFields(getMissingProfileFields(user));
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (olympiad && isOlympiadUpcoming(olympiad.startTime)) {
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(olympiad.startTime);
        setTimeUntilStart(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [olympiad]);

  const fetchOlympiad = async () => {
    try {
      const response = await olympiadAPI.getById(id);
      const olympiadData = response.data;
      setOlympiad(olympiadData);

      // Check if already started
      const alreadyStarted = localStorage.getItem(`olympiad_${id}_started`);
      if (alreadyStarted) {
        // Allow direct navigation if already started
        // User can continue from where they left
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to load olympiad",
        type: "error",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("🚀 Start button clicked", {
      hasOlympiad: !!olympiad,
      consentGiven,
      starting,
      olympiadStatus: olympiad?.status,
    });

    if (!olympiad) {
      console.error("❌ Olympiad data is missing");
      setNotification({
        message: "Olympiad data not loaded. Please refresh the page.",
        type: "error",
      });
      return;
    }

    if (!consentGiven) {
      console.warn("⚠️ Consent not given");
      setNotification({
        message: "Please read and accept the terms to continue",
        type: "error",
      });
      return;
    }

    // Check profile completeness for students
    if (user && user.role === USER_ROLES.STUDENT) {
      const complete = isProfileComplete(user);
      if (!complete) {
        const missing = getMissingProfileFields(user);
        setNotification({
          message: `Please complete your profile before starting. Missing: ${missing.join(', ')}`,
          type: "error",
        });
        return;
      }
    }

    setStarting(true);

    try {
      // Check olympiad status
      const isUpcomingCheck = isOlympiadUpcoming(olympiad.startTime);
      const isActiveCheck = isOlympiadActive(
        olympiad.startTime,
        olympiad.endTime
      );
      const isEndedCheck = isOlympiadEnded(olympiad.endTime);

      console.log("📅 Time validation:", {
        isUpcoming: isUpcomingCheck,
        isActive: isActiveCheck,
        isEnded: isEndedCheck,
        startTime: olympiad.startTime,
        endTime: olympiad.endTime,
        currentTime: new Date().toISOString(),
      });

      // Validate olympiad is active
      if (!isActiveCheck) {
        if (isUpcomingCheck) {
          setNotification({
            message:
              "Olympiad has not started yet. Please wait for the start time.",
            type: "error",
          });
          setStarting(false);
          return;
        }
        if (isEndedCheck) {
          setNotification({
            message: "Olympiad has ended. You cannot start it anymore.",
            type: "error",
          });
          setStarting(false);
          return;
        }
      }

      // Validate olympiad has questions
      if (!olympiad.questions || olympiad.questions.length === 0) {
        setNotification({
          message:
            "This olympiad has no questions yet. Please contact the administrator.",
          type: "error",
        });
        setStarting(false);
        return;
      }

      // Validate olympiad is published
      if (olympiad.status && olympiad.status !== "published") {
        setNotification({
          message: "This olympiad is not available for participation.",
          type: "error",
        });
        setStarting(false);
        return;
      }

      console.log("✅ All validations passed, starting olympiad...");

      // Store start information in localStorage
      const startTime = new Date().toISOString();
      localStorage.setItem(`olympiad_${id}_started`, "true");
      localStorage.setItem(`olympiad_${id}_startTime`, startTime);
      localStorage.setItem(`olympiad_${id}_consent`, "true");

      // Show success message
      setNotification({
        message: "Starting olympiad...",
        type: "success",
      });

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to the olympiad
      const targetPath =
        olympiad.type === "essay" ? `/olympiad/${id}/essay` : `/olympiad/${id}`;

      console.log("🧭 Navigating to:", targetPath);
      navigate(targetPath);
    } catch (error) {
      console.error("❌ Error starting olympiad:", error);
      setNotification({
        message:
          error.message ||
          "Failed to start olympiad. Please try again or contact support.",
        type: "error",
      });
      setStarting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="start-olympiad-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="start-olympiad-page">
        <div className="container">
          <div className="error-state card">
            <h2>Olympiad not found</h2>
            <Link to="/dashboard" className="button-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isUpcoming = isOlympiadUpcoming(olympiad.startTime);
  const isActive = isOlympiadActive(olympiad.startTime, olympiad.endTime);
  const isEnded = isOlympiadEnded(olympiad.endTime);

  return (
    <div className="start-olympiad-page">
      <div className="container">
        <div className="start-olympiad-content">
          {/* Header */}
          <div className="start-header card">
            <h1 className="start-title text-glow">{olympiad.title}</h1>
            <p className="start-subtitle">{olympiad.description}</p>

            <div className="olympiad-info-grid">
              <div className="info-item">
                <span className="info-label">Subject</span>
                <span className="info-value">{olympiad.subject}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">
                  {olympiad.type === "test" ? "Test" : "Essay"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration</span>
                <span className="info-value">
                  {Math.floor(olympiad.duration / 60)} minutes
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Questions</span>
                <span className="info-value">
                  {olympiad.questions?.length || 0}
                </span>
              </div>
            </div>

            <div className="time-info">
              <div className="time-item">
                <span className="time-label">Start Time:</span>
                <span className="time-value">
                  {formatDate(olympiad.startTime)}
                </span>
              </div>
              <div className="time-item">
                <span className="time-label">End Time:</span>
                <span className="time-value">
                  {formatDate(olympiad.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Incomplete Warning for Students */}
          {user && user.role === USER_ROLES.STUDENT && profileIncomplete && (
            <div className="status-message card status-error">
              <div className="status-icon">⚠️</div>
              <div className="status-content">
                <h3>Profile Incomplete</h3>
                <p>
                  Please complete your profile before starting an olympiad. Missing fields:
                </p>
                <ul style={{ marginTop: '12px', marginBottom: '16px', paddingLeft: '20px' }}>
                  {missingFields.map((field, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{field}</li>
                  ))}
                </ul>
                <Link to="/profile/edit" className="button-primary">
                  Complete Profile
                </Link>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isUpcoming && (
            <div className="status-message card status-warning">
              <div className="status-icon">⏰</div>
              <div className="status-content">
                <h3>Olympiad Not Started Yet</h3>
                <p>
                  This olympiad will start in:{" "}
                  <strong>{formatTime(timeUntilStart)}</strong>
                </p>
                <p className="status-note">
                  Please wait until the start time to begin.
                </p>
              </div>
            </div>
          )}

          {isEnded && (
            <div className="status-message card status-error">
              <div className="status-icon">🔒</div>
              <div className="status-content">
                <h3>Olympiad Has Ended</h3>
                <p>This olympiad is no longer available for participation.</p>
                <Link to={`/olympiad/${id}/results`} className="button-primary">
                  View Results
                </Link>
              </div>
            </div>
          )}

          {/* Instructions */}
          {isActive && (
            <>
              <div className="instructions-section card">
                <h2 className="section-title">Instructions</h2>
                <div className="instructions-list">
                  <div className="instruction-item">
                    <span className="instruction-icon">📝</span>
                    <div className="instruction-content">
                      <h4>Read Carefully</h4>
                      <p>
                        Read each question carefully before answering. Make sure
                        you understand what is being asked.
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <span className="instruction-icon">⏱️</span>
                    <div className="instruction-content">
                      <h4>Time Management</h4>
                      <p>
                        You have {Math.floor(olympiad.duration / 60)} minutes to
                        complete this olympiad. The timer will start when you
                        click "Start Olympiad".
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <span className="instruction-icon">✅</span>
                    <div className="instruction-content">
                      <h4>Submission</h4>
                      <p>
                        Once you submit your answers, you cannot change them.
                        Make sure to review all answers before submitting.
                      </p>
                    </div>
                  </div>

                  {olympiad.type === "test" && (
                    <div className="instruction-item">
                      <span className="instruction-icon">🔢</span>
                      <div className="instruction-content">
                        <h4>Navigation</h4>
                        <p>
                          You can navigate between questions using the
                          Previous/Next buttons. You can change your answers at
                          any time before submission.
                        </p>
                      </div>
                    </div>
                  )}

                  {olympiad.type === "essay" && (
                    <div className="instruction-item">
                      <span className="instruction-icon">✍️</span>
                      <div className="instruction-content">
                        <h4>Essay Writing</h4>
                        <p>
                          Write your essay in the provided text editor. You can
                          see the word and character count as you type.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Proctoring Notice */}
              <div className="proctoring-notice card">
                <h2 className="section-title">Proctoring & Monitoring</h2>
                <div className="proctoring-content">
                  <p className="proctoring-warning">
                    ⚠️ This olympiad uses proctoring technology to ensure
                    academic integrity.
                  </p>
                  <ul className="proctoring-list">
                    <li>✓ Your camera will be monitored during the exam</li>
                    <li>✓ Your screen activity will be recorded</li>
                    <li>✓ Periodic screenshots will be taken automatically</li>
                    <li>✓ All monitoring data is securely stored</li>
                  </ul>
                  <p className="proctoring-note">
                    By starting this olympiad, you consent to being monitored.
                    Make sure you have a working camera and are in a quiet,
                    well-lit environment.
                  </p>
                </div>
              </div>

              {/* Rules */}
              <div className="rules-section card">
                <h2 className="section-title">Rules & Guidelines</h2>
                <ul className="rules-list">
                  <li>Do not use any external resources, books, or notes</li>
                  <li>Do not communicate with others during the exam</li>
                  <li>Do not leave the exam page or open other tabs</li>
                  <li>Ensure a stable internet connection</li>
                  <li>Stay in front of your camera throughout the exam</li>
                  <li>Do not use mobile phones or other devices</li>
                </ul>
              </div>

              {/* Consent Checkbox */}
              <div className="consent-section card">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                  />
                  <span className="consent-text">
                    I have read and understood all instructions, rules, and
                    proctoring requirements. I agree to be monitored during this
                    olympiad and will follow all guidelines.
                  </span>
                </label>
                {!consentGiven && (
                  <p className="consent-hint">
                    ⚠️ Please check the box above to enable the Start button
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Link to="/dashboard" className="button-secondary">
                  ← Back to Dashboard
                </Link>
                <button
                  type="button"
                  className="button-primary start-button"
                  onClick={handleStart}
                  disabled={!consentGiven || starting || !isActive || (user && user.role === USER_ROLES.STUDENT && profileIncomplete)}
                  aria-disabled={!consentGiven || starting || !isActive || (user && user.role === USER_ROLES.STUDENT && profileIncomplete)}
                >
                  {starting
                    ? "Starting..."
                    : !consentGiven
                    ? "Accept Terms to Start →"
                    : "Start Olympiad →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default StartOlympiad;
