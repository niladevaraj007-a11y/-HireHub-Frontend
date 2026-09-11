import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Inbox,
} from "lucide-react";

import api from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // GET STORED USER
  // =========================================================

  const getStoredUser = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid user data in localStorage:", error);
      return null;
    }
  };

  // =========================================================
  // GET USER ID
  // =========================================================

  const getUserId = () => {
    const user = getStoredUser();

    // First try user object
    if (user) {
      const userId = user.userId ?? user.user_id ?? user.id ?? null;

      if (userId !== null && userId !== undefined) {
        return Number(userId);
      }
    }

    // Fallback to separate localStorage value
    const storedUserId = localStorage.getItem("userId");

    if (storedUserId) {
      const parsedUserId = Number(storedUserId);

      if (!Number.isNaN(parsedUserId)) {
        return parsedUserId;
      }
    }

    return null;
  };

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = async () => {
    const userId = getUserId();

    console.log("Notifications - User ID:", userId);
    console.log("Notifications - Stored user:", getStoredUser());

    if (!userId) {
      setNotifications([]);
      setError("Please login to view notifications.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/notifications/user/${userId}`);

      console.log("Notifications API response:", response.data);

      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);

      console.error("Status:", error.response?.status);

      console.error("Backend response:", error.response?.data);

      setNotifications([]);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.notificationId === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);

      alert(
        error.response?.data?.message || "Unable to mark notification as read.",
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const handleMarkAllAsRead = async () => {
    const userId = getUserId();

    if (!userId) {
      alert("User ID not found. Please login again.");
      return;
    }

    try {
      await api.put(`/notifications/user/${userId}/read-all`);

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);

      alert(
        error.response?.data?.message ||
          "Unable to mark all notifications as read.",
      );
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (notificationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/notifications/${notificationId}`);

      setNotifications((previous) =>
        previous.filter(
          (notification) => notification.notificationId !== notificationId,
        ),
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);

      alert(error.response?.data?.message || "Unable to delete notification.");
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Date not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => notification.isRead !== true,
  ).length;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="notifications-page">
      {/* HEADER */}

      <section className="applications-header">
        <div className="container">
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={17} />
            Back
          </Link>

          <span className="section-label">HireHub</span>

          <h1>Notifications</h1>

          <p>
            Stay updated with your application status and recruitment activity.
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <section className="page-section">
        <div className="container">
          {/* TOOLBAR */}

          <div className="applications-toolbar">
            <div>
              <h2>Your Notifications</h2>

              {!loading && !error && (
                <p>
                  {notifications.length}{" "}
                  {notifications.length === 1
                    ? "notification"
                    : "notifications"}
                  {unreadCount > 0 && ` • ${unreadCount} unread`}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {/* REFRESH */}

              <button
                type="button"
                className="secondary-btn refresh-btn"
                onClick={fetchNotifications}
                disabled={loading}
              >
                <RefreshCw size={17} />

                {loading ? "Loading..." : "Refresh"}
              </button>

              {/* MARK ALL */}

              {!loading && !error && unreadCount > 0 && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck size={17} />
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="applications-state">
              <div className="spinner"></div>

              <p>Loading notifications...</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="applications-state error-state">
              <Bell size={45} />

              <h3>Unable to load notifications</h3>

              <p>{error}</p>

              <button
                type="button"
                className="primary-btn"
                onClick={fetchNotifications}
              >
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && notifications.length === 0 && (
            <div className="applications-empty card">
              <div className="empty-icon">
                <Inbox size={30} />
              </div>

              <h2>No notifications</h2>

              <p>You don't have any notifications yet.</p>

              <Link to="/jobs" className="primary-btn">
                Browse Jobs
              </Link>
            </div>
          )}

          {/* NOTIFICATION LIST */}

          {!loading && !error && notifications.length > 0 && (
            <div className="applications-list">
              {notifications.map((notification) => {
                const notificationId = notification.notificationId;

                const isUnread = notification.isRead !== true;

                return (
                  <article
                    key={notificationId}
                    className={`notification-card card ${
                      isUnread ? "notification-unread" : ""
                    }`}
                  >
                    <div className="notification-main">
                      {/* ICON */}

                      <div className="notification-icon">
                        <Bell size={22} />
                      </div>

                      {/* CONTENT */}

                      <div className="notification-content">
                        <div className="notification-title-row">
                          <h3>
                            {isUnread ? "New Notification" : "Notification"}
                          </h3>

                          {isUnread && (
                            <span className="application-badge status-success">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="notification-message">
                          {notification.message}
                        </p>

                        <span className="notification-date">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {/* ACTIONS */}

                      <div className="notification-actions">
                        {isUnread && (
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => handleMarkAsRead(notificationId)}
                          >
                            <Check size={16} />
                            Read
                          </button>
                        )}

                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleDelete(notificationId)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Notifications;
