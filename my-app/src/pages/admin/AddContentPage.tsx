import React, { useState, type Dispatch, type SetStateAction } from "react";
import { FileText, HelpCircle, Film, AlertCircle, ArrowLeft } from "lucide-react"; // Added ArrowLeft icon
import { useParams, useNavigate } from "react-router-dom"; 
import { AddVideo } from "../../components/content/AddVideo";
import { AddDocument } from "../../components/content/AddDocument";
import { AddQuiz } from "../../components/content/AddQuiz";
import {
  CourseService,
  type OperationResponse,
} from "../../service/CourseService";
import { toast } from "react-toastify";

const courseService = new CourseService();

export interface AddVideoProps {
  courseId: string;
  onSuccess?: (response: OperationResponse) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

const AddContentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("video");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // New: Handle back navigation
  const handleBack = () => {
    navigate("/list-courses");
  };

  const handleVideoSuccess = async (response: OperationResponse) => {
    if (response.success) {
      toast.success("Video đã được thêm thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate(`/list-courses`), 3500);
    } else {
      setErrors({ api: response.errorMessage || "Lỗi không xác định" });
    }
  };

  // Updated handler for document: now receives OperationResponse from onSuccess callback
  const handleDocumentSuccess = async (response: OperationResponse) => {
    if (response.success) {
      toast.success("Tài liệu đã được thêm thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate(`/courses/${courseId}`), 3500);
    } else {
      setErrors({ api: response.errorMessage || "Lỗi không xác định" });
    }
  };

  const handleQuizSuccess = async (response: OperationResponse) => {
    if (response.success) {
      toast.success("Quiz đã được thêm thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate(`/courses/${courseId}`), 3500);
    } else {
      setErrors({ api: response.errorMessage || "Lỗi không xác định" });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setErrors({});
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* New: Back button in top-left */}
        <div className="mb-6 flex items-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Quay lại</span>
          </button>
        </div>

        {errors.api && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errors.api}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange("video")}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "video"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Film className="w-5 h-5" />
              Video
            </button>
            <button
              onClick={() => handleTabChange("document")}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "document"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-5 h-5" />
              Tài Liệu
            </button>
            <button
              onClick={() => handleTabChange("quiz")}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "quiz"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              Quiz
            </button>
          </div>

          <div className="p-6">
            {activeTab === "video" && (
              <AddVideo
                courseId={courseId!}
                onSuccess={handleVideoSuccess}
                errors={errors}
                isLoading={isLoading}
                setErrors={setErrors}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === "document" && (
              <AddDocument
                courseId={courseId!}
                onSuccess={handleDocumentSuccess}
                errors={errors}
                isLoading={isLoading}
                setErrors={setErrors}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === "quiz" && (
              <AddQuiz
                courseId={courseId!} // Added courseId prop
                onSuccess={handleQuizSuccess} // Changed to onSuccess for consistency
                errors={errors}
                isLoading={isLoading}
                setErrors={setErrors}
                setIsLoading={setIsLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContentPage;