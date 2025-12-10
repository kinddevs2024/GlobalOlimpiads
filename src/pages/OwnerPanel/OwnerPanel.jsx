import { useState, useEffect } from "react";
import { ownerAPI, adminAPI } from "../../services/api";
import NotificationToast from "../../components/NotificationToast";
import {
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded,
} from "../../utils/helpers";
import "./OwnerPanel.css";

const OwnerPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes, olympiadsRes, submissionsRes] =
        await Promise.all([
          ownerAPI.getAnalytics(),
          adminAPI.getUsers(),
          adminAPI.getAllOlympiads(),
          adminAPI.getSubmissions(null, null),
        ]);
      setAnalytics(analyticsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setOlympiads(Array.isArray(olympiadsRes.data) ? olympiadsRes.data : []);
      // Ensure submissions is always an array
      const submissionsData = submissionsRes.data;
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({ message: "Failed to load data", type: "error" });
      // Ensure arrays are set to empty arrays on error
      setUsers([]);
      setOlympiads([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await ownerAPI.changeUserRole(userId, newRole);
      setNotification({
        message: "User role updated successfully",
        type: "success",
      });
      fetchData();
    } catch (error) {
      setNotification({ message: "Failed to update role", type: "error" });
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

        {/* Analytics Dashboard */}
        <div className="analytics-section">
          <h2 className="section-title">📊 Platform Analytics & Statistics</h2>

          {/* Key Metrics Cards */}
          <div className="analytics-grid">
            <div className="analytics-card card">
              <div className="analytics-icon">👥</div>
              <div className="analytics-label">Total Users</div>
              <div className="analytics-value">
                {users.length || analytics?.totalUsers || 0}
              </div>
              <div className="analytics-change positive">
                {users.filter((u) => u.role === "student").length} students
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">🏆</div>
              <div className="analytics-label">Total Olympiads</div>
              <div className="analytics-value">
                {olympiads.length || analytics?.totalOlympiads || 0}
              </div>
              <div className="analytics-change">
                {olympiads.filter((o) => o.status === "published").length}{" "}
                published
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">📝</div>
              <div className="analytics-label">Total Submissions</div>
              <div className="analytics-value">
                {submissions.length || analytics?.totalSubmissions || 0}
              </div>
              <div className="analytics-change">
                {Array.isArray(submissions) && submissions.length > 0
                  ? new Set(submissions.map((s) => s.userId || s.user?._id)).size
                  : 0}{" "}
                participants
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">⚡</div>
              <div className="analytics-label">Active Olympiads</div>
              <div className="analytics-value">
                {
                  olympiads.filter((o) =>
                    isOlympiadActive(o.startTime, o.endTime)
                  ).length
                }
              </div>
              <div className="analytics-change positive">Currently running</div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="analytics-details">
            {/* User Distribution */}
            <div className="stat-card card">
              <h3 className="stat-title">👥 User Distribution</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Students</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-student"
                      style={{
                        width: `${
                          users.length > 0
                            ? (users.filter((u) => u.role === "student")
                                .length /
                                users.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {users.filter((u) => u.role === "student").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Admins</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-admin"
                      style={{
                        width: `${
                          users.length > 0
                            ? (users.filter((u) => u.role === "admin").length /
                                users.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {users.filter((u) => u.role === "admin").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Owners</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-owner"
                      style={{
                        width: `${
                          users.length > 0
                            ? (users.filter((u) => u.role === "owner").length /
                                users.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {users.filter((u) => u.role === "owner").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Status */}
            <div className="stat-card card">
              <h3 className="stat-title">🏆 Olympiad Status</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Published</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-published"
                      style={{
                        width: `${
                          olympiads.length > 0
                            ? (olympiads.filter((o) => o.status === "published")
                                .length /
                                olympiads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {olympiads.filter((o) => o.status === "published").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Draft</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-draft"
                      style={{
                        width: `${
                          olympiads.length > 0
                            ? (olympiads.filter((o) => o.status === "draft")
                                .length /
                                olympiads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {olympiads.filter((o) => o.status === "draft").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unpublished</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-unpublished"
                      style={{
                        width: `${
                          olympiads.length > 0
                            ? (olympiads.filter(
                                (o) => o.status === "unpublished"
                              ).length /
                                olympiads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {
                        olympiads.filter((o) => o.status === "unpublished")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Timeline */}
            <div className="stat-card card">
              <h3 className="stat-title">📅 Olympiad Timeline</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Active</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-active"
                      style={{
                        width: `${
                          olympiads.length > 0
                            ? (olympiads.filter((o) =>
                                isOlympiadActive(o.startTime, o.endTime)
                              ).length /
                                olympiads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {
                        olympiads.filter((o) =>
                          isOlympiadActive(o.startTime, o.endTime)
                        ).length
                      }
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Upcoming</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-upcoming"
                      style={{
                        width: `${
                          olympiads.length > 0
                            ? (olympiads.filter((o) =>
                                isOlympiadUpcoming(o.startTime)
                              ).length /
                                olympiads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {
                        olympiads.filter((o) => isOlympiadUpcoming(o.startTime))
                          .length
                      }
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ended</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-ended"
                      style={{
                        width: `${
                          olympiads.length > 0
                            ? (olympiads.filter((o) =>
                                isOlympiadEnded(o.endTime)
                              ).length /
                                olympiads.length) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {
                        olympiads.filter((o) => isOlympiadEnded(o.endTime))
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Statistics */}
            <div className="stat-card card">
              <h3 className="stat-title">📊 Participation Statistics</h3>
              <div className="stat-content">
                <div className="stat-metric">
                  <div className="metric-value">
                    {Array.isArray(submissions) && submissions.length > 0
                      ? new Set(submissions.map((s) => s.userId || s.user?._id))
                          .size
                      : 0}
                  </div>
                  <div className="metric-label">Unique Participants</div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {Array.isArray(submissions) &&
                    Array.isArray(olympiads) &&
                    olympiads.length > 0
                      ? (submissions.length / olympiads.length).toFixed(1)
                      : "0"}
                  </div>
                  <div className="metric-label">
                    Avg Submissions per Olympiad
                  </div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {Array.isArray(submissions) &&
                    users.filter((u) => u.role === "student").length > 0
                      ? (
                          (new Set(
                            submissions.map((s) => s.userId || s.user?._id)
                          ).size /
                            users.filter((u) => u.role === "student").length) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </div>
                  <div className="metric-label">Student Participation Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              {users.map((user) => (
                <div key={user._id} className="table-row">
                  <div className="table-cell">{user.name || "N/A"}</div>
                  <div className="table-cell">{user.email}</div>
                  <div className="table-cell">
                    <span className="role-badge">{user.role}</span>
                  </div>
                  <div className="table-cell">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
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
