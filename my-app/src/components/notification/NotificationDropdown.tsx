// File mới: components/NotificationDropdown.tsx (hoặc đường dẫn phù hợp)
// Tách phần Notification ra thành component riêng biệt

import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Notification item type
export interface Notification {
  id: number;
  type: 'PROGRESS_REMINDER' | 'QA_REPLY' | 'OTHER';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationDropdownProps {
  userId?: string; // Để dùng cho API sau này, hiện tại dùng demo
  onViewAll?: () => void; // Callback tùy chọn cho "Xem tất cả"
}

export function NotificationDropdown({ userId, onViewAll }: NotificationDropdownProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Demo data (sẽ thay bằng API fetch sau)
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: 1,
        type: 'PROGRESS_REMINDER',
        title: 'Nhắc nhở tiến độ học',
        message: 'Bạn đã hoàn thành 50% khóa học "Java Basics". Hãy tiếp tục nhé!',
        link: '/courses/java-basics',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
      {
        id: 2,
        type: 'QA_REPLY',
        title: 'Có trả lời mới cho Q&A',
        message: 'Ai đó đã trả lời câu hỏi của bạn về "Spring Boot".',
        link: '/qa/123',
        isRead: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: 3,
        type: 'QA_REPLY',
        title: 'Cập nhật khóa học mới',
        message: 'Khóa học "React Advanced" đã mở đăng ký.',
        link: '/courses/react-advanced',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ];
    setNotifications(demoNotifications);
    setUnreadCount(demoNotifications.filter(n => !n.isRead).length);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
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
  };

  const handleMarkRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  };

  const handleViewAllNotifications = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Default: Navigate to notifications page
      window.location.href = '/notifications'; // Hoặc dùng useNavigate nếu cần
    }
    setIsNotificationOpen(false);
  };

  // Helper: Get icon for notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'PROGRESS_REMINDER': return '📚';
      case 'QA_REPLY': return '💬';
      default: return '🔔';
    }
  };

  // Helper: Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    return `${Math.floor(diff / 60)} giờ trước`;
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={handleToggleNotification}
        className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Thông báo"
        aria-expanded={isNotificationOpen}
        aria-haspopup="true"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isNotificationOpen && (
        <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`flex px-4 py-3 ${
                  !notif.isRead ? 'bg-blue-50' : 'bg-white'
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex-shrink-0">
                  <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="ml-2 flex-shrink-0 text-xs text-blue-600 hover:text-blue-700"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                    >
                      Xem chi tiết
                    </Link>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{formatTime(notif.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleViewAllNotifications}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}