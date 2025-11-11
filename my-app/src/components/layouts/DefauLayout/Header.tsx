// File Header.tsx - Cập nhật (tách Notification ra ngoài, fix avatar Google)

import { Link, NavLink, useNavigate } from "react-router-dom";
import { Logo } from "../../common/Logo";
import { 
  Home, 
  BookOpen, 
  Menu, 
  Play,
  LogOut, // For logout icon
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "../../notification/NotificationDropdown";

const navLinkBase =
  "px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 rounded-md hover:bg-gray-100 hover:text-blue-600";

export function Header() {
  const [user, setUser] = useState<any>(null); // Store user from localStorage
  const [avatarError, setAvatarError] = useState(false); // FIXED: State để handle lỗi load avatar
  const [avatarLoading, setAvatarLoading] = useState(true); // FIXED: Loading state cho avatar
  const navigate = useNavigate();

  // Check auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log("Logged in user:", parsedUser);
      // Reset avatar states khi load user mới
      setAvatarError(false);
      setAvatarLoading(true);
      console.log("Header loaded user avatarUrl:", parsedUser.avatarUrl); // DEBUG: Check URL
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleViewAllNotifications = () => {
    navigate("/notifications");
  };

  const getInitial = () => user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // FIXED: Helper để lấy URL resized (CORS-friendly cho Google)
  const getAvatarSrc = () => {
    const baseUrl = user?.avatarUrl;
    if (!baseUrl) return null;
    // Resize to s200-c for better CORS (test OK)
    return baseUrl.replace(/=s\d+-[cp]?/, '=s200-c');
  };

  const handleAvatarLoad = () => {
    setAvatarLoading(false);
    setAvatarError(false);
    console.log("Header avatar loaded successfully"); // DEBUG: Confirm load
  };

  const handleAvatarError = () => {
    setAvatarLoading(false);
    setAvatarError(true);
    console.error("Header avatar load failed for URL:", user?.avatarUrl); // DEBUG: Log URL fail
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="w-full flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
        </Link>

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

              {/* User Profile Link */}
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Hồ sơ cá nhân"
              >
                {/* FIXED: Avatar với loading + error handling tương tự Profile */}
                <div className={`relative h-7 w-7 rounded-full overflow-hidden bg-gray-200 ${
                  (user.avatarUrl) && !avatarError && !avatarLoading
                    ? "bg-gray-200"
                    : "bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-semibold text-xs"
                }`}>
                  {user.avatarUrl && !avatarError ? (
                    <div className="relative h-full w-full">
                      {avatarLoading && (
                        <div className="absolute inset-0 animate-pulse bg-gray-300 rounded-full"></div> // Skeleton nhỏ
                      )}
                      <img
                        src={getAvatarSrc()} // FIXED: Use resized URL
                        alt={user.name}
                        className={`h-full w-full object-cover transition-opacity duration-300 ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={handleAvatarLoad}
                        onError={handleAvatarError}
                        crossOrigin="anonymous" // FIXED: Opt-in CORS cho Google
                        referrerPolicy="no-referrer" // FIXED: Ẩn origin
                      />
                    </div>
                  ) : null}
                  {/* FIXED: Fallback div overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-white font-semibold text-xs bg-gradient-to-br from-gray-500 to-gray-700 rounded-full"
                    style={{
                      display: user.avatarUrl && !avatarError ? 'none' : 'flex'
                    }}
                  >
                    {getInitial()}
                  </div>
                </div>
                {/* Name */}
                <span className="hidden sm:inline whitespace-nowrap max-w-xs">{user.name}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
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