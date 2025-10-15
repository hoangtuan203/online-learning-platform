import React, { type ReactNode }  from "react"; // Import ReactNode
import { Header } from "./Header";

interface DefaultLayoutProps {
  children: ReactNode; 
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header /> 
      <main className="flex-grow">
        {children} 
      </main>
    </div>
  );
};

export default DefaultLayout;