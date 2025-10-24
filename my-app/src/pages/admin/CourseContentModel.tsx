
import React, { useEffect, useState } from "react";
import { X, Play, FileText, HelpCircle } from "lucide-react";
import { CourseService } from "../../service/CourseService";
import type { Course } from "../../types/Course";
import type { Content } from "../../types/Content"; // Assume Content type exists

const CourseThumbnail: React.FC<{ thumbnailUrl?: string; title: string }> = ({
  thumbnailUrl,
  title,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-12 h-12 mx-auto">
      {imageError || !thumbnailUrl ? (
        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">No img</span>
        </div>
      ) : (
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover rounded-md"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      )}
    </div>
  );
};

interface CourseContentsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

const CourseContentsModal: React.FC<CourseContentsModalProps> = ({ course, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"video" | "document" | "quiz">("video");
  const [contents, setContents] = useState<{ videos: Content[]; documents: Content[]; quizzes: Content[] }>({
    videos: [],
    documents: [],
    quizzes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchContents();
    }
  }, [isOpen, course.id]);

  const fetchContents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const courseService = new CourseService();
      // Assume service method: getContentsByCourseId(courseId: string)
      const response = await courseService.getContentsByCourseId(course.id);
      // Group by type
      const grouped = {
        videos: response.filter((c: Content) => c.type === "VIDEO"),
        documents: response.filter((c: Content) => c.type === "DOCUMENT"),
        quizzes: response.filter((c: Content) => c.type === "QUIZ"),
      };
      setContents(grouped);
    } catch (err) {
      setError("Không thể tải nội dung khóa học. Vui lòng thử lại.");
      console.error("Error fetching contents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CourseThumbnail thumbnailUrl={course.thumbnailUrl} title={course.title} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
              <p className="text-sm text-gray-500">{course.description || "No description"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1">
            {[
              { key: "video" as const, label: "Videos", icon: Play },
              { key: "document" as const, label: "Documents", icon: FileText },
              { key: "quiz" as const, label: "Quizzes", icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                <span className="ml-2 bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {contents[tab.key].length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contents[activeTab].map((content) => (
                <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <CourseThumbnail thumbnailUrl={content.thumbnail} title={content.title} />
                  <h3 className="mt-2 font-medium text-gray-900 text-sm truncate">{content.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{content.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {content.type === "VIDEO" && content.duration && `${content.duration} phút`}
                      {content.type === "QUIZ" && `Level: ${content.level}`}
                    </span>
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                      {content.type === "VIDEO" ? "Play" : content.type === "DOCUMENT" ? "View" : "Start"}
                    </button>
                  </div>
                </div>
              ))}
              {contents[activeTab].length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Chưa có {activeTab === "video" ? "video" : activeTab === "document" ? "tài liệu" : "quiz"} nào.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseContentsModal;