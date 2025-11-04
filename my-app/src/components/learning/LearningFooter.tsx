import { ChevronLeft, ChevronRight } from "lucide-react";

interface LearningFooterProps {
  onPrevLesson: () => void;
  onNextLesson: () => void;
  disabledPrev: boolean;
  disabledNext: boolean;
  currentTitle: string;
}

export default function LearningFooter({
  onPrevLesson,
  onNextLesson,
  disabledPrev,
  disabledNext,
  currentTitle,
}: LearningFooterProps) {
  return (
    <footer className="bg-white px-4 py-2 flex items-center justify-between border-t border-gray-200 shadow-sm fixed bottom-0 left-0 right-0 z-10">
      <button
        onClick={onPrevLesson}
        disabled={disabledPrev}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-3 w-3" />
        Trước
      </button>
      <div className="flex-1 mx-3 text-center">
        <div className="text-sm font-medium text-gray-900 truncate">
          {currentTitle}
        </div>
      </div>
      <button
        onClick={onNextLesson}
        disabled={disabledNext}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Tiếp
        <ChevronRight className="h-3 w-3" />
      </button>
    </footer>
  );
}