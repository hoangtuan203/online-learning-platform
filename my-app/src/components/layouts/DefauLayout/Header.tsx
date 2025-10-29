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
import { useState, useEffect } from "react"; // Added useEffect for auth check

const navLinkBase =
  "px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 rounded-xl hover:bg-blue-50 hover:text-blue-600";

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // Store user from localStorage
  const navigate = useNavigate();

  // Check auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleToggleDropdown = () => {
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
    navigate("/profile"); // Adjust route as needed
    setIsDropdownOpen(false);
  };

  const handleEnrolledCourses = () => {
    navigate("/enrolled-courses"); // Adjust route as needed
    setIsDropdownOpen(false);
  };

  // Avatar initial (first letter of name)
  const getInitial = () => user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100/50 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Enhanced with hover */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Logo className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity" />
          </div>
          {/* <span className="hidden sm:inline text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Elysia</span> */}
        </Link>

        {/* Nav Links - With icons, responsive */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `${navLinkBase} ${isActive ? "bg-blue-100 text-blue-600 shadow-sm" : ""}`}
            title="Trang chủ"
          >
            {({ isActive }) => (
              <>
                <Home className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-600"}`} />
                Trang chủ
              </>
            )}
          </NavLink>
          <NavLink 
            to="/courses" 
            className={({ isActive }) => `${navLinkBase} ${isActive ? "bg-blue-100 text-blue-600 shadow-sm" : "text-gray-900"}`}
            title="Khóa học"
          >
            {({ isActive }) => (
              <>
                <BookOpen className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-900"}`} />
                Khóa học
              </>
            )}
          </NavLink>
        </nav>

        {/* CTA & Mobile Menu / Logged-in Dropdown */}
        <div className="flex items-center gap-3 relative">
          {/* Before login: CTA Button */}
          {!user ? (
            <Link
              to="/courses"
              className="hidden sm:inline-flex items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
              title="Bắt đầu học"
            >
              <Play className="w-4 h-4 mr-2" />
              Bắt đầu học
            </Link>
          ) : (
            // After login: Avatar + Name + Dropdown
            <div className="relative">
              <button
                onClick={handleToggleDropdown}
                className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                title="Menu người dùng"
              >
                {/* Avatar */}
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                      {getInitial()}
                    </div>
                  )}
                </div>
                {/* Name + Arrow - Full name, no truncate */}
                <span className="hidden sm:inline mr-2">{user.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu - Clean, simple design */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 overflow-hidden divide-y divide-gray-100">
                  {/* Profile */}
                  <button
                    onClick={handleProfile}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Thông tin cá nhân</span>
                  </button>
                  
                  {/* Divider */}
                  <div className="my-1" />
                  
                  {/* Enrolled Courses */}
                  <button
                    onClick={handleEnrolledCourses}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Khóa học đã đăng ký</span>
                  </button>
                  
                  {/* Divider */}
                  <div className="my-1" />
                  
                  {/* Logout - Subtle red */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all duration-200"
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