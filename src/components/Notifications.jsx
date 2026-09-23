import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/toast";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showToast } = useToast();

  // Unread badge comes from its own count query so it isn't capped by the
  // 10-item list below.
  async function loadUnreadCount() {
    if (!user) return;
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) {
      console.error("Failed to count unread notifications:", error);
      return;
    }
    setUnreadCount(count || 0);
  }

  // Load notifications
  async function loadNotifications() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to load notifications:", error);
        return; // Fail silently - table might not exist yet
      }

      setNotifications(data || []);
    } catch (err) {
      console.error("Notification load exception:", err);
    }
  }

  // Mark notification as read
  async function markAsRead(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Failed to mark notification read:", error);
      showToast({ title: "Couldn't mark notification as read", description: error.message, type: "error" });
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    loadUnreadCount();
  }

  // Mark all as read
  async function markAllAsRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error("Failed to mark all notifications read:", error);
      showToast({ title: "Couldn't mark notifications as read", description: error.message, type: "error" });
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    loadUnreadCount();
  }

  // Handle notification click
  function handleNotificationClick(notification) {
    if (!notification.read) markAsRead(notification.id);
    setShowDropdown(false);

    // Navigate based on notification type
    if (notification.related_type === 'post') {
      navigate('/feed');
    } else if (notification.related_type === 'question') {
      navigate('/qa');
    }
  }

  // Load on mount and set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();
    loadUnreadCount();

    // Subscribe to new notifications (fail silently if table doesn't exist)
    let channel;
    try {
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadNotifications();
            loadUnreadCount();
          }
        )
        .subscribe();
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error("Failed to unsubscribe:", err);
        }
      }
    };
  }, [user?.id]); // Only re-subscribe if user ID actually changes

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl
                   text-white hover:bg-white/10 transition-colors"
        aria-label={unreadCount > 0 ? `View notifications (${unreadCount} unread)` : "View notifications"}
        aria-expanded={showDropdown}
      >
        <span className="text-2xl">🔔</span>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white
                         text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Panel */}
          <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-12
                         md:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50
                         max-h-96 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-teal-700 hover:text-teal-900"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 border-b border-gray-100
                               hover:bg-gray-50 transition-colors ${
                                 !notification.read ? 'bg-teal-50' : ''
                               }`}
                  >
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
