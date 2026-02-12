import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      console.error("Notification load exception:", err);
    }
  }

  // Mark notification as read
  async function markAsRead(notificationId) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    loadNotifications();
  }

  // Mark all as read
  async function markAllAsRead() {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    loadNotifications();
  }

  // Handle notification click
  function handleNotificationClick(notification) {
    markAsRead(notification.id);
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
        aria-label="View notifications"
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
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl
                         border border-gray-200 z-50 max-h-96 overflow-hidden">

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
