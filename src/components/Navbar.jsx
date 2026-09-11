import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  UserCircle,
  Bell,
  Check,
  BriefcaseBusiness,
} from "lucide-react";

import api from "../services/api";
import "./Navbar.css";

/* =========================================================
   GET LOGIN STATUS
========================================================= */

function getLoginStatus() {
  return localStorage.getItem("isLoggedIn") === "true";
}

/* =========================================================
   GET STORED USER
========================================================= */

function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);

    if (parsedUser && typeof parsedUser === "object") {
      return parsedUser;
    }

    return null;
  } catch (error) {
    console.error("Unable to read stored user:", error);
    return null;
  }
}

/* =========================================================
   GET USER NAME
========================================================= */

function getUserName(user) {
  return user?.fullName || user?.name || user?.username || "Profile";
}

/* =========================================================
   GET ROLE
========================================================= */

function getUserRole(user) {
  const role =
    localStorage.getItem("role") || user?.role || user?.userRole || "";

  return String(role).trim().toUpperCase();
}

/* =========================================================
   NORMALIZE NOTIFICATIONS
========================================================= */

function normalizeNotifications(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && Array.isArray(data.content)) {
    return data.content;
  }

  return [];
}

/* =========================================================
   GET NOTIFICATION ID
========================================================= */

function getNotificationId(notification) {
  return notification?.notificationId ?? notification?.id ?? null;
}

