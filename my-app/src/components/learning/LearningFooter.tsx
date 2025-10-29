import { ChevronLeft, ChevronRight, MessageCircle, Plus } from "lucide-react";

interface LearningFooterProps {
  onPrevLesson: () => void;
  onNextLesson: () => void;
  disabledPrev: boolean;
  disabledNext: boolean;
}

export default function LearningFooter({
  onPrevLesson,
  onNextLesson,
  disabledPrev,
  disabledNext,
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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-xs text-gray-600">Hỏi đáp</span>
          <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">12</span>
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