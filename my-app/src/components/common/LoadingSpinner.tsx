import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  color = "border-indigo-600" 
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-32 w-32",
  };

  return (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${color}`}
      role="status"
      aria-label="Đang tải..."
    >
      <span className="sr-only">Đang tải...</span>
    </div>
  );
};

export default LoadingSpinner;