/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const navigate = useNavigate();

  /* =======================================================
     AUTH STATE
  ======================================================= */

  const [isLoggedIn, setIsLoggedIn] = useState(getLoginStatus());

  const [user, setUser] = useState(getStoredUser());

  const [menuOpen, setMenuOpen] = useState(false);

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] = useState([]);

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notificationLoading, setNotificationLoading] = useState(false);

  const notificationRequestRunning = useRef(false);

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  const loadNotifications = useCallback(async () => {
    const currentUser = getStoredUser();

    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const userId =
      currentUser.userId ?? currentUser.user_id ?? currentUser.id ?? null;

    if (!userId) {
      console.error(
        "Cannot load notifications: userId is missing.",
        currentUser,
      );

      setNotifications([]);
      return;
    }

    if (notificationRequestRunning.current) {
      return;
    }

    try {
      notificationRequestRunning.current = true;

      setNotificationLoading(true);

      console.log("Loading notifications for user:", userId);

      const response = await api.get(`/notifications/user/${userId}`);

      console.log("Notifications response:", response.data);

      const notificationData = normalizeNotifications(response.data);

      setNotifications(notificationData);
    } catch (error) {
      console.error("Failed to load notifications:", error);

      console.error("Notification status:", error.response?.status);

      console.error("Notification backend response:", error.response?.data);

      setNotifications([]);
    } finally {
      notificationRequestRunning.current = false;

      setNotificationLoading(false);
    }
  }, []);

  /* =======================================================
     AUTH CHANGE
  ======================================================= */

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = getLoginStatus();

      const storedUser = getStoredUser();

      setIsLoggedIn(loggedIn);

      setUser(storedUser);

      if (!loggedIn) {
        setNotifications([]);

        setNotificationOpen(false);
      }
    };

    window.addEventListener("authChanged", checkLoginStatus);

    window.addEventListener("storage", checkLoginStatus);

    return () => {
      window.removeEventListener("authChanged", checkLoginStatus);

      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  /* =======================================================
     LOAD NOTIFICATIONS AFTER LOGIN
  ======================================================= */

  useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [isLoggedIn, loadNotifications]);

  /* =======================================================
     AUTOMATIC NOTIFICATION REFRESH
  ======================================================= */

  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [isLoggedIn, loadNotifications]);

  /* =======================================================
     REFRESH WHEN TAB BECOMES VISIBLE
  ======================================================= */

  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, loadNotifications]);

  /* =======================================================
     AUTH CHANGED EVENT
  ======================================================= */

  useEffect(() => {
    const handleAuthChanged = () => {
      const loggedIn = getLoginStatus();

      const storedUser = getStoredUser();

      setIsLoggedIn(loggedIn);

      setUser(storedUser);

      if (loggedIn) {
        loadNotifications();
      } else {
        setNotifications([]);

        setNotificationOpen(false);
      }
    };

    window.addEventListener("authChanged", handleAuthChanged);

    return () => {
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, [loadNotifications]);

  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  const unreadCount = notifications.filter(
    (notification) =>
      notification?.isRead === false || notification?.read === false,
  ).length;

  /* =======================================================
     MARK NOTIFICATION AS READ
  ======================================================= */

  const markNotificationAsRead = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (!notificationId) {
      return;
    }

    const alreadyRead =
      notification?.isRead === true || notification?.read === true;

    if (alreadyRead) {
      return;
    }

    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((previousNotifications) =>
        previousNotifications.map((item) => {
          const itemId = getNotificationId(item);

          if (itemId === notificationId) {
            return {
              ...item,
              isRead: true,
            };
          }

          return item;
        }),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  /* =======================================================
     NOTIFICATION CLICK
  ======================================================= */

  const handleNotificationClick = () => {
    setNotificationOpen((previous) => !previous);

    setMenuOpen(false);

    if (isLoggedIn) {
      loadNotifications();
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("userId");

    localStorage.removeItem("seekerId");

    localStorage.removeItem("role");

    localStorage.removeItem("isLoggedIn");

    setIsLoggedIn(false);

    setUser(null);

    setNotifications([]);

    setNotificationOpen(false);

    setMenuOpen(false);

    window.dispatchEvent(new Event("authChanged"));

    navigate("/login", {
      replace: true,
    });
  };

  /* =======================================================
     CLOSE MENU
  ======================================================= */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =======================================================
     USER INFORMATION
  ======================================================= */

  const userName = getUserName(user);

  const role = getUserRole(user);

  const isRecruiter = role === "RECRUITER";

  const isJobSeeker = role === "JOB_SEEKER";

  console.log("Navbar user:", user);

  console.log("Navbar role:", role);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* =================================================
            LOGO
        ================================================== */}

        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          HireHub
        </Link>

        {/* =================================================
            MOBILE MENU
        ================================================== */}

        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <div className={menuOpen ? "navbar-links active" : "navbar-links"}>
          {/* =================================================
              PUBLIC
          ================================================== */}

          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/jobs" onClick={closeMenu}>
            Jobs
          </Link>

          {/* =================================================
              JOB SEEKER NAVIGATION
          ================================================== */}

          {isLoggedIn && isJobSeeker && (
            <>
              <Link to="/dashboard" onClick={closeMenu}>
                Dashboard
              </Link>

              <Link to="/applications" onClick={closeMenu}>
                Applications
              </Link>

              <Link to="/interviews" onClick={closeMenu}>
                Interviews
              </Link>
            </>
          )}

          {/* =================================================
              RECRUITER NAVIGATION
          ================================================== */}

          {isLoggedIn && isRecruiter && (
            <Link
              to="/recruiter/jobs"
              onClick={closeMenu}
              className="recruiter-nav-link"
            >
              <BriefcaseBusiness size={17} />
              My Jobs
            </Link>
          )}

          {/* =================================================
              NOTIFICATION
          ================================================== */}

          {isLoggedIn && (
            <div className="notification-wrapper">
              <button
                type="button"
                className="notification-button"
                onClick={handleNotificationClick}
                aria-label="Notifications"
                aria-expanded={notificationOpen}
              >
                <Bell size={19} />

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* =================================================
                  NOTIFICATION DROPDOWN
              ================================================== */}

              {notificationOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <div>
                      <h3>Notifications</h3>

                      <span>
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="notification-refresh"
                      onClick={loadNotifications}
                      disabled={notificationLoading}
                    >
                      {notificationLoading ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  {notificationLoading ? (
                    <div className="notification-empty">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                      <Bell size={28} />

                      <p>No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="notification-list">
                      {notifications.map((notification, index) => {
                        const notificationId = getNotificationId(notification);

                        const isUnread =
                          notification?.isRead === false ||
                          notification?.read === false;

                        return (
                          <button
                            type="button"
                            className={
                              isUnread
                                ? "notification-item unread"
                                : "notification-item"
                            }
                            key={notificationId ?? `notification-${index}`}
                            onClick={() => markNotificationAsRead(notification)}
                          >
                            <div className="notification-icon">
                              {isUnread ? (
                                <Bell size={17} />
                              ) : (
                                <Check size={17} />
                              )}
                            </div>

                            <div className="notification-content">
                              <p>
                                {notification?.message ||
                                  "You have a new notification."}
                              </p>

                              {notification?.createdAt && (
                                <span>
                                  {new Date(
                                    notification.createdAt,
                                  ).toLocaleString()}
                                </span>
                              )}
                            </div>

                            {isUnread && <span className="unread-dot" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =================================================
              PROFILE
          ================================================== */}

          {isLoggedIn && (
            <Link to="/profile" className="profile-link" onClick={closeMenu}>
              <UserCircle size={17} />

              {userName}
            </Link>
          )}

          {/* =================================================
              LOGOUT
          ================================================== */}

          {isLoggedIn && (
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              Logout
            </button>
          )}

          {/* =================================================
              LOGGED OUT
          ================================================== */}

          {!isLoggedIn && (
            <>
              <Link to="/login" onClick={closeMenu}>
                Login
              </Link>

              <Link to="/register" className="get-started" onClick={closeMenu}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
