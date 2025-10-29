import { Bell, Search, Menu, Moon, ChevronDown, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import type { HeaderProps } from "../../../types";
import { useNavigate } from "react-router-dom";

const HeaderAdmin: React.FC<HeaderProps & { onToggle?: () => void }> = ({
  title,
  onToggle,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; username: string } | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleToggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <header className="h-16 bg-white border-b  px-6 flex items-center justify-between relative">

      <div className="flex items-center pl-8 ">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        {title && (
          <h2 className="ml-4 text-sm font-semibold text-gray-900">{title}</h2>
        )}
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search or type command..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <Moon className="w-5 h-5 text-gray-600" />
        </button>
        <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleToggleDropdown}
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
            {initial}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 text-center">{user?.name || "Admin User"}</p>
            <p className="text-xs text-gray-500">{user?.email || "admin@edu.com"}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderAdmin;