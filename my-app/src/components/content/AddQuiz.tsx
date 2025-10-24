import React, { useState, useRef, useCallback } from "react";
import { Upload, Plus, X, Save } from "lucide-react";
import {
  CourseService,
  type CreateContentRequest,
  type OperationResponse,
} from "../../service/CourseService";
import type { CloudinaryUploadResult } from "../../types/cloudinary";

// Use env vars with fallbacks
const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_NAME || "dm1alq68q";
const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
console.log("Cloudinary Cloud Name:", CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary Upload Preset:", UPLOAD_PRESET);

interface AddQuizProps {
  courseId: string;
  onSuccess?: (response: OperationResponse) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const openUploadWidget = (
  fileType: "image" | "video",
  onSuccess: (url: string, fileName: string) => void,
  onError: (error: any) => void,
  onProgress: (progress: number) => void
) => {
  const options = {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: UPLOAD_PRESET,
    folder: fileType === "video" ? "videos" : "thumbnail_quizz",
    resourceType: fileType,
    maxFiles: 1,
    clientAllowedFormats: fileType === "video" ? ["mp4", "webm", "mov"] : ["jpg", "jpeg", "png", "webp"],
    maxFileSize: fileType === "video" ? 500 * 1024 * 1024 : 5 * 1024 * 1024, 
    multiple: false,
    apiHost: 'api-ap.cloudinary.com', 
  };

  const myWidget = window.cloudinary.openUploadWidget(
    options,
    (error: any, result: CloudinaryUploadResult | null) => {
      if (result && result.event === "queue-upload") {
        onProgress(0); // Bắt đầu
      } else if (result && result.event === "upload-progress") {
        const progress = Math.round((result.info.bytes_uploaded / result.info.bytes_total) * 100);
        onProgress(progress);
      } else if (!error && result && result.event === "success") {
        const url = result.info.secure_url;
        const fileName = result.info.original_filename;
        onProgress(100);
        onSuccess(url, fileName);
      } else if (error) {
        onProgress(0);
        onError(error);
      }
    }
  );
  myWidget.open();
};

export const AddQuiz: React.FC<AddQuizProps> = ({
  courseId,
  onSuccess,
  errors,
  isLoading,
  setErrors,
  setIsLoading,
}) => {
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    thumbnail: null as File | null,
    level: "EASY",
    tags: [] as string[],
    questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }] as {
      questionText: string;
      options: string[];
      correctOptionIndex: number;
    }[],
  });

  const [quizTags, setQuizTags] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const courseService = new CourseService();

  // Debounce cho input changes
  const debouncedInputChange = useCallback((name: string, value: string) => {
    setQuizForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleQuizInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTimeout(() => debouncedInputChange(name, value), 0);
  }, [debouncedInputChange]);

  // Mở widget cho thumbnail với progress
  const handleThumbnailWidget = () => {
    openUploadWidget(
      "image",
      (url, fileName) => {
        setThumbnailUrl(url);
        setQuizForm((prev) => ({
          ...prev,
          thumbnail: { name: fileName } as File,
        }));
        setThumbnailPreview(url);
        setThumbnailProgress(0);
        setErrors((prev) => ({ ...prev, thumbnail: "" }));
      },
      (error) => {
        setErrors((prev) => ({
          ...prev,
          thumbnail: `Lỗi upload: ${error.message}`,
        }));
        setThumbnailProgress(0);
        console.error("Widget error:", error);
      },
      (progress) => setThumbnailProgress(progress)
    );
  };

  const addQuizTag = () => {
    if (quizTags.trim() && !quizForm.tags.includes(quizTags.trim())) {
      setQuizForm((prev) => ({
        ...prev,
        tags: [...prev.tags, quizTags.trim()],
      }));
      setQuizTags("");
    }
  };

  const removeQuizTag = (tagToRemove: string) => {
    setQuizForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }],
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuizForm((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    setQuizForm((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].options[oIndex] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!quizForm.title.trim() || !quizForm.description.trim()) {
      setErrors((prev) => ({
        ...prev,
        title: !quizForm.title.trim() ? "Tiêu đề không được để trống" : prev.title,
        description: !quizForm.description.trim() ? "Mô tả không được để trống" : prev.description,
      }));
      return;
    }
    if (quizForm.questions.length === 0) {
      setErrors((prev) => ({ ...prev, questions: "Quiz phải có ít nhất một câu hỏi" }));
      return;
    }
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      if (!q.questionText.trim()) {
        setErrors((prev) => ({ ...prev, [`question_${i}`]: `Câu hỏi ${i + 1} không được để trống` }));
        return;
      }
      if (q.options.length !== 4 || q.options.some(opt => !opt.trim())) {
        setErrors((prev) => ({ ...prev, [`options_${i}`]: `Câu hỏi ${i + 1} phải có đúng 4 đáp án không rỗng` }));
        return;
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex > 3) {
        setErrors((prev) => ({ ...prev, [`correctOption_${i}`]: `Câu hỏi ${i + 1} phải có đáp án đúng hợp lệ` }));
        return;
      }
    }

    setIsLoading(true);
    setApiError("");
    setErrors((prev) => ({ ...prev, apiError: "" }));

    try {
      console.log('Submitting with courseId:', courseId);

      const data: CreateContentRequest = {
        courseId,
        title: quizForm.title,
        description: quizForm.description,
        type: "QUIZ",
        url: "", // Không có URL cho quiz
        duration: undefined, // Không có duration cho quiz
        thumbnail: thumbnailUrl || undefined,
        level: quizForm.level,
        tags: quizForm.tags,
        questions: quizForm.questions.map(q => ({
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
        })),
      };

      console.log('Request data:', data);

      const response = await courseService.createContent(data);

      if (response.success) {
        resetForm();
        if (onSuccess) onSuccess(response);
        console.log("Tạo quiz thành công:", response.content);
      } else {
        throw new Error(response.errorMessage || "Lỗi không xác định từ server");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Lỗi không xác định";
      setApiError(`Lỗi lưu content: ${errorMsg}. Kiểm tra courseId: ${courseId || 'NULL'}`);
      setErrors((prev) => ({ ...prev, apiError: errorMsg }));
      console.error("Lỗi tạo content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQuizForm({
      title: "",
      description: "",
      thumbnail: null,
      level: "EASY",
      tags: [],
      questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }],
    });
    setQuizTags("");
    setThumbnailUrl(null);
    setThumbnailProgress(0);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setApiError("");
    setErrors({});
  };

  // Progress Bar component đơn giản
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {apiError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tiêu Đề Quiz <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={quizForm.title}
          onChange={handleQuizInputChange}
          placeholder="Nhập tiêu đề quiz"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
            errors.title
              ? "border-red-300 bg-red-50 text-gray-900"
              : "border-gray-300 text-gray-900"
          }`}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô Tả <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={quizForm.description}
          onChange={handleQuizInputChange}
          placeholder="Nhập mô tả chi tiết về quiz"
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
            errors.description
              ? "border-red-300 bg-red-50 text-gray-900"
              : "border-gray-300 text-gray-900"
          }`}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mức Độ
          </label>
          <select
            name="level"
            value={quizForm.level}
            onChange={handleQuizInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
              errors.level
                ? "border-red-300 bg-red-50 text-gray-900"
                : "border-gray-300 text-gray-900"
            }`}
            disabled={isLoading}
          >
            <option value="EASY">Cơ Bản</option>
            <option value="NORMAL">Trung Bình</option>
            <option value="HARD">Nâng Cao</option>
          </select>
          {errors.level && (
            <p className="text-red-500 text-sm mt-1">{errors.level}</p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Các Câu Hỏi ({quizForm.questions.length})</h3>
          <button
            onClick={addQuestion}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2 text-sm"
            disabled={isLoading}
          >
            <Plus size={16} />
            Thêm Câu Hỏi
          </button>
        </div>

        <div className="space-y-4">
          {quizForm.questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-sm font-medium text-gray-700">
                  Câu hỏi {qIndex + 1} <span className="text-red-500">*</span>
                </label>
                {quizForm.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isLoading}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <textarea
                value={q.questionText}
                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                placeholder="Nhập câu hỏi"
                rows={2}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  errors[`question_${qIndex}`]
                    ? "border-red-300 bg-red-50 text-gray-900"
                    : "border-gray-300 text-gray-900"
                }`}
                disabled={isLoading}
              />
              {errors[`question_${qIndex}`] && (
                <p className="text-red-500 text-sm">{errors[`question_${qIndex}`]}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={q.correctOptionIndex === oIndex}
                      onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)}
                      className="w-4 h-4 text-indigo-600"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Tùy chọn ${oIndex + 1}`}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900 text-sm ${
                        errors[`options_${qIndex}`]
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
              {errors[`options_${qIndex}`] && (
                <p className="text-red-500 text-sm">{errors[`options_${qIndex}`]}</p>
              )}
              {errors[`correctOption_${qIndex}`] && (
                <p className="text-red-500 text-sm">{errors[`correctOption_${qIndex}`]}</p>
              )}
            </div>
          ))}
        </div>
        {errors.questions && (
          <p className="text-red-500 text-sm mt-1">{errors.questions}</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={quizTags}
            onChange={(e) => setQuizTags(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addQuizTag())
            }
            placeholder="Thêm tag và nhấn Enter"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
              errors.tags
                ? "border-red-300 bg-red-50 text-gray-900"
                : "border-gray-300 text-gray-900"
            }`}
            disabled={isLoading}
          />
          <button
            onClick={addQuizTag}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
            disabled={isLoading || !quizTags.trim()}
          >
            <Plus size={18} />
          </button>
        </div>
        {quizForm.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quizForm.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2 border border-indigo-200"
              >
                {tag}
                <button
                  onClick={() => removeQuizTag(tag)}
                  className="hover:text-indigo-900"
                  disabled={isLoading}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.tags && (
          <p className="text-red-500 text-sm mt-1">{errors.tags}</p>
        )}
      </div>

      {/* File Upload: Thumbnail với Widget và progress */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Tải Lên File Thumbnail (tùy chọn)
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition cursor-pointer relative group flex flex-col items-center justify-center">
          <button
            onClick={handleThumbnailWidget}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            disabled={isLoading}
          />
          <div className="text-center">
            <Upload
              className="mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 transition"
              size={32}
            />
            <p className="text-sm text-gray-700 font-medium">
              Hình Thumbnail
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {quizForm.thumbnail
                ? quizForm.thumbnail.name
                : "Click để mở Widget (max 5MB)"}
            </p>
          </div>
          {thumbnailProgress > 0 && thumbnailProgress < 100 && (
            <div className="mt-2 w-full">
              <p className="text-xs text-indigo-600">Đang upload...</p>
              <ProgressBar progress={thumbnailProgress} />
            </div>
          )}
          {thumbnailPreview && (
            <div className="mt-4 flex justify-center">
              <img
                src={thumbnailPreview}
                alt="Thumbnail Preview"
                className="max-w-full h-auto rounded-lg border border-gray-200"
                style={{ maxHeight: "150px" }}
              />
            </div>
          )}
          {errors.thumbnail && (
            <p className="text-red-500 text-sm mt-1 text-center">
              {errors.thumbnail}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          onClick={resetForm}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          disabled={isLoading}
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={
            isLoading ||
            !quizForm.title.trim() ||
            !quizForm.description.trim() ||
            quizForm.questions.length === 0
          }
        >
          <Save size={18} />
          {isLoading ? "Đang lưu..." : "Lưu Quiz"}
        </button>
      </div>
    </div>
  );
};