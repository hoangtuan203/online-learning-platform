// CourseContentsModal.tsx (modal hiển thị list contents của course)

import React, { useEffect, useState } from "react";
import { X, Plus, FileText, Trash2, Edit, Eye, Play, File, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { CourseService } from "../../service/CourseService";
import type { Course } from "../../types/Course";
import type { ContentResponse } from "../../service/CourseService";
import ContentDetailsModal from "./ContentDetailModel";

interface CourseContentsModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

const CourseContentsModal: React.FC<CourseContentsModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // States for content details sub-modal
  const [selectedContent, setSelectedContent] = useState<ContentResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchContents = async (courseId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const courseService = new CourseService();
      const response = await courseService.getContentsByCourseId(courseId);
      console.log("Nội dung khóa học đã tải:", response);
      setContents(response);
    } catch (error) {
      console.error("Lỗi tải nội dung khóa học:", error);
      setErrorMessage("Không thể tải danh sách nội dung. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view content details
  const handleViewContent = (content: ContentResponse) => {
    setSelectedContent(content);
    setIsDetailsOpen(true);
  };

  useEffect(() => {
    if (isOpen && course?.id) {
      fetchContents(course.id.toString());
    }
  }, [isOpen, course?.id]);

  if (!isOpen || !course) return null;

  const getContentIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VIDEO':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'DOCUMENT':
        return <File className="w-4 h-4 text-green-500" />;
      case 'QUIZ':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    const hours = Math.floor(duration / 3600); // Giả sử duration là giây
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <>
      {/* Main Modal - Căn giữa màn hình hoàn hảo */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden relative z-50 transform transition-all duration-300 scale-100">
          {/* Header - Cải thiện với gradient và shadow nhẹ */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {course.title.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Nội dung khóa học: {course.title}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{contents.length} nội dung</span>
                  <span>•</span>
                  <span>Giảng viên: {course.instructor?.fullName || "N/A"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all duration-200 hover:scale-110"
              aria-label="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body - Cải thiện spacing và responsive */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-red-700">
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-200"></div>
                  </div>
                  <span className="text-gray-500 text-lg">Đang tải nội dung...</span>
                </div>
              </div>
            ) : contents.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 text-center">
                        STT
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tiêu đề
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Loại
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Thời lượng
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.map((content, index) => (
                      <tr 
                        key={content.id} 
                        className={`transition-all duration-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-25' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium text-center">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {getContentIcon(content.type)}
                            <div>
                              <span className="text-sm font-semibold text-gray-900 block">
                                {content.title}
                              </span>
                              <span className="text-xs text-gray-500 block">
                                {content.url ? `URL: ${content.url.substring(0, 30)}...` : 'Không có URL'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                            {content.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {formatDuration(content.duration)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-md line-clamp-2" title={content.description}>
                            {content.description || "Không có mô tả"}
                          </div>
                        </td>
                        <td className="px-6 py-4 flex items-center space-x-2">
                          <button
                            onClick={() => handleViewContent(content)}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Xem chi tiết nội dung"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/edit-content/${content.id}`}
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Chỉnh sửa nội dung"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => console.log(`Delete content ${content.id}`)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Xóa nội dung"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FileText className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Chưa có nội dung nào cho khóa học này.</h4>
                <p className="text-gray-500 mb-6">Hãy thêm nội dung để học viên có thể học tập hiệu quả hơn.</p>
                <Link
                  to={`/add-content-course/${course.id}`}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm nội dung đầu tiên
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render sub-modal */}
      {selectedContent && (
        <ContentDetailsModal
          content={selectedContent}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </>
  );
};

export default CourseContentsModal;