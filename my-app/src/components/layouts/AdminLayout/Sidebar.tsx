import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Edit,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { SidebarProps } from "../../../types";

interface MenuItem {
  id: string;
  icon?: React.ReactNode;
  label: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [expanded, setExpanded] = useState(new Set(["users", "courses"]));
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.replace("/", "");

  const menuItems: MenuItem[] = [
    { id: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    {
      id: "users",
      icon: <Users className="w-5 h-5" />,
      label: "User",
      children: [
        { id: "list-users", icon: <Users className="w-4 h-4" />, label: "List User" },
        { id: "comments", icon: <MessageSquare className="w-4 h-4" />, label: "Comment" },
      ],
    },
    {
      id: "courses",
      icon: <BookOpen className="w-5 h-5" />,
      label: "Course",
      children: [
        { id: "list-courses", icon: <ClipboardList className="w-4 h-4" />, label: "List Course" },
        { id: "add-course", icon: <Plus className="w-4 h-4" />, label: "Add Course" },
        { id: "update-course", icon: <Edit className="w-4 h-4" />, label: "Update Course" },
      ],
    },
    { id: "analytics", icon: <BarChart3 className="w-5 h-5" />, label: "Analyst" },
  ];

  const otherItems: MenuItem[] = [
    { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Setting" },
  ];

  const handleTabClick = (id: string) => {
    navigate(`/${id}`);
  };

  const renderMenuItem = (item: MenuItem, isSubItem = false) => {
    const isActive =
      currentPath === item.id ||
      (item.children && item.children.some((child) => currentPath === child.id));

    const baseClass = `w-full flex items-center ${
      isSubItem ? "gap-2 pl-8 py-2" : "gap-3 px-3 py-2.5"
    } rounded-lg transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-600 font-semibold"
        : "bg-white text-gray-600 hover:bg-gray-100"
    }`;

    if (item.children && !isSubItem) {
      const isExpandedItem = expanded.has(item.id);
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => {
              setExpanded((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(item.id)) {
                  newSet.delete(item.id);
                } else {
                  newSet.add(item.id);
                }
                return newSet;
              });
            }}
            className={baseClass}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 flex-1">
                {item.icon}
                {isOpen && <span className="font-medium">{item.label}</span>}
              </div>
              {isOpen && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isExpandedItem ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>
          </button>
          {isOpen && isExpandedItem && (
            <div className="space-y-1 ml-4">
              {item.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleTabClick(child.id)}
                  className={`w-full flex items-center gap-2 pl-8 py-2 rounded-lg transition-colors ${
                    currentPath === child.id
                      ? "bg-blue-100 text-blue-600 font-semibold"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {child.icon}
                  <span className="font-medium">{child.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <button key={item.id} onClick={() => handleTabClick(item.id)} className={baseClass}>
          {item.icon}
          {isOpen && <span className="font-medium">{item.label}</span>}
        </button>
      );
    }
  };

  return (
    <aside
      className={`${
        isOpen ? "w-72" : "w-20"
      } bg-white border-r border-gray-200 transition-all duration-300 h-screen flex flex-col fixed top-0 left-0 z-50 overflow-hidden`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b flex-shrink-0">
        {isOpen ? (
          <h2 className="text-base font-bold text-gray-900">Edu Admin</h2>
        ) : (
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="p-3 flex-1 overflow-y-auto">
        {isOpen && (
          <div className="mb-4 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            MENU
          </div>
        )}
        <div className="space-y-1">{menuItems.map((item) => renderMenuItem(item))}</div>

        {isOpen && (
          <div className="mt-6 mb-4 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            OTHERS
          </div>
        )}
        <div className="space-y-1">{otherItems.map((item) => renderMenuItem(item))}</div>
      </nav>
    </aside>
  );
};

export default Sidebar;
