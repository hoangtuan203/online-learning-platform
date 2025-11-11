// File mới: components/NotificationDropdown.tsx (hoặc đường dẫn phù hợp)
// Giao diện notifications dropdown giống TopCV: Clean, minimal, với avatar/icon, timestamp, actions đơn giản

import { Link } from "react-router-dom";
import { Bell, Check, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NotificationService } from "../../service/NotificationService";
import type { NotificationResponse as Notification } from "../../service/NotificationService";

interface NotificationItem {
  id: number;
  type: "PROGRESS_REMINDER" | "QA_REPLY" | "OTHER";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  data?: any;
}

interface NotificationDropdownProps {
  userId?: string;
  onViewAll?: () => void;
}

export function NotificationDropdown({
  userId: propUserId,
  onViewAll,
}: NotificationDropdownProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationService = new NotificationService();

  const getUserId = (): string | null => {
    if (propUserId) return propUserId;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.id?.toString() || null;
    }
    return null;
  };

  const fetchNotifications = async () => {
    const uid = getUserId();
    if (!uid) {
      setError("Không thể xác định user ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [notifResponse, countResponse] = await Promise.all([
        notificationService.getNotifications(uid),
        notificationService.getUnreadCount(uid),
      ]);

      const normalizedNotifications: NotificationItem[] = notifResponse.map(
        (n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })
      );

      setNotifications(normalizedNotifications);
      setUnreadCount(countResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải thông báo");
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [propUserId]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [propUserId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id: number) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await notificationService.markAsRead(id, uid);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await notificationService.markAllAsRead(uid);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const handleViewAllNotifications = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      window.location.href = "/notifications";
    }
    setIsNotificationOpen(false);
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "PROGRESS_REMINDER":
        return <User className="w-4 h-4 text-blue-500" />;
      case "QA_REPLY":
        return <Check className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    return `${Math.floor(diff / 60)} giờ trước`;
  };

  if (loading) {
    return (
      <div className="relative" ref={notificationRef}>
        <button
          className="relative p-3 rounded-full bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          title="Thông báo"
        >
          <Bell className="w-5 h-5 text-gray-400 animate-spin" />
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative" ref={notificationRef}>
        <button
          className="relative p-3 rounded-full bg-white border border-red-200 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm"
          title="Lỗi tải thông báo"
        >
          <Bell className="w-5 h-5 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={handleToggleNotification}
        className="relative p-3 rounded-full bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
        title="Thông báo"
        aria-expanded={isNotificationOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isNotificationOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  Đánh dấu tất cả
                </button>
              )}
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <Bell className="mx-auto w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Không có thông báo mới</p>
              </li>
            ) : (
              notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`flex px-4 py-3 ${
                    !notif.isRead ? "bg-gray-50" : ""
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-1">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <Link
                            to={notif.link}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Xem chi tiết
                          </Link>
                        )}
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="ml-2 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleViewAllNotifications}
              className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium text-center transition-colors py-2 hover:bg-gray-50 rounded"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}