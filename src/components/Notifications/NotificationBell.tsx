import { useEffect, useRef, useState } from "react";

import { useFinanceNotifications } from "../../hooks/useFinanceNotifications";

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearReadHistory,
  } = useFinanceNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const notificationRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <div
      className="notification-wrapper"
      ref={notificationRef}
    >
      <button
        className="notification-bell"
        type="button"
        aria-label="Open notifications"
        aria-expanded={isOpen}
        onClick={() =>
          setIsOpen((currentValue) => !currentValue)
        }
      >
        <span aria-hidden="true">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <p className="panel-label">
                Financial alerts
              </p>

              <h3>Notifications</h3>
            </div>

            {unreadCount > 0 && (
              <button
                className="text-button"
                type="button"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.map((notification) => (
              <button
                className={`notification-item notification-${notification.type} ${
                  notification.read
                    ? "notification-read"
                    : ""
                }`}
                type="button"
                key={notification.id}
                onClick={() =>
                  markAsRead(notification.id)
                }
              >
                <span
                  className="notification-status"
                  aria-hidden="true"
                />

                <span className="notification-content">
                  <strong>{notification.title}</strong>

                  <span>{notification.message}</span>
                </span>

                {!notification.read && (
                  <span className="unread-dot" />
                )}
              </button>
            ))}
          </div>

          <div className="notification-footer">
            <button
              className="text-button"
              type="button"
              onClick={clearReadHistory}
            >
              Reset notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}