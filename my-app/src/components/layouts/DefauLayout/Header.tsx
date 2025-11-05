// File Header.tsx - Cập nhật (tách Notification ra ngoài)

import { Link, NavLink, useNavigate } from "react-router-dom";
import { Logo } from "../../common/Logo";
import { 
  Home, 
  BookOpen, 
  Menu, 
  Play,
  User, // For profile icon
  LogOut, // For logout icon
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react"; // Already have useRef
import { NotificationDropdown } from "../../notification/NotificationDropdown";


const navLinkBase =
  "px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 rounded-md hover:bg-gray-100 hover:text-blue-600";

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // User dropdown only
  const [user, setUser] = useState<any>(null); // Store user from localStorage
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null); // User dropdown ref

  // Check auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const handleEnrolledCourses = () => {
    navigate("/enrolled-courses");
    setIsDropdownOpen(false);
  };

  // Callback cho Notification khi view all (tùy chọn)
  const handleViewAllNotifications = () => {
    navigate("/notifications");
  };

  // Avatar initial
  const getInitial = () => user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="w-full flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Simplified */}
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
        </Link>

        {/* Nav Links - Simplified */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `${navLinkBase} ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
            title="Trang chủ"
          >
            {({ isActive }) => (
              <>
                <Home className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                Trang chủ
              </>
            )}
          </NavLink>
          <NavLink 
            to="/courses" 
            className={({ isActive }) => `${navLinkBase} ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
            title="Khóa học"
          >
            {({ isActive }) => (
              <>
                <BookOpen className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                Khóa học
              </>
            )}
          </NavLink>
        </nav>

        {/* CTA & Mobile Menu / Logged-in Actions */}
        <div className="flex items-center gap-3">
          {/* Before login: CTA Button */}
          {!user ? (
            <Link
              to="/courses"
              className="hidden sm:inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Bắt đầu học"
            >
              <Play className="w-4 h-4 mr-2" />
              Bắt đầu học
            </Link>
          ) : (
            <>
              <NotificationDropdown
                userId={user.id} // Truyền userId nếu cần cho API
                onViewAll={handleViewAllNotifications}
              />

              {/* User Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleToggleDropdown}
                  className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Menu người dùng"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs">
                      {getInitial()}
                    </div>
                  )}
                  {/* Name + Arrow */}
                  <span className="hidden sm:inline truncate max-w-32">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* User Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={handleProfile}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">Thông tin cá nhân</span>
                    </button>
                    <button
                      onClick={handleEnrolledCourses}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">Khóa học đã đăng ký</span>
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="truncate">Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Menu"
            title="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}