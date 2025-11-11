import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  message?: string;  // Optional message below spinner
  fullScreen?: boolean;  // Optional: full screen centering (default true)
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  color = "border-indigo-600",
  message = "Đang tải...",
  fullScreen = true
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-32 w-32",
  };

  const spinner = (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${color}`}
      role="status"
      aria-label="Đang tải..."
    >
      <span className="sr-only">Đang tải...</span>
    </div>
  );

  if (!fullScreen) {
    // Non-fullscreen: Just return spinner (for inline use)
    return spinner;
  }

  // Fullscreen centering
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 flex-col gap-4">
      {spinner}
      {message && <p className="text-gray-600 text-center">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;