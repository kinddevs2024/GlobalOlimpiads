import { useState, useEffect } from 'react';
import { adminAPI, olympiadAPI } from '../services/api';
import NotificationToast from '../components/NotificationToast';
import { formatDate } from '../utils/helpers';
import './AdminPanel.css';

const AdminPanel = () => {
  const [olympiads, setOlympiads] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: 'math',
    type: 'test',
    startTime: '',
    endTime: '',
    duration: 60
  });

  useEffect(() => {
    fetchOlympiads();
  }, []);

  const fetchOlympiads = async () => {
    try {
      const response = await olympiadAPI.getAll();
      setOlympiads(response.data);
    } catch (error) {
      setNotification({ message: 'Failed to load olympiads', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createOlympiad(formData);
      setNotification({ message: 'Olympiad created successfully', type: 'success' });
      setShowCreateForm(false);
      setFormData({
        title: '',
        subject: 'math',
        type: 'test',
        startTime: '',
        endTime: '',
        duration: 60
      });
      fetchOlympiads();
    } catch (error) {
      setNotification({ 
        message: error.response?.data?.message || 'Failed to create olympiad', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this olympiad?')) {
      try {
        await adminAPI.deleteOlympiad(id);
        setNotification({ message: 'Olympiad deleted successfully', type: 'success' });
        fetchOlympiads();
      } catch (error) {
        setNotification({ message: 'Failed to delete olympiad', type: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-panel-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title text-glow">Admin Panel</h1>
          <button 
            className="button-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ Create Olympiad'}
          </button>
        </div>

        {showCreateForm && (
          <div className="create-form card">
            <h2>Create New Olympiad</h2>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  >
                    <option value="math">Math</option>
                    <option value="english">English</option>
                    <option value="science">Science</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="test">Test</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="button-primary">
                Create Olympiad
              </button>
            </form>
          </div>
        )}

        <div className="admin-olympiads">
          {olympiads.map(olympiad => (
            <div key={olympiad._id} className="admin-olympiad-card card">
              <div className="olympiad-info">
                <h3>{olympiad.title}</h3>
                <div className="olympiad-meta">
                  <span>{olympiad.subject}</span>
                  <span>•</span>
                  <span>{olympiad.type}</span>
                  <span>•</span>
                  <span>{formatDate(olympiad.startTime)}</span>
                </div>
              </div>
              <div className="olympiad-actions">
                <button 
                  className="button-secondary"
                  onClick={() => setSelectedOlympiad(olympiad)}
                >
                  Manage
                </button>
                <button 
                  className="button-danger"
                  onClick={() => handleDelete(olympiad._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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

export default AdminPanel;

