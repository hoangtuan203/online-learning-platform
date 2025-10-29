import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import type { Course } from "../../types/Course";
import type { NoteResponse } from "../../service/NoteService";
import { CourseService } from "../../service/CourseService";
import { EnrollService } from "../../service/EnrollService"; // Added import for EnrollService
import type { ContentResponse } from "../../service/CourseService";
import LearningHeader from "../../components/learning/LearningHeader";
import LearningMain from "../../components/learning/LearningMain";
import LearningSidebar from "../../components/learning/LearningSidebar";
import LearningFooter from "../../components/learning/LearningFooter";
import { AlertCircle, BookOpen, CheckCircle, FileText, Play } from "lucide-react";
import NoteForm from "../../components/learning/NoteForm";
import { NoteService } from "../../service/NoteService";
import type { NoteRequest } from "../../service/NoteService";
import NotesOverlay from "../../components/learning/NotesOverlay";
import toast from "react-hot-toast"; // Added for notifications

const courseService = new CourseService();
const enrollService = new EnrollService(); // Instantiate EnrollService
const noteService = new NoteService();

interface LearningData {
  title: string;
  progress: number;
  totalTime: string;
  lessons: Array<{
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    type: string;
  }>;
  sidebarSections: Array<{
    icon: any;
    title: string;
    count?: number;
    items?: any[];
  }>;
  notes: Array<string | NoteResponse>;
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

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function LearningPage() {
  const { id } = useParams<{ id: string }>();
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [currentContent, setCurrentContent] = useState<ContentResponse | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null); // Added state for enrollmentId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<'lessons' | 'notes'>('lessons');
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalDuration, setTotalDuration] = useState("0:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[] | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [newNote, setNewNote] = useState("");
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [noteTimestamp, setNoteTimestamp] = useState<number>(0);
  const [noteContentTitle, setNoteContentTitle] = useState<string | null>(null);
  const [showNotesOverlay, setShowNotesOverlay] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID khóa học");
      setLoading(false);
      return;
    }

    const fetchLearningData = async () => {
      try {
        setLoading(true);
        setError(null);

        const course: Course = await courseService.getCourseById(id);

        const fetchedContents: ContentResponse[] =
          await courseService.getContentsByCourseId(id);
        console.log("Fetched contents:", fetchedContents);
        const sortedContents = fetchedContents.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setContents(sortedContents);

        // Calculate total time
        const totalSeconds = sortedContents
          .filter(
            (content) => content.type === "VIDEO" && content.duration != null
          )
          .reduce((sum, content) => sum + (content.duration || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const totalTime = `${hours}:${minutes.toString().padStart(2, "0")}`;

        // Build lessons
        const lessons = sortedContents.map((content) => {
          const durationSeconds = content.duration || 0;
          const duration = formatTime(durationSeconds);
          return {
            id: content.id,
            title: content.title,
            duration,
            completed: false,
            type: content.type,
          };
        });

        // Default to first content
        const defaultLessonId = sortedContents[0]?.id || null;
        if (defaultLessonId) {
          setSelectedLessonId(defaultLessonId);
          setCurrentContent(sortedContents[0]);
        }

        // Progress initial
        const progress = 0;

        const sidebarSections = [
          { icon: BookOpen, title: "Nội dung khóa học", items: [] },
        ];

        const notes = [
          "Ghi chú 1: Đây là ghi chú đầu tiên.",
          "Ghi chú 2: Nội dung quan trọng.",
          "Ghi chú 3: Cần ôn lại phần này.",
          "Ghi chú 4: Ví dụ minh họa hay.",
          "Ghi chú 5: Kết luận chính.",
        ];

        // Fetch enrollmentId using checkEnrollment (assume userId from auth/context, hardcoded for now)
        const userId = 1; // TODO: Replace with actual user ID from auth context
        const enrollmentStatus = await enrollService.checkEnrollment({ courseId: Number(id), userId });
        if (enrollmentStatus.enrolled && enrollmentStatus.enrollmentId) {
          setEnrollmentId(Number(enrollmentStatus.enrollmentId));
        } else {
          throw new Error('Bạn chưa đăng ký khóa học này');
        }

        setLearningData({
          title: course.title,
          progress,
          totalTime,
          lessons,
          sidebarSections,
          notes,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải dữ liệu học tập"
        );
        console.error("Error fetching learning data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [id]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const togglePlay = () => {
    console.log(videoRef.current?.src)
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCompleteLesson = useCallback(async () => {
    if (!selectedLessonId || !learningData || !enrollmentId) return;

    try {
      setLearningData((prev) => {
        if (!prev) return prev;
        const updatedLessons = prev.lessons.map((l) =>
          l.id === selectedLessonId ? { ...l, completed: true } : l
        );
        const completedCount = updatedLessons.filter((l) => l.completed).length;
        const newProgress = Math.round(
          (completedCount / updatedLessons.length) * 100
        );
        return {
          ...prev,
          lessons: updatedLessons,
          progress: newProgress,
        };
      });

      const request: UpdateProgressRequest = {
        contentItemId: selectedLessonId,
      };

      if (currentContent?.type === "VIDEO" && videoRef.current) {
        request.durationSpent = Math.floor(videoRef.current.currentTime);
      }

      if (currentContent?.type === "QUIZ" && quizResult) {
        request.score = (quizResult.score / quizResult.total) * 100;
      }

      await enrollService.updateProgress(enrollmentId, request);
      toast.success("Tiến độ đã được cập nhật!");
    } catch (err) {
      console.error("Error updating progress:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật tiến độ");
    }
  }, [selectedLessonId, learningData, enrollmentId, currentContent?.type, quizResult]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(formatTime(video.currentTime));
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setTotalDuration(formatTime(video.duration));
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    handleCompleteLesson();
  }, [handleCompleteLesson]);

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleFullScreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen().then(() => setIsFullScreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setQuizAnswers(null);
    setQuizResult(null);
    const selectedContent = contents.find((c) => c.id === lessonId);
    if (selectedContent) {
      setCurrentContent(selectedContent);
      // Reset video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };



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

  const handleQuizSubmit = () => {
    if (
      !quizAnswers ||
      !currentContent?.questions ||
      quizAnswers.length !== currentContent.questions.length
    )
      return;
    const questions = currentContent.questions as QuizQuestion[];
    const score = quizAnswers.reduce(
      (sum, ans, i) => sum + (ans === questions[i].correctOptionIndex ? 1 : 0),
      0
    );
    const total = questions.length;
    const answers = questions.map(
      (q, i) => quizAnswers[i] === q.correctOptionIndex
    );
    setQuizResult({ score, total, answers });
    if (score / total > 0.8) { // 80% threshold for quiz completion
      handleCompleteLesson();
    }
  };

  const handlePrevLesson = () => {
    if (!selectedLessonId || !learningData) return;
    const currentIndex = learningData.lessons.findIndex(
      (l) => l.id === selectedLessonId
    );
    if (currentIndex > 0) {
      const prevId = learningData.lessons[currentIndex - 1].id;
      handleLessonSelect(prevId);
    }
  };

  const handleNextLesson = async () => {
    if (!selectedLessonId || !learningData || !enrollmentId) return;

    // Check completion based on type before proceeding
    let isCompleted = false;
    const currentLessonType = currentContent?.type || '';
    const currentVideo = videoRef.current;

    switch (currentLessonType) {
      case 'QUIZ':
        // require >= 80% correct
        if (quizResult && quizResult.total > 0 && (quizResult.score / quizResult.total) >= 0.8) {
          isCompleted = true;
        } else {
          toast.error("Bạn cần hoàn thành quiz với ít nhất 80% để tiếp tục.");
          return; // Block next if not completed
        }
        break;
      case 'VIDEO':
        // require >= 80% watched
        if (currentVideo && currentVideo.duration > 0) {
          const watchedRatio = (currentVideo.currentTime || 0) / currentVideo.duration;
          if (watchedRatio >= 0.8) {
            isCompleted = true;
          } else {
            toast.error("Bạn cần xem ít nhất 80% video để tiếp tục.");
            return;
          }
        } else {
          // If no video element (e.g., youtube iframe) allow proceeding only if duration info not available
          toast.error("Không thể xác định tiến độ video. Hãy xem nội dung trước khi tiếp tục.");
          return;
        }
        break;
      case 'DOCUMENT':
        isCompleted = true; // Always completed for document
        break;
      default:
        isCompleted = true;
    }

    if (isCompleted) {
      // Update progress if not already done (e.g., for document or manual next)
      await handleCompleteLesson();
    }

    // Proceed to next lesson
    const currentIndex = learningData.lessons.findIndex(
      (l) => l.id === selectedLessonId
    );
    if (currentIndex < learningData.lessons.length - 1) {
      const nextId = learningData.lessons[currentIndex + 1].id;
      handleLessonSelect(nextId);
      // Save current position to backend
      try {
        await enrollService.updateCurrentPosition(enrollmentId, { currentContentId: nextId });
      } catch (err) {
        console.error("Lỗi lưu vị trí học hiện tại:", err);
      }
    }
  };

  const handleOpenAddNoteForm = () => {
    const seconds = Math.floor(videoRef.current?.currentTime || 0);
    const videoTitle = currentContent?.title || '';
    setNoteTimestamp(seconds);
    setNoteContentTitle(videoTitle || null);
    setNewNote('');
    setShowAddNoteForm(true);
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    if (!learningData) return;
    if (!enrollmentId) {
      toast.error('Không tìm thấy enrollment. Vui lòng đăng nhập.');
      return;
    }

    try {
      // If editing, update existing note
      if (editingNote) {
        const request: Partial<NoteRequest> = {
          noteText: newNote
        };
        const updated = await noteService.updateNote(enrollmentId, editingNote.id, request);
        
        // Update note in UI
        setLearningData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            notes: prev.notes.map(note => {
              if (typeof note === 'string') return note;
              return note.id === editingNote.id ? updated : note;
            })
          };
        });

        setEditingNote(null);
        setNewNote("");
        setShowAddNoteForm(false);
        toast.success('Ghi chú đã được cập nhật');
        return;
      }

      // Add new note
      const request: NoteRequest = {
        contentId: currentContent?.id || selectedLessonId || '',
        contentTitle: noteContentTitle || currentContent?.title || '',
        courseTitle: learningData.title,
        timestamp: formatTime(noteTimestamp),
        noteText: newNote,
      };

      const saved = await noteService.addNote(enrollmentId, request);

      // Update UI notes list (append newest NoteResponse so components can read contentTitle)
      setLearningData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: [...prev.notes, saved as any],
        };
      });

      setNewNote("");
      setShowAddNoteForm(false);
      toast.success('Ghi chú đã được lưu');
    } catch (err) {
      console.error('Lỗi lưu ghi chú:', err);
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu ghi chú');
    }
  };

  const handleCancelNote = () => {
    setNewNote("");
    setShowAddNoteForm(false);
    setEditingNote(null);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!enrollmentId) return;
    
    try {
      await noteService.deleteNote(enrollmentId, noteId);
      
      // Remove note from UI
      setLearningData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: prev.notes.filter(note => {
            if (typeof note === 'string') return true;
            return note.id !== noteId;
          })
        };
      });
      
      toast.success('Ghi chú đã được xóa');
    } catch (err) {
      console.error('Lỗi xóa ghi chú:', err);
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xóa ghi chú');
    }
  };

  const handleToggleNotes = () => {
    if (activeSidebar === 'notes') {
      setActiveSidebar('lessons');
      setShowNotesOverlay(false);
    } else {
      // Open overlay notes (do not resize sidebar)
      setActiveSidebar('notes');
      setShowNotesOverlay(true);

      // Load notes from server for this enrollment when opening notes overlay
      (async () => {
        if (!enrollmentId) return;
        try {
          const serverNotes = await noteService.getNotes(enrollmentId);
          // Keep full NoteResponse objects so UI can use contentTitle, timestamp, noteText
          setLearningData((prev) => (prev ? { ...prev, notes: serverNotes as any[] } : prev));
        } catch (err) {
          console.warn('Không thể tải ghi chú:', err);
        }
      })();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleFullScreenChange = () =>
      setIsFullScreen(!!document.fullscreenElement);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleVideoEnded);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleVideoEnded);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleVideoEnded]);

  // Load server-side progress and current position when we have an enrollmentId
  useEffect(() => {
    if (!enrollmentId) return;

    const loadProgressAndPosition = async () => {
      try {
        // Fetch progress summary
        const progress: ProgressResponse = await enrollService.getProgress(enrollmentId);
        // Update local progress percentage
        setLearningData((prev) => {
          if (!prev) return prev;
          let updatedLessons = prev.lessons;
          // If server returned completedContentItems, mark first N lessons as completed
          if (typeof progress.completedContentItems === 'number' && progress.completedContentItems > 0) {
            updatedLessons = prev.lessons.map((l, idx) => ({
              ...l,
              completed: idx < progress.completedContentItems ? true : l.completed,
            }));
          }
          return {
            ...prev,
            progress: progress.progressPercentage ?? prev.progress,
            lessons: updatedLessons,
          };
        });

        // Fetch current position and set selected lesson to it
        try {
          const pos = await enrollService.getCurrentPosition(enrollmentId);
          if (pos && pos.currentContentId) {
            setSelectedLessonId(pos.currentContentId);
            const selected = contents.find((c) => c.id === pos.currentContentId);
            if (selected) setCurrentContent(selected);
          }
        } catch (err) {
          // Non-fatal: log and continue
          console.warn('Không lấy được vị trí hiện tại:', err);
        }
      } catch (err) {
        console.error('Lỗi khi tải tiến độ/hồi vị:', err);
      }
    };

    loadProgressAndPosition();
  }, [enrollmentId, contents]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentContent?.url) return;
    const url = currentContent.url;
    const videoId = getVideoIdFromUrl(url);
    if (!videoId) {
      video.src = url;
      video.load();
    }
    video.volume = volume;
  }, [volume, currentContent?.url]);

  const handleMouseEnter = () => setShowControls(true);
  const handleMouseLeave = () => setShowControls(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải nội dung học tập...</p>
        </div>
      </div>
    );
  }

  if (error || !learningData || !currentContent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không thể tải khóa học
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Khóa học không tồn tại"}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách khóa học
          </Link>
        </div>
      </div>
    );
  }

  const { title, progress, totalTime, lessons, sidebarSections, notes } = learningData;
  const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const isYouTube = currentContent.url ? getVideoIdFromUrl(currentContent.url) : null;

  return (
    <div className="bg-white text-gray-900 min-h-screen h-screen flex flex-col">
      <LearningHeader
        title={title}
        progress={progress}
        totalTime={totalTime}
        notesLength={notes.length}
        activeSidebar={activeSidebar}
        onToggleNotes={handleToggleNotes}
        onToggleSidebar={toggleSidebar}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        id={id || ''}
      />
      
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 h-full pb-24 transition-all duration-300 ease-in-out overflow-hidden flex flex-col">
          <LearningMain
            currentLesson={currentLesson}
            currentContent={currentContent}
            isYouTube={isYouTube}
            videoRef={videoRef}
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={totalDuration}
            showControls={showControls}
            isFullScreen={isFullScreen}
            onTogglePlay={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onVideoEnded={handleVideoEnded}
            onVolumeChange={handleVolumeChange}
            onToggleFullScreen={toggleFullScreen}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            quizAnswers={quizAnswers}
            quizResult={quizResult}
            onQuizSubmit={handleQuizSubmit}
            setQuizAnswers={setQuizAnswers}
            onOpenAddNoteForm={handleOpenAddNoteForm}
            showAddNoteForm={showAddNoteForm}
            // pass whether overlay is visible so LearningMain can avoid layout shifts if needed
            // (LearningMain already handles its own scroll; this prop is informational)
            
          />
        </div>
        
        <div className={`flex-shrink-0 min-h-0 h-full transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-80' : 'w-0'
        }`}>
          <LearningSidebar
            isOpen={isSidebarOpen}
            activeTab={activeSidebar}
            lessons={lessons}
            sidebarSections={sidebarSections}
            notes={notes}
            selectedLessonId={selectedLessonId}
            onLessonSelect={handleLessonSelect}
            onToggleSidebar={(open: boolean) => {
              setIsSidebarOpen(open);
              if (!open) setActiveSidebar('lessons');
            }}
            onToggleTab={setActiveSidebar}
            renderTypeIcon={renderTypeIcon}
          />
        </div>
        {/* Notes overlay (renders above content) */}
        {showNotesOverlay && learningData && (
          <div className="fixed inset-0 z-50">
            <NotesOverlay
              notes={learningData.notes}
              title={learningData.title}
              onClose={() => {
                setShowNotesOverlay(false);
                setActiveSidebar('lessons');
              }}
              onUpdateNote={async (noteId: number, newText: string) => {
                const note = learningData.notes.find(n => 
                  typeof n !== 'string' && n.id === noteId
                ) as NoteResponse | undefined;
                
                if (note) {
                  setEditingNote(note);
                  setNewNote(newText || note.noteText);
                  setShowAddNoteForm(true);
                }
              }}
              onDeleteNote={handleDeleteNote}
              enrollmentId={enrollmentId || 0}
            />
          </div>
        )}
      </div>
      
      <NoteForm
        show={showAddNoteForm && (currentLesson.type === "VIDEO" || !!editingNote)}
        newNote={newNote}
        onChange={setNewNote}
        onSave={handleSaveNote}
        onCancel={handleCancelNote}
        timestamp={noteTimestamp}
        isEditing={!!editingNote}
        contentTitle={editingNote?.contentTitle || noteContentTitle || ''}
      />
      
      <LearningFooter
        onPrevLesson={handlePrevLesson}
        onNextLesson={handleNextLesson}
        disabledPrev={!selectedLessonId || !learningData}
        disabledNext={!selectedLessonId || !learningData}
      />
    </div>
  );
}