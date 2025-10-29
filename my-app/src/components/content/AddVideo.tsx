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

interface AddVideoProps {
  courseId: string;
  onSuccess?: (response: OperationResponse) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// Hàm nén image cho thumbnail (client-side)
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas không hỗ trợ'));
    
    img.onload = () => {
      const { width, height } = img;
      canvas.width = Math.min(maxWidth, width);
      canvas.height = (height / width) * canvas.width;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        } else {
          reject(new Error('Lỗi nén image'));
        }
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Upload direct cho thumbnail sau nén (dùng fetch)
const uploadCompressedThumbnail = async (compressedFile: File, onSuccess: (url: string, fileName: string) => void, onError: (error: any) => void) => {
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'images');
  formData.append('resource_type', 'image');

  try {
    const response = await fetch(`https://${CLOUDINARY_CLOUD_NAME}.cloudinary.com/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.secure_url) {
      onSuccess(result.secure_url, compressedFile.name);
    } else {
      throw new Error(result.error?.message || 'Lỗi upload');
    }
  } catch (error) {
    onError(error);
  }
};

// Hàm mở Upload Widget (tối ưu với apiHost và progress)
const openUploadWidget = (
  fileType: "video",
  onSuccess: (url: string, fileName: string) => void,
  onError: (error: any) => void,
  onProgress: (progress: number) => void
) => {
  const options = {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: UPLOAD_PRESET,
    folder: "videos",
    resourceType: fileType as 'video',
    maxFiles: 1,
    clientAllowedFormats: ["mp4", "webm", "mov"],
    maxFileSize: 500 * 1024 * 1024, // 500MB cho video
    multiple: false,
    apiHost: 'api-ap.cloudinary.com', // Data center châu Á để nhanh hơn
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

export const AddVideo: React.FC<AddVideoProps> = ({
  courseId,
  onSuccess,
  errors,
  isLoading,
  setErrors,
  setIsLoading,
}) => {
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    video: null as File | null,
    thumbnail: null as File | null,
    duration: "",
    level: "EASY",
    tags: [] as string[],
  });

  console.log("course Id:", courseId);

  const [videoTags, setVideoTags] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const courseService = new CourseService();

  // Debounce cho input changes
  const debouncedInputChange = useCallback((name: string, value: string) => {
    setVideoForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleVideoInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Debounce đơn giản: update sau 300ms (dùng setTimeout nếu cần full debounce)
    setTimeout(() => debouncedInputChange(name, value), 0);
  }, [debouncedInputChange]);

  // Validate size trước upload video
  const validateVideoSize = (file: File) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new Error(`File video quá lớn: ${Math.round(file.size / 1024 / 1024)}MB, giới hạn 500MB. Vui lòng nén file.`);
    }
  };

  // Mở widget cho video với progress
  const handleVideoWidget = () => {
    // Widget không cho select file trước, nên validate sau success (Cloudinary tự check, nhưng thêm log)
    openUploadWidget(
      "video",
      (url, fileName) => {
        setVideoUrl(url);
        setVideoForm((prev) => ({
          ...prev,
          video: { name: fileName } as File,
        }));
        setVideoPreview(url);
        setVideoProgress(0);
        setErrors((prev) => ({ ...prev, video: "" }));
      },
      (error) => {
        setErrors((prev) => ({
          ...prev,
          video: `Lỗi upload: ${error.message}`,
        }));
        setVideoProgress(0);
        console.error("Widget error:", error);
      },
      (progress) => setVideoProgress(progress)
    );
  };

  // Handle thumbnail: Chọn file -> nén -> upload direct
  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { // 5MB trước nén
      setErrors((prev) => ({ ...prev, thumbnail: "File thumbnail quá lớn, vui lòng chọn <5MB" }));
      return;
    }
    setIsLoading(true);
    setThumbnailProgress(10); // Bắt đầu nén
    try {
      const compressedFile = await compressImage(file);
      setThumbnailProgress(50); // Nén xong
      await uploadCompressedThumbnail(
        compressedFile,
        (url, fileName) => {
          setThumbnailUrl(url);
          setVideoForm((prev) => ({
            ...prev,
            thumbnail: { name: fileName } as File,
          }));
          setThumbnailPreview(url);
          setThumbnailProgress(100);
          setErrors((prev) => ({ ...prev, thumbnail: "" }));
        },
        (error) => {
          setErrors((prev) => ({
            ...prev,
            thumbnail: `Lỗi upload: ${error.message}`,
          }));
          setThumbnailProgress(0);
        }
      );
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: `Lỗi nén: ${(error as Error).message}`,
      }));
      setThumbnailProgress(0);
    } finally {
      setIsLoading(false);
    }
    // Clear input
    e.target.value = '';
  };

  const addVideoTag = () => {
    if (videoTags.trim() && !videoForm.tags.includes(videoTags.trim())) {
      setVideoForm((prev) => ({
        ...prev,
        tags: [...prev.tags, videoTags.trim()],
      }));
      setVideoTags("");
    }
  };

  const removeVideoTag = (tagToRemove: string) => {
    setVideoForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!videoForm.title.trim() || !videoForm.description.trim() || !videoUrl) {
      setErrors((prev) => ({
        ...prev,
        title: !videoForm.title.trim() ? "Tiêu đề không được để trống" : prev.title,
        description: !videoForm.description.trim() ? "Mô tả không được để trống" : prev.description,
        video: !videoUrl ? "File video bắt buộc (vui lòng upload qua widget)" : prev.video,
      }));
      return;
    }

    setIsLoading(true);
    setApiError("");
    setErrors((prev) => ({ ...prev, apiError: "" }));

    try {
      const data: CreateContentRequest = {
        courseId,
        title: videoForm.title,
        description: videoForm.description,
        type: "VIDEO",
        url: videoUrl,
        duration: videoForm.duration ? parseInt(videoForm.duration, 10) : undefined,
        thumbnail: thumbnailUrl || undefined,
        level: videoForm.level,
        tags: videoForm.tags,
        questions: [],
      };

      const response = await courseService.createContent(data);

      if (response.success) {
        resetForm();
        if (onSuccess) onSuccess(response);
        console.log("Tạo video thành công:", response.content);
      } else {
        throw new Error(response.errorMessage || "Lỗi không xác định từ server");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Lỗi không xác định";
      setApiError(errorMsg);
      setErrors((prev) => ({ ...prev, apiError: errorMsg }));
      console.error("Lỗi tạo content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVideoForm({
      title: "",
      description: "",
      video: null,
      thumbnail: null,
      duration: "",
      level: "EASY",
      tags: [],
    });
    setVideoTags("");
    setVideoUrl(null);
    setThumbnailUrl(null);
    setVideoProgress(0);
    setThumbnailProgress(0);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setApiError("");
    setErrors({});
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime > 30) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

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
          Tiêu Đề Video <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={videoForm.title}
          onChange={handleVideoInputChange}
          placeholder="Nhập tiêu đề video"
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
          value={videoForm.description}
          onChange={handleVideoInputChange}
          placeholder="Nhập mô tả chi tiết về video"
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
            Thời Lượng (phút)
          </label>
          <input
            type="number"
            name="duration"
            value={videoForm.duration}
            onChange={handleVideoInputChange}
            placeholder="45"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
              errors.duration
                ? "border-red-300 bg-red-50 text-gray-900"
                : "border-gray-300 text-gray-900"
            }`}
            min="1"
            disabled={isLoading}
          />
          {errors.duration && (
            <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mức Độ
          </label>
          <select
            name="level"
            value={videoForm.level}
            onChange={handleVideoInputChange}
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

      {/* Tags giữ nguyên */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={videoTags}
            onChange={(e) => setVideoTags(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addVideoTag())
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
            onClick={addVideoTag}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
            disabled={isLoading || !videoTags.trim()}
          >
            <Plus size={18} />
          </button>
        </div>
        {videoForm.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {videoForm.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2 border border-indigo-200"
              >
                {tag}
                <button
                  onClick={() => removeVideoTag(tag)}
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

      {/* File Upload: Cập nhật với progress và nén */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Tải Lên File (giới hạn video: 500MB)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Thumbnail: Input file + nén + progress */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition cursor-pointer relative group flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
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
                {videoForm.thumbnail
                  ? videoForm.thumbnail.name
                  : "Chọn file để nén & upload (tùy chọn)"}
              </p>
            </div>
            {thumbnailProgress > 0 && thumbnailProgress < 100 && (
              <div className="mt-2 w-full">
                <p className="text-xs text-indigo-600">Đang nén & upload...</p>
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

          {/* Video Widget với progress */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition cursor-pointer relative group flex flex-col items-center justify-center">
            <button
              onClick={handleVideoWidget}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              disabled={isLoading}
            />
            <div className="text-center">
              <Upload
                className="mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 transition"
                size={32}
              />
              <p className="text-sm text-gray-700 font-medium">
                File Video <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {videoForm.video ? videoForm.video.name : "Click để mở Widget (max 500MB)"}
              </p>
            </div>
            {videoProgress > 0 && videoProgress < 100 && (
              <div className="mt-2 w-full">
                <p className="text-xs text-indigo-600">Đang upload...</p>
                <ProgressBar progress={videoProgress} />
              </div>
            )}
            {videoPreview && (
              <div className="mt-4 flex justify-center">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                  style={{ maxHeight: "200px" }}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Preview giới hạn 30 giây
                </p>
              </div>
            )}
            {errors.video && (
              <p className="text-red-500 text-sm mt-1 text-center">
                {errors.video}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons giữ nguyên */}
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
          className="px-6 py-2.5 bg-green-500 text-black rounded-lg font-medium hover:bg-green-600 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={
            isLoading ||
            !videoUrl ||
            !videoForm.title.trim() ||
            !videoForm.description.trim()
          }
        >
          <Save size={18} />
          {isLoading ? "Đang lưu..." : "Lưu Video"}
        </button>
      </div>
    </div>
  );
};