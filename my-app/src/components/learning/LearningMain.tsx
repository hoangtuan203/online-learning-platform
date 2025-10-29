// src/components/learning/LearningMain.tsx
import { type RefObject } from "react";
import { Play, ChevronLeft, FileText, Download, CheckCircle, Maximize2, Edit3 } from "lucide-react";
import type { ContentResponse } from "../../service/CourseService";
import QuizSection from "./QuizSection";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: string;
}

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface QuizResult {
  score: number;
  total: number;
  answers: boolean[];
}

interface LearningMainProps {
  currentLesson: Lesson;
  currentContent: ContentResponse | null;
  isYouTube: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: string;
  totalDuration: string;
  showControls: boolean;
  isFullScreen: boolean;
  onTogglePlay: () => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onVideoEnded: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleFullScreen: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  quizAnswers: number[] | null;
  quizResult: QuizResult | null;
  onQuizSubmit: () => void;
  setQuizAnswers: React.Dispatch<React.SetStateAction<number[] | null>>;
  onOpenAddNoteForm: () => void;
  showAddNoteForm: boolean;
  // removed isNotesOpen -- main will resize via flex container
}

export default function LearningMain({
  currentLesson,
  currentContent,
  isYouTube,
  videoRef,
  isPlaying,
  currentTime,
  totalDuration,
  showControls,
  isFullScreen,
  onTogglePlay,
  onTimeUpdate,
  onLoadedMetadata,
  onVideoEnded,
  onVolumeChange,
  onToggleFullScreen,
  onMouseEnter,
  onMouseLeave,
  quizAnswers,
  quizResult,
  onQuizSubmit,
  setQuizAnswers,
  onOpenAddNoteForm,
  showAddNoteForm,
}: LearningMainProps) {
  const getVideoIdFromUrl = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );
    return match ? match[1] : null;
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "QUIZ":
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const handleQuizChange = (qIndex: number, oIndex: number) => {
    setQuizAnswers((prev) => {
      const newAnswers = [...(prev || [])];
      newAnswers[qIndex] = oIndex;
      return newAnswers;
    });
  };

  return (
  <main className="flex-1 relative bg-gray-50 overflow-y-auto min-h-0 overscroll-contain">
      <div className="h-full w-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full">
            {currentLesson.type === "VIDEO" && currentContent?.url ? (
              isYouTube ? (
                <div className="h-130 bg-white rounded-lg overflow-hidden border border-gray-200 mb-6 flex items-center justify-center transition-all duration-300 ease-in-out">
                  <iframe
                    src={`https://www.youtube.com/embed/${isYouTube}?rel=0`}
                    className="w-full h-full rounded-lg"
                    title={currentContent.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  className="relative h-130 bg-white rounded-lg overflow-hidden border border-gray-200 mb-6 transition-all duration-300 ease-in-out"
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  <video
                    ref={videoRef}
                    src={currentContent.url}
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    preload="metadata"
                    onClick={onTogglePlay}
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onEnded={onVideoEnded}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer">
                      <Play className="h-16 w-16 text-white" />
                    </div>
                  )}
                  {(showControls || isPlaying) && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 hover:bg-white/30 rounded"
                          onClick={onTogglePlay}
                        >
                          {isPlaying ? (
                            <ChevronLeft className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5 text-white" />
                          )}
                        </button>
                        <div className="flex-1 mx-3">
                          <input
                            type="range"
                            min={0}
                            max={videoRef.current?.duration || 1}
                            step="0.1"
                            value={videoRef.current?.currentTime || 0}
                            onChange={(e) => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = Number(e.target.value);
                              }
                            }}
                            className="w-full h-1.5 bg-gray-400 rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, white ${
                                ((videoRef.current?.currentTime || 0) / (videoRef.current?.duration || 1)) * 100
                              }%, gray ${((videoRef.current?.currentTime || 0) / (videoRef.current?.duration || 1)) * 100}%)`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-white min-w-[3.5rem] text-center">
                          {currentTime} / {totalDuration}
                        </span>
                        <button
                          className="p-1.5 hover:bg-white/30 rounded"
                          onClick={onToggleFullScreen}
                        >
                          <Maximize2
                            className={`h-4 w-4 text-white ${isFullScreen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : currentLesson.type === "DOCUMENT" && currentContent?.url ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                <div className="p-3 bg-gray-50 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tài liệu</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={currentContent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Mở trong tab mới
                    </a>
                    <a
                      href={currentContent.url}
                      download
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Tải xuống
                    </a>
                  </div>
                </div>

                {/* Inline viewer area: prefer <object> for PDFs with iframe fallback */}
                <div className="w-full h-[480px]">
                  {(() => {
                    const url = currentContent.url;
                    const lower = url.toLowerCase();
                    const isPdf = lower.includes('.pdf');
                    const isOffice = /\.(docx?|pptx?|xlsx?|xls|ppt)(?:$|\?)/i.test(lower);

                    // Office viewer service (Microsoft) requires a publicly accessible URL
                    const officeViewerUrl = (u: string) =>
                      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}`;

                    if (isPdf) {
                      return (
                        <object
                          data={url}
                          type="application/pdf"
                          className="w-full h-full border-0"
                          aria-label={currentContent.title}
                        >
                          {/* Fallback for browsers that don't render <object> PDFs */}
                          <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title={currentContent.title}
                          />
                        </object>
                      );
                    }

                    if (isOffice) {
                      return (
                        <iframe
                          src={officeViewerUrl(url)}
                          className="w-full h-full border-0"
                          title={currentContent.title}
                        />
                      );
                    }

                    // Default fallback: iframe (works for embeddable previews and images)
                    return (
                      <iframe
                        src={url}
                        className="w-full h-full border-0"
                        title={currentContent.title}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : currentLesson.type === "QUIZ" && currentContent?.questions && currentContent.questions.length > 0 ? (
              <div className="max-w-2xl mx-auto">
                <QuizSection
                  questions={currentContent.questions as QuizQuestion[]}
                  quizAnswers={quizAnswers}
                  quizResult={quizResult}
                  onQuizChange={handleQuizChange}
                  onQuizSubmit={onQuizSubmit}
                />
              </div>
            ) : (
              <div className="h-[130px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 mb-6">
                <p className="text-gray-500 text-center px-4">
                  Nội dung này chưa sẵn sàng hoặc không hỗ trợ xem trước.
                  <br />
                  Vui lòng tải xuống hoặc liên hệ hỗ trợ.
                </p>
              </div>
            )}

            {/* Add Note Button under Video */}
            {currentLesson.type === "VIDEO" && !showAddNoteForm && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={onOpenAddNoteForm}
                  className="b flex items-center gap-2 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Thêm ghi chú
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}