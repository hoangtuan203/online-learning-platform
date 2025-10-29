import React, { type ReactNode } from "react";
import { Header } from "./Header";
import { useLocation } from "react-router-dom";

interface DefaultLayoutProps {
  children: ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/course/learning");
  return (
    <div className="flex flex-col min-h-screen w-full">
      {!hideHeader && <Header />}
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default DefaultLayout;
