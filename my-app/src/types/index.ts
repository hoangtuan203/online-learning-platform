export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

