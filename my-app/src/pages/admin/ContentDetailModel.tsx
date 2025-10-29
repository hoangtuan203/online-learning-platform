// ContentDetailsModal.tsx (sub-modal hiển thị chi tiết một content)

import React from "react";
import { X, Video, FileText, HelpCircle, Eye, Play, File, Clock, Tag, Calendar } from "lucide-react"; // Import icons cần thiết
import type { ContentResponse } from "../../service/CourseService";

interface ContentDetailsModalProps {
  content: ContentResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const ContentDetailsModal: React.FC<ContentDetailsModalProps> = ({
  content,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !content) return null;

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

  const renderQuestions = (questions?: any[]) => {
    if (!questions || questions.length === 0) return <p className="text-gray-500 italic">Không có câu hỏi.</p>;
    return (
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-gray-900">{q.questionText}</p>
            </div>
            <ul className="space-y-1 ml-2">
              {q.options.map((opt: string, optIdx: number) => (
                <li key={optIdx} className={`text-sm ${optIdx === q.correctOptionIndex ? "text-green-600 font-semibold bg-green-100 px-2 py-1 rounded" : "text-gray-600"}`}>
                  {optIdx + 1}. {opt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const getContentIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "VIDEO":
        return <Play className="w-6 h-6 text-blue-500" />;
      case "DOCUMENT":
        return <File className="w-6 h-6 text-green-500" />;
      case "QUIZ":
        return <HelpCircle className="w-6 h-6 text-purple-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden relative transform transition-all duration-300 scale-100">
        {/* Header - Gradient và shadow nhẹ */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              {getContentIcon(content.type)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{content.title}</h3>
              <p className="text-sm text-gray-600">Chi tiết nội dung • {content.type}</p>
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

        {/* Body - Responsive grid với spacing tốt hơn */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Mô tả */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mô tả
            </label>
            <p className="text-gray-900 leading-relaxed">{content.description || "Không có mô tả chi tiết."}</p>
          </div>

          {/* Grid thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Thời lượng
                </label>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {formatDuration(content.duration)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Cấp độ
                </label>
                <p className="text-gray-900 font-medium">{content.level || "N/A"}</p>
              </div>

              {content.url && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    URL
                  </label>
                  <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium underline hover:no-underline flex items-center gap-1 transition-colors"
                  >
                    Mở liên kết <span className="text-xs">→</span>
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {content.tags && content.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {content.questions && content.questions.length > 0 && (
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Câu hỏi (Quiz)
                  </label>
                  {renderQuestions(content.questions)}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail nếu có */}
          {content.thumbnail && (
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Thumbnail
              </label>
              <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Ngày tháng - Footer section */}
          <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ngày tạo
              </label>
              <p className="text-gray-600">{new Date(content.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ngày cập nhật
              </label>
              <p className="text-gray-600">{new Date(content.updatedAt).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetailsModal;