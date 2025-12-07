import { useState, useEffect } from 'react';
import { ownerAPI, adminAPI } from '../services/api';
import NotificationToast from '../components/NotificationToast';
import './OwnerPanel.css';

const OwnerPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        ownerAPI.getAnalytics(),
        adminAPI.getUsers()
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      setNotification({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await ownerAPI.changeUserRole(userId, newRole);
      setNotification({ message: 'User role updated successfully', type: 'success' });
      fetchData();
    } catch (error) {
      setNotification({ message: 'Failed to update role', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="owner-panel-page">
      <div className="container">
        <div className="owner-header">
          <h1 className="owner-title text-glow">Owner Panel</h1>
        </div>

        {analytics && (
          <div className="analytics-section">
            <h2>Platform Analytics</h2>
            <div className="analytics-grid">
              <div className="analytics-card card">
                <div className="analytics-label">Total Users</div>
                <div className="analytics-value">{analytics.totalUsers || 0}</div>
              </div>
              <div className="analytics-card card">
                <div className="analytics-label">Total Olympiads</div>
                <div className="analytics-value">{analytics.totalOlympiads || 0}</div>
              </div>
              <div className="analytics-card card">
                <div className="analytics-label">Total Submissions</div>
                <div className="analytics-value">{analytics.totalSubmissions || 0}</div>
              </div>
              <div className="analytics-card card">
                <div className="analytics-label">Active Users</div>
                <div className="analytics-value">{analytics.activeUsers || 0}</div>
              </div>
            </div>
          </div>
        )}

        <div className="users-section">
          <h2>User Management</h2>
          <div className="users-table card">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Role</div>
              <div className="table-cell">Actions</div>
            </div>
            <div className="table-body">
              {users.map(user => (
                <div key={user._id} className="table-row">
                  <div className="table-cell">{user.name || 'N/A'}</div>
                  <div className="table-cell">{user.email}</div>
                  <div className="table-cell">
                    <span className="role-badge">{user.role}</span>
                  </div>
                  <div className="table-cell">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="role-select"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

export default OwnerPanel;

