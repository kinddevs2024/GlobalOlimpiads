import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { olympiadAPI, monitoringAPI } from '../../services/api';
import { isAdminOrOwner, isSchoolStaff } from '../../utils/permissions';
import './RealTimeMonitoring.css';

const RealTimeMonitoring = () => {
  const { olympiadId } = useParams();
  const navigate = useNavigate();
  const { socket, connected, on, off } = useSocket();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [olympiads, setOlympiads] = useState([]);
  const videoFramesRef = useRef({}); // Store latest video frames per student

  // Fetch active students
  const fetchActiveStudents = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await monitoringAPI.getActiveStudents(id);
      
      if (response.data && response.data.success) {
        setStudents(response.data.students || []);
        setSelectedOlympiad(id);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching active students:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch active students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available olympiads
  useEffect(() => {
    const fetchOlympiads = async () => {
      try {
        const response = await olympiadAPI.getAll();
        if (response.data && Array.isArray(response.data)) {
          setOlympiads(response.data);
          // If olympiadId is provided, fetch students for it
          if (olympiadId) {
            fetchActiveStudents(olympiadId);
          }
        }
      } catch (err) {
        console.error('Error fetching olympiads:', err);
      }
    };

    fetchOlympiads();
  }, []);

  // Join monitoring room when olympiad is selected
  useEffect(() => {
    if (connected && socket && selectedOlympiad) {
      socket.emit('join-monitoring', selectedOlympiad);
      
      // Listen for video frames from students
      const handleVideoFrame = (data) => {
        // data: { userId, olympiadId, cameraFrame, screenFrame, timestamp }
        if (data.olympiadId === selectedOlympiad) {
          videoFramesRef.current[data.userId] = {
            cameraFrame: data.cameraFrame,
            screenFrame: data.screenFrame,
            timestamp: data.timestamp,
          };
          // Force re-render by updating a timestamp state
          setStudents(prev => {
            // Update the student's lastCapture timestamp to trigger re-render
            return prev.map(student => {
              if (student._id === data.userId) {
                return {
                  ...student,
                  lastCapture: {
                    timestamp: data.timestamp,
                    captureType: 'both',
                  },
                  isActive: true,
                };
              }
              return student;
            });
          });
        }
      };

      on('student-video-frame', handleVideoFrame);

      return () => {
        if (socket) {
          socket.emit('leave-monitoring', selectedOlympiad);
        }
        off('student-video-frame', handleVideoFrame);
      };
    }
  }, [connected, socket, selectedOlympiad, on, off]);

  // Check permissions
  useEffect(() => {
    if (user) {
      const userRole = user.role;
      if (!isAdminOrOwner(userRole) && !isSchoolStaff(userRole)) {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Refresh students list periodically
  useEffect(() => {
    if (!selectedOlympiad) return;

    const interval = setInterval(() => {
      fetchActiveStudents(selectedOlympiad);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedOlympiad]);

  const handleOlympiadChange = (e) => {
    const newOlympiadId = e.target.value;
    if (newOlympiadId) {
      fetchActiveStudents(newOlympiadId);
    } else {
      setStudents([]);
      setSelectedOlympiad(null);
    }
  };

  const getLatestFrame = (studentId, type) => {
    const frames = videoFramesRef.current[studentId];
    if (!frames) return null;
    return type === 'camera' ? frames.cameraFrame : frames.screenFrame;
  };

  if (loading && !selectedOlympiad) {
    return (
      <div className="real-time-monitoring">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="real-time-monitoring">
      <div className="monitoring-header">
        <h1>Real-Time Monitoring</h1>
        <div className="monitoring-controls">
          <select
            value={selectedOlympiad || ''}
            onChange={handleOlympiadChange}
            className="olympiad-select"
          >
            <option value="">Select an Olympiad</option>
            {olympiads.map((olympiad) => (
              <option key={olympiad._id} value={olympiad._id}>
                {olympiad.title}
              </option>
            ))}
          </select>
          {selectedOlympiad && (
            <div className="monitoring-stats">
              <span className="stat-item">
                Total: {students.length} students
              </span>
              <span className="stat-item">
                Active: {students.filter(s => s.isActive).length}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => selectedOlympiad && fetchActiveStudents(selectedOlympiad)}>
            Retry
          </button>
        </div>
      )}

      {!selectedOlympiad ? (
        <div className="no-olympiad-selected">
          <p>Please select an olympiad to start monitoring</p>
        </div>
      ) : students.length === 0 ? (
        <div className="no-students">
          <p>No active students found for this olympiad</p>
        </div>
      ) : (
        <div className="students-grid">
          {students.map((student) => {
            const cameraFrame = getLatestFrame(student._id, 'camera');
            const screenFrame = getLatestFrame(student._id, 'screen');
            
            return (
              <div key={student._id} className="student-card">
                <div className="student-header">
                  <h3>{student.name}</h3>
                  <div className={`status-indicator ${student.isActive ? 'active' : 'inactive'}`}>
                    {student.isActive ? '● Active' : '○ Inactive'}
                  </div>
                </div>
                <div className="student-info">
                  <p className="student-email">{student.email}</p>
                  {student.schoolName && (
                    <p className="student-school">{student.schoolName}</p>
                  )}
                </div>
                <div className="video-container">
                  <div className="video-panel">
                    <div className="video-label">Camera</div>
                    {cameraFrame ? (
                      <img
                        src={`data:image/jpeg;base64,${cameraFrame}`}
                        alt={`${student.name} camera`}
                        className="video-frame"
                      />
                    ) : (
                      <div className="no-video">No camera feed</div>
                    )}
                  </div>
                  <div className="video-panel">
                    <div className="video-label">Screen</div>
                    {screenFrame ? (
                      <img
                        src={`data:image/jpeg;base64,${screenFrame}`}
                        alt={`${student.name} screen`}
                        className="video-frame"
                      />
                    ) : (
                      <div className="no-video">No screen feed</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RealTimeMonitoring;

