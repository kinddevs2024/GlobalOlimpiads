import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { olympiadAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Timer from '../../components/Timer';
import ProctoringMonitor from '../../components/ProctoringMonitor';
import NotificationToast from '../../components/NotificationToast';
import { useAuth } from '../../context/AuthContext';
import { getTimeRemaining, getTimeRemainingFromDuration } from '../../utils/helpers';
import './EssayOlympiad.css';

const EssayOlympiad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on } = useSocket();
  
  const [olympiad, setOlympiad] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    fetchOlympiad();
    
    if (on) {
      on('timer-update', (data) => {
        if (data.olympiadId === id) {
          setTimeRemaining(data.timeRemaining);
        }
      });
    }
  }, [id, on]);

  // Update timer every second based on duration
  useEffect(() => {
    if (!olympiad || !id || submitted) return;

    const startTime = localStorage.getItem(`olympiad_${id}_startTime`);
    const duration = olympiad.duration || 3600; // Duration in seconds (e.g., 3600 = 60 minutes)

    if (!startTime || !duration) {
      // If no start time, try to initialize it now
      if (olympiad.duration) {
        const now = new Date().toISOString();
        localStorage.setItem(`olympiad_${id}_startTime`, now);
        setTimeRemaining(duration);
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = getTimeRemainingFromDuration(duration, startTime);
      setTimeRemaining(remaining);
      
      // Auto-submit when time expires
      if (remaining <= 0 && !submitted) {
        handleTimeExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [olympiad, id, submitted]);

  // Load saved answers from localStorage on mount
  useEffect(() => {
    if (id) {
      const savedAnswers = localStorage.getItem(`olympiad_${id}_essay_answers`);
      if (savedAnswers) {
        try {
          const parsedAnswers = JSON.parse(savedAnswers);
          setAnswers(parsedAnswers);
        } catch (error) {
          console.error('Error loading saved answers:', error);
        }
      }
    }
  }, [id]);

  // Auto-save answers to localStorage whenever they change
  useEffect(() => {
    if (id && Object.keys(answers).length > 0) {
      localStorage.setItem(`olympiad_${id}_essay_answers`, JSON.stringify(answers));
    }
  }, [answers, id]);

  const fetchOlympiad = async () => {
    try {
      const response = await olympiadAPI.getById(id);
      const olympiadData = response.data;
      setOlympiad(olympiadData);
      setQuestions(olympiadData.questions || []);
      
      // Calculate remaining time based on duration from start time
      const startTime = localStorage.getItem(`olympiad_${id}_startTime`);
      const duration = olympiadData.duration || 3600; // Default to 60 minutes (3600 seconds)
      
      if (startTime && duration) {
        // Use duration-based timer (countdown from when user started)
        const remaining = getTimeRemainingFromDuration(duration, startTime);
        setTimeRemaining(remaining);
      } else {
        // Fallback to endTime-based timer if no start time recorded
        const remaining = getTimeRemaining(olympiadData.endTime);
        setTimeRemaining(remaining);
      }
    } catch (error) {
      setNotification({ message: 'Failed to load olympiad', type: 'error' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
      try {
        await olympiadAPI.submit(id, { answers });
        setSubmitted(true);
        // Clear saved answers after successful submission
        localStorage.removeItem(`olympiad_${id}_essay_answers`);
        setNotification({ message: 'Essay submitted successfully!', type: 'success' });
        setTimeout(() => {
          navigate(`/olympiad/${id}/results`);
        }, 2000);
      } catch (error) {
        setNotification({ 
          message: error.response?.data?.message || 'Submission failed', 
          type: 'error' 
        });
      }
    }
  };

  const handleTimeExpire = () => {
    handleSubmit();
  };

  if (loading) {
    return (
      <div className="olympiad-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="olympiad-submitted">
        <div className="submitted-card card">
          <h2>✓ Submitted Successfully</h2>
          <p>Your essay has been submitted.</p>
          <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/results`)}>
            View Results
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion._id] || '';
  const wordCount = getWordCount(currentAnswer);

  return (
    <div className="essay-olympiad-page">
      <ProctoringMonitor 
        olympiadId={id} 
        userId={user?._id}
        olympiadTitle={olympiad?.title}
        onRecordingStatusChange={setIsRecording}
      />
      
      <div className="olympiad-container">
        {/* Blocking overlay when not recording */}
        {!isRecording && (
          <div className="recording-block-overlay">
            <div className="blocking-message card">
              <h2>⏸️ Recording Not Active</h2>
              <p>Please wait for camera and screen recording to start.</p>
              <p className="blocking-hint">
                You cannot answer questions until recording is active.
              </p>
            </div>
          </div>
        )}
        <div className="olympiad-header">
          <h1 className="olympiad-title">{olympiad?.title}</h1>
          <Timer 
            initialSeconds={timeRemaining} 
            onExpire={handleTimeExpire}
            className="olympiad-timer"
          />
        </div>

        <div className="olympiad-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        <div className="questions-navigation">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`nav-button ${index === currentQuestionIndex ? 'active' : ''} ${answers[questions[index]._id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={!isRecording || submitted}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion && (
          <div className="essay-question-card card">
            <div className="question-header">
              <span className="question-number">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="question-points">{currentQuestion.points} points</span>
            </div>
            
            <div className="question-text">
              {currentQuestion.question || currentQuestion.questionText}
            </div>

            <div className="essay-editor">
              <textarea
                className="essay-textarea"
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                placeholder="Write your essay here..."
                disabled={!isRecording || submitted}
                rows={20}
              />
              <div className="essay-stats">
                <span className="word-count">Words: {wordCount}</span>
                <span className="char-count">Characters: {currentAnswer.length}</span>
              </div>
            </div>
          </div>
        )}

        <div className="olympiad-actions">
          <button
            className="button-secondary"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={!isRecording || currentQuestionIndex === 0 || submitted}
          >
            ← Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button 
              className="button-primary" 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={!isRecording || submitted}
            >
              Next →
            </button>
          ) : (
            <button 
              className="button-primary" 
              onClick={handleSubmit}
              disabled={!isRecording || submitted}
            >
              Submit Essay
            </button>
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

export default EssayOlympiad;

