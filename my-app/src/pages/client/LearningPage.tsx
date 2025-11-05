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
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  FileText,
  Play,
} from "lucide-react";
import NoteForm from "../../components/learning/NoteForm";
import { NoteService } from "../../service/NoteService";
import type { NoteRequest } from "../../service/NoteService";
import NotesOverlay from "../../components/learning/NotesOverlay";
import toast from "react-hot-toast"; // Added for notifications
import ErrorBoundary from "../../components/learning/ErrorBoundary";
import QAOverlay from "../../components/learning/QAOverlay";
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
  const [currentContent, setCurrentContent] = useState<ContentResponse | null>(
    null
  );
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null); // Added state for enrollmentId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<
    "lessons" | "notes" | "qa"
  >("lessons");
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
  const [showQAOverlay, setShowQAOverlay] = useState(false);
  const [userId, setUserId] = useState<number | null>(null); // Init null to allow setting
  const videoRef = useRef<HTMLVideoElement>(null);
  const fetchedUserRef = useRef(false); // Flag to run fetch only once, without moving logic
  // Keep original position but guard with ref to prevent loop
  if (!fetchedUserRef.current) {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        const idNum =
          typeof parsedUser.id === "number"
            ? parsedUser.id
            : parseInt(parsedUser.id as string, 10);
        if (isNaN(idNum)) {
          console.error("Invalid user ID from localStorage");
          setUserId(null);
        } else {
          setUserId(idNum);
          console.log("Fetched userId:", idNum);
        }
      } catch (parseError) {
        console.error("Lỗi parse user từ localStorage:", parseError);
        setUserId(null);
      }
    } else {
      setUserId(null);
      console.warn("Không tìm thấy user trong localStorage");
    }
    fetchedUserRef.current = true; // Set flag after fetch
  }
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
        // Fixed: Only check enrollment if userId exists; handle non-enrolled without throw
        let enrolled = false;
        if (userId) {
          try {
            const enrollmentStatus = await enrollService.checkEnrollment({
              courseId: Number(id),
              userId,
            });
            if (enrollmentStatus.enrolled && enrollmentStatus.enrollmentId) {
              enrolled = true;
              setEnrollmentId(Number(enrollmentStatus.enrollmentId));
            } else {
              // Fixed: Set error state instead of throw to avoid crash
              setError("Bạn chưa đăng ký khóa học này");
              enrolled = false;
            }
          } catch (enrollErr) {
            console.error("Error checking enrollment:", enrollErr);
            setError(
              enrollErr instanceof Error
                ? enrollErr.message
                : "Lỗi kiểm tra đăng ký khóa học"
            );
            enrolled = false;
          }
        } else {
          // No userId: Not enrolled
          setError("Bạn cần đăng nhập để truy cập khóa học");
          enrolled = false;
        }
        // Only set learningData if enrolled (or adjust logic as needed)
        if (enrolled) {
          setLearningData({
            title: course.title,
            progress,
            totalTime,
            lessons,
            sidebarSections,
            notes,
          });
        } else {
          // Early return in finally below
          setLoading(false);
          return;
        }
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
  }, [id, userId]); // Fixed: Add userId to deps so re-fetch if user logs in/out
  const formatTimeCallback = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);
  const togglePlay = () => {
    console.log(videoRef.current?.src);
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
  }, [
    selectedLessonId,
    learningData,
    enrollmentId,
    currentContent?.type,
    quizResult,
  ]);
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(formatTimeCallback(video.currentTime));
  }, [formatTimeCallback]);
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setTotalDuration(formatTimeCallback(video.duration));
  }, [formatTimeCallback]);
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
  
  // Kiểm tra xem bài học có được unlock không (bài đầu tiên hoặc bài sau bài đã completed)
  const isLessonUnlocked = useCallback((lessonId: string): boolean => {
    if (!learningData) return false;
    const currentIndex = learningData.lessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return false;
    
    // Bài đầu tiên luôn được unlock
    if (currentIndex === 0) return true;
    
    // Bài học được unlock nếu bài trước đó đã completed
    const prevLesson = learningData.lessons[currentIndex - 1];
    return prevLesson.completed === true;
  }, [learningData]);

  const handleLessonSelect = (lessonId: string) => {
    // Kiểm tra xem bài học có được unlock không
    if (!isLessonUnlocked(lessonId)) {
      toast.error("Bạn cần hoàn thành bài học trước đó để mở khóa bài này");
      return;
    }
    
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
    if (score / total > 0.8) {
      // 80% threshold for quiz completion
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
      const prevLesson = learningData.lessons[currentIndex - 1];
      handleLessonSelect(prevId);
      toast.success(`Đã chuyển sang: ${prevLesson.title}`);
    } else {
      toast("Bạn đang ở bài học đầu tiên", { icon: "ℹ️" });
    }
  };
  const handleNextLesson = async () => {
    if (!selectedLessonId || !learningData || !enrollmentId) return;
    // Check completion based on type before proceeding
    let isCompleted = false;
    const currentLessonType = currentContent?.type || "";
    const currentVideo = videoRef.current;
    switch (currentLessonType) {
      case "QUIZ":
        // require >= 80% correct
        if (
          quizResult &&
          quizResult.total > 0 &&
          quizResult.score / quizResult.total >= 0.8
        ) {
          isCompleted = true;
        } else {
          toast.error("Bạn cần hoàn thành quiz với ít nhất 80% để tiếp tục.");
          return; // Block next if not completed
        }
        break;
      case "VIDEO":
        // require 100% watched or video has ended
        if (currentVideo && currentVideo.duration > 0) {
          const watchedRatio =
            (currentVideo.currentTime || 0) / currentVideo.duration;
          const isVideoEnded = currentVideo.ended || false;
          // Allow if video ended or watched >= 99.5% (to account for small rounding differences)
          if (isVideoEnded || watchedRatio >= 0.995) {
            isCompleted = true;
          } else {
            const watchedPercent = Math.round(watchedRatio * 100);
            toast.error(
              `Bạn cần xem hết video để tiếp tục. Hiện tại: ${watchedPercent}%`
            );
            return;
          }
        } else {
          // If no video element (e.g., youtube iframe) - cannot verify completion
          toast.error(
            "Không thể xác định tiến độ video. Vui lòng xem hết video trước khi tiếp tục."
          );
          return;
        }
        break;
      case "DOCUMENT":
        // Document không cần kiểm tra, có thể chuyển ngay
        isCompleted = true;
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
      const nextLesson = learningData.lessons[currentIndex + 1];
      handleLessonSelect(nextId);
      // Save current position to backend
      try {
        await enrollService.updateCurrentPosition(enrollmentId, {
          currentContentId: nextId,
        });
        toast.success(`Đã chuyển sang: ${nextLesson.title}`);
      } catch (err) {
        console.error("Lỗi lưu vị trí học hiện tại:", err);
        toast.error("Đã chuyển bài nhưng không thể lưu vị trí học tập");
      }
    } else {
      // Đã đến bài cuối cùng
      toast.success("Bạn đã hoàn thành tất cả các bài học trong khóa học này!");
    }
  };
  const handleOpenAddNoteForm = () => {
    const seconds = Math.floor(videoRef.current?.currentTime || 0);
    const videoTitle = currentContent?.title || "";
    setNoteTimestamp(seconds);
    setNoteContentTitle(videoTitle || null);
    setNewNote("");
    setShowAddNoteForm(true);
  };
  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    if (!learningData) return;
    if (!enrollmentId) {
      toast.error("Không tìm thấy enrollment. Vui lòng đăng nhập.");
      return;
    }
    try {
      // If editing, update existing note
      if (editingNote) {
        const request: Partial<NoteRequest> = {
          noteText: newNote,
        };
        const updated = await noteService.updateNote(
          enrollmentId,
          editingNote.id,
          request
        );

        // Update note in UI
        setLearningData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            notes: prev.notes.map((note) => {
              if (typeof note === "string") return note;
              return note.id === editingNote.id ? updated : note;
            }),
          };
        });
        setEditingNote(null);
        setNewNote("");
        setShowAddNoteForm(false);
        toast.success("Ghi chú đã được cập nhật");
        return;
      }
      // Add new note
      const request: NoteRequest = {
        contentId: currentContent?.id || selectedLessonId || "",
        contentTitle: noteContentTitle || currentContent?.title || "",
        courseTitle: learningData.title,
        timestamp: formatTimeCallback(noteTimestamp),
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
      toast.success("Ghi chú đã được lưu");
    } catch (err) {
      console.error("Lỗi lưu ghi chú:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi khi lưu ghi chú");
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
          notes: prev.notes.filter((note) => {
            if (typeof note === "string") return true;
            return note.id !== noteId;
          }),
        };
      });

      toast.success("Ghi chú đã được xóa");
    } catch (err) {
      console.error("Lỗi xóa ghi chú:", err);
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa ghi chú");
    }
  };
  const handleToggleNotes = () => {
    if (activeSidebar === "notes") {
      setActiveSidebar("lessons");
      setShowNotesOverlay(false);
    } else {
      // Open overlay notes (do not resize sidebar)
      setActiveSidebar("notes");
      setShowNotesOverlay(true);
      // Load notes from server for this enrollment when opening notes overlay
      (async () => {
        if (!enrollmentId) return;
        try {
          const serverNotes = await noteService.getNotes(enrollmentId);
          // Keep full NoteResponse objects so UI can use contentTitle, timestamp, noteText
          setLearningData((prev) =>
            prev ? { ...prev, notes: serverNotes as any[] } : prev
          );
        } catch (err) {
          console.warn("Không thể tải ghi chú:", err);
        }
      })();
    }
  };
  const handleToggleQA = () => {
    if (activeSidebar === "qa") {
      setActiveSidebar("lessons");
      setShowQAOverlay(false);
    } else {
      setActiveSidebar("qa");
      setShowQAOverlay(true);
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
  useEffect(() => {
    if (!enrollmentId) return;
    const loadProgressAndPosition = async () => {
      try {
        const progress: ProgressResponse = await enrollService.getProgress(
          enrollmentId
        );
        setLearningData((prev) => {
          if (!prev) return prev;
          let updatedLessons = prev.lessons;
          if (
            typeof progress.completedContentItems === "number" &&
            progress.completedContentItems > 0
          ) {
            updatedLessons = prev.lessons.map((l, idx) => ({
              ...l,
              completed:
                idx < progress.completedContentItems ? true : l.completed,
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
            const selected = contents.find(
              (c) => c.id === pos.currentContentId
            );
            if (selected) setCurrentContent(selected);
          }
        } catch (err) {
          // Non-fatal: log and continue
          console.warn("Không lấy được vị trí hiện tại:", err);
        }
      } catch (err) {
        console.error("Lỗi khi tải tiến độ/hồi vị:", err);
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
  const { title, progress, totalTime, lessons, sidebarSections, notes } =
    learningData;
  const currentLesson =
    lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const isYouTube = currentContent.url
    ? getVideoIdFromUrl(currentContent.url)
    : null;
  return (
    <div className="bg-white text-gray-900 min-h-screen h-screen flex flex-col">
      <LearningHeader
        title={title}
        progress={progress}
        totalTime={totalTime}
        notesLength={notes.length}
        questionsLength={0}
        activeSidebar={activeSidebar}
        onToggleNotes={handleToggleNotes}
        onToggleQA={handleToggleQA}
        onToggleSidebar={toggleSidebar}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        id={id || ""}
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
          />
        </div>

        <div
          className={`flex-shrink-0 min-h-0 h-full transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-80" : "w-0"
          }`}
        >
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
              if (!open) setActiveSidebar("lessons");
            }}
            onToggleTab={setActiveSidebar}
            renderTypeIcon={renderTypeIcon}
            isLessonUnlocked={isLessonUnlocked}
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
                setActiveSidebar("lessons");
              }}
              onUpdateNote={async (noteId: number, newText: string) => {
                const note = learningData.notes.find(
                  (n) => typeof n !== "string" && n.id === noteId
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
        {showQAOverlay && (
          <div className="fixed inset-0 z-50">
            <ErrorBoundary>
              <QAOverlay
                title={learningData.title}
                onClose={() => {
                  setShowQAOverlay(false);
                  setActiveSidebar("lessons");
                }}
                enrollmentId={enrollmentId || 0}
                userEnrollmentId={enrollmentId || 0}
                courseId={Number(id)}
                currentContentId={currentContent?.id || selectedLessonId || ""}
                contentTitle={currentContent?.title || ""}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>

      <NoteForm
        show={
          showAddNoteForm && (currentLesson.type === "VIDEO" || !!editingNote)
        }
        newNote={newNote}
        onChange={setNewNote}
        onSave={handleSaveNote}
        onCancel={handleCancelNote}
        timestamp={noteTimestamp}
        isEditing={!!editingNote}
        contentTitle={editingNote?.contentTitle || noteContentTitle || ""}
      />

      <LearningFooter
        onPrevLesson={handlePrevLesson}
        onNextLesson={handleNextLesson}
        disabledPrev={!selectedLessonId || !learningData}
        disabledNext={!selectedLessonId || !learningData}
        currentTitle={currentContent?.title || ""}
      />
    </div>
  );
}
