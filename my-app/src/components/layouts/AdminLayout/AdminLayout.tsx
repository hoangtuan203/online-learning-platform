import React, { type ReactNode } from "react"; // Import ReactNode
import { useState } from "react";
import HeaderAdmin from "./HeaderAdmin";
import Sidebar from "./Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleToggle = () => setSidebarOpen(!sidebarOpen);

  const getTitle = (tab: string) => {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'list-users': 'List Users',
      'comments': 'Comments',
      'list-courses': 'List Courses',
      'add-content-course': 'Add Course',
      'update-course': 'Update Course',
      'analytics': 'Analytics',
      'settings': 'Settings',
    };
    return titles[tab] || 'Admin';
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggle={handleToggle} 
      />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >

        <div className="flex-shrink-0">
          <HeaderAdmin
            title={getTitle(activeTab)} 
            onToggle={handleToggle}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;