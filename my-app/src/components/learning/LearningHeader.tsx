// src/components/learning/LearningHeader.tsx
import { Link } from "react-router-dom";
import { ChevronLeft, Menu, Edit3, Settings, Volume2, MessageCircle } from "lucide-react";

interface LearningHeaderProps {
  title: string;
  progress: number;
  totalTime: string;
  notesLength: number;
  questionsLength: number;
  activeSidebar: "lessons" | "notes" | "qa";
  onToggleNotes: () => void;
  onToggleQA: () => void;
  onToggleSidebar: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  id: string;
}

export default function LearningHeader({
  title,
  progress,
  totalTime,
  notesLength,
  questionsLength,
  activeSidebar,
  onToggleNotes,
  onToggleQA,
  onToggleSidebar,
  volume,
  onVolumeChange,
  id,
}: LearningHeaderProps) {
  // Calculate circle progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <header className="bg-white text-gray-900 px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        <Link
          to={`/courses/detail/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>

        <h4 className="text-base font-medium text-gray-900">{title}</h4>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke="#16a34a"
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
              {progress}%
            </span>
          </div>
        </div>

        {/* Notes Button */}
        <button
          onClick={onToggleNotes}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            activeSidebar === "notes"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span className="text-sm font-medium">Ghi chú</span>
          {notesLength > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {notesLength}
            </span>
          )}
        </button>

        {/* Q&A Button */}
        <button
          onClick={onToggleQA}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            activeSidebar === "qa"
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Hỏi đáp</span>
          {questionsLength > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {questionsLength}
            </span>
          )}
        </button>

        {/* Time */}
        <span className="text-sm text-gray-600">{totalTime}</span>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
          >
            <Volume2
              className={`h-5 w-5 ${
                volume > 0 ? "text-gray-600" : "text-gray-400"
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
