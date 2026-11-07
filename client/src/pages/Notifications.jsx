import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  ShieldCheck,
  Wallet,
  UserRound,
  Info,
  LoaderCircle,
  Inbox,
} from "lucide-react";

function Notifications() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("goodpay_token");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load notifications.");
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    setUpdating(id);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update notification.");
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating("");
    }
  };

  const handleMarkAllAsRead = async () => {
    setUpdating("all");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/read-all",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update notifications.");
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, is_read: true })),
      );

      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating("");
    }
  };

  const handleDelete = async (id) => {
    setUpdating(id);
    setError("");

    try {
      const notification = notifications.find((item) => item.id === id);

      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete notification.");
      }

      setNotifications((previous) => previous.filter((item) => item.id !== id));

      if (notification && !notification.is_read) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating("");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "transaction":
      case "payment":
        return <Wallet size={20} />;

      case "security":
        return <ShieldCheck size={20} />;

      case "account":
        return <UserRound size={20} />;

      default:
        return <Info size={20} />;
    }
  };

  const formatDate = (date) => {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) return "";

    return value.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="goodpay-notifications-page">
        <div className="notifications-loading">
          <LoaderCircle className="notifications-spinner" size={28} />
          Loading your notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="goodpay-notifications-page">
      <div className="notifications-page-header">
        <div>
          <button
            className="notifications-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Overview
          </button>

          <h1>Notifications</h1>
          <p>Stay updated with your GoodPay account activities.</p>
        </div>

        <div className="notifications-header-icon">
          <Bell size={23} />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </div>
      </div>

      <section className="notifications-summary-card">
        <div>
          <span className="notifications-summary-label">
            Unread notifications
          </span>
          <strong>{unreadCount}</strong>
          <p>
            {unreadCount === 1
              ? "You have one notification to review."
              : `You have ${unreadCount} notifications to review.`}
          </p>
        </div>

        <div className="notifications-summary-icon">
          <Bell size={25} />
        </div>
      </section>

      <section className="notifications-list-card">
        <div className="notifications-list-heading">
          <div>
            <h2>All Notifications</h2>
            <p>Your recent account updates and activities.</p>
          </div>

          {unreadCount > 0 && (
            <button
              className="notifications-mark-all"
              onClick={handleMarkAllAsRead}
              disabled={updating !== ""}
            >
              <CheckCheck size={16} />
              Mark All as Read
            </button>
          )}
        </div>

        {error && (
          <div className="notifications-error">
            {error}
            <button onClick={fetchNotifications}>Try Again</button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              <Inbox size={35} />
            </div>
            <h3>You're all caught up!</h3>
            <p>
              You don't have any notifications yet. Important account updates
              will appear here.
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-item ${
                  notification.is_read ? "is-read" : "is-unread"
                }`}
              >
                <div
                  className={`notification-type-icon notification-type-${(
                    notification.type || "general"
                  ).toLowerCase()}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-item-content">
                  <div className="notification-item-title">
                    <h3>{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <span className="notification-item-date">
                    {formatDate(notification.created_at)}
                  </span>
                </div>

                <div className="notification-item-actions">
                  {!notification.is_read && (
                    <button
                      title="Mark as read"
                      aria-label="Mark notification as read"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={updating !== ""}
                    >
                      <CheckCheck size={17} />
                    </button>
                  )}

                  <button
                    title="Delete notification"
                    aria-label="Delete notification"
                    onClick={() => handleDelete(notification.id)}
                    disabled={updating !== ""}
                  >
                    {updating === notification.id ? (
                      <LoaderCircle
                        className="notifications-spinner"
                        size={17}
                      />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notifications;
