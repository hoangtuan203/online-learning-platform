// DetailCourse.tsx - Updated to fetch dynamic data using CourseService
import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Play,
  AlertCircle,
  Clock,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { CourseService } from "../../service/CourseService";
import { EnrollService } from "../../service/EnrollService";
import type { ContentResponse } from "../../service/CourseService";
import toast, { Toaster } from "react-hot-toast";

const enrollService = new EnrollService();

// Hardcoded data for reviews (can be fetched/extended later)
const DEFAULT_REVIEWS = [
  { name: "Học viên A", text: "Khóa học rất thực tế, dễ hiểu!", rating: 5 },
  { name: "Học viên B", text: "Giảng viên hỗ trợ nhiệt tình.", rating: 4.5 },
  { name: "Học viên C", text: "Nội dung cập nhật, đáng học.", rating: 5 },
];

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dm1alq68q/image/upload/v1761064155/avatar-user/l0srbfzbhbi4sxq94lid.jpg";

const courseService = new CourseService();

interface ExtendedCourseDetail {
  id: number;
  title: string;
  description: string;
  price: number | null;
  thumbnailUrl: string | null;
  category: string;
  instructor: {
    id: string;
    fullName: string;
  };
  level?: string;
  contents: ContentResponse[];
  totalHours: number;
  totalLessons: number;
}

interface CurriculumItem {
  name: string;
  type: "VIDEO" | "DOCUMENT" | "QUIZ";
  duration?: string; // Formatted duration for display (only for VIDEO)
  index: number; // Added for numbering
}

interface CurriculumModule {
  title: string;
  lessons: number;
  totalDuration?: string; // Added for module total duration
  items: CurriculumItem[];
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<ExtendedCourseDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<number[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID khóa học");
      setLoading(false);
      return;
    }
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
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        const courseIdNum = Number(id);

        // Fetch basic course detail
        const courseResponse = await courseService.getCourseById(id);
        const data = {
          ...courseResponse,
          id: courseIdNum,
        };

        const contents = await courseService.getContentsByCourseId(id);
        console.log("fetched contents:", contents);

        const totalLessons = contents.length;
        const totalSeconds = contents
          .filter(
            (content) => content.type === "VIDEO" && content.duration != null
          )
          .reduce((sum, content) => sum + (content.duration || 0), 0);
        const totalHours = Math.round(totalSeconds / 3600);

        if (userId) {
          try {
            const enrollmentStatusResponse = await enrollService.checkEnrollment({
              courseId: courseIdNum,
              userId: userId, // Now guaranteed to be number (non-null)
            });
            console.log("Enrollment status response:", enrollmentStatusResponse);
            setIsEnrolled(enrollmentStatusResponse.enrolled);
          } catch (error) {
            console.error("Error checking enrollment status:", error);
            setIsEnrolled(false);
          }
        } else {
          // If no userId, assume not enrolled (user not logged in)
          console.warn("Skipping enrollment check: No valid userId");
          setIsEnrolled(false);
        }

        const extendedData: ExtendedCourseDetail = {
          ...data,
          contents,
          totalHours,
          totalLessons,
          instructor: {
            id: data.instructor.id.toString(),
            fullName: data.instructor.fullName,
          },
        };

        setCourseData(extendedData);

        // Fetch related courses
        try {
          const allCourses = await courseService.getAllCourses(0, 10);
          const sameCategory = allCourses.content
            .filter((c) => c.category === data.category && c.id !== courseIdNum)
            .slice(0, 3)
            .map((c) => ({
              title: c.title,
              image: c.thumbnailUrl || FALLBACK_IMAGE,
              id: c.id.toString(),
            }));
          setRelatedCourses(sameCategory.length > 0 ? sameCategory : []);
        } catch (relatedError) {
          console.error("Error fetching related courses:", relatedError);
          setRelatedCourses([]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải chi tiết khóa học"
        );
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, userId]); // Added userId to deps to re-fetch if userId changes (e.g., login/logout)

  // Compute benefits based on contents titles
  const benefits = useMemo(() => {
    if (
      !courseData ||
      !courseData.contents ||
      courseData.contents.length === 0
    ) {
      return [];
    }
    // Take first 5 contents and prefix with "Học về " to make it sound like benefits
    return courseData.contents
      .slice(0, 5)
      .map((content) => `Học về ${content.title}`);
  }, [courseData]);

  // Build curriculum from contents (single module for simplicity)
  const buildCurriculum = (
    contents: ExtendedCourseDetail["contents"]
  ): CurriculumModule[] => {
    if (!contents || contents.length === 0) {
      return [];
    }

    // Sort contents by createdAt
    const sortedContents = contents.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate total duration for module
    const moduleTotalSeconds = sortedContents
      .filter((content) => content.type === "VIDEO" && content.duration != null)
      .reduce((sum, content) => sum + (content.duration || 0), 0);
    const moduleTotalMinutes = Math.floor(moduleTotalSeconds / 60);
    const moduleTotalDuration = `${moduleTotalMinutes} phút`;

    return [
      {
        title: "Nội dung khóa học",
        lessons: sortedContents.length,
        totalDuration: moduleTotalDuration,
        items: sortedContents.map((content, index) => {
          let duration: string | undefined;
          if (content.type === "VIDEO" && content.duration != null) {
            const minutes = Math.floor(content.duration / 60);
            const seconds = content.duration % 60;
            duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
          }
          return {
            name: content.title,
            type: content.type as "VIDEO" | "DOCUMENT" | "QUIZ",
            duration,
            index: index + 1, // Numbering starts from 1
          };
        }),
      },
    ];
  };

  const curriculum = courseData ? buildCurriculum(courseData.contents) : [];

  // Simple toggle function
  const toggleModule = (index: number) => {
    setOpenModules((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Render stars for rating
  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-sm ${
            i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
          }`}
          aria-label={`Star ${i + 1}`}
        >
          ★
        </span>
      ))}
    </div>
  );

  // Render icon based on type with improved styling for readability
  const renderTypeIcon = (type: string) => {
    const iconProps = "h-5 w-5 flex-shrink-0";
    switch (type.toUpperCase()) {
      case "VIDEO":
        return <Play className={`${iconProps} text-blue-500`} />;
      case "DOCUMENT":
        return <BookOpen className={`${iconProps} text-green-500`} />;
      case "QUIZ":
        return <CheckCircle className={`${iconProps} text-purple-500`} />;
      default:
        return <span className="w-5 h-5" />;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải chi tiết khóa học...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !courseData) {
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

  const author = courseData.instructor.fullName;
  const instructorBio = "Chưa có thông tin chi tiết về giảng viên."; // Default since bio not in backend response
  const rating = 4.8; // Default or fetch if available
  const priceDisplay = courseData.price
    ? `${courseData.price.toLocaleString("vi-VN")} VND`
    : "Miễn phí";
  const hours = courseData.totalHours;
  const lessons = courseData.totalLessons;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-center" />
      {/* Hero Section - Simplified */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Content */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  {courseData.title}
                </h1>
                <p className="text-gray-600 leading-relaxed">
                  {courseData.description}
                </p>
              </div>
              
              {/* Course Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {hours} giờ
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {lessons} bài học
                </span>
                <span>Giảng viên: <span className="font-medium text-gray-900">{author}</span></span>
                <div className="flex items-center gap-1">
                  {renderStars(rating)}
                  <span className="text-gray-900 font-medium">{rating}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {isEnrolled ? (
                  <Link
                    to={`/course/learning/${id}`}
                    className="flex-1 inline-flex items-center justify-center bg-blue-600 px-6 py-2.5 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Tiếp tục học
                  </Link>
                ) : (
                  <>
                    <button
                      className="flex-1 inline-flex items-center justify-center bg-blue-600 px-6 py-2.5 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async () => {
                        if (!userId) {
                          toast.error("Bạn cần đăng nhập để đăng ký khóa học");
                          return;
                        }
                        try {
                          if (!courseData) return;
                          setEnrolling(true);
                          const response = await enrollService.enroll({
                            courseId: courseData.id,
                            userId: userId,
                          });

                          toast.success(
                            response.message ||
                              "Đăng ký khóa học thành công! Bạn có thể bắt đầu học ngay."
                          );
                          setIsEnrolled(true);
                          navigate(`/course/learning/${courseData.id}`);
                        } catch (err) {
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : "Đăng ký khóa học thất bại"
                          );
                          console.error("Error enrolling in course:", err);
                        } finally {
                          setEnrolling(false);
                        }
                      }}
                      disabled={enrolling || !userId}
                    >
                      {enrolling
                        ? "Đang đăng ký..."
                        : `Đăng ký học ngay (${priceDisplay})`}
                    </button>
                    <Link
                      to={`/course/learning/${id}`}
                      className="flex-1 inline-flex items-center justify-center border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Xem thử miễn phí
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Thumbnail */}
            <div className="order-first md:order-last">
              <img
                src={courseData.thumbnailUrl || FALLBACK_IMAGE}
                alt={courseData.title}
                className="w-full rounded-lg border border-gray-200 object-cover h-64 md:h-80"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Simplified */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bạn sẽ học được gì?
          </h2>
          {benefits.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700"
                >
                  <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">
              Chưa có nội dung chi tiết để hiển thị lợi ích học tập.
            </p>
          )}
        </div>
      </section>

      {/* Curriculum Section - Simplified */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Nội dung khóa học
            </h2>
            {curriculum[0]?.totalDuration && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{curriculum[0].totalDuration}</span>
              </div>
            )}
          </div>
          <div>
            {curriculum.map((module, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                <button
                  onClick={() => toggleModule(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={openModules.includes(index)}
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {module.lessons} bài học
                      {module.totalDuration && ` • ${module.totalDuration}`}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      openModules.includes(index) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all ${
                    openModules.includes(index)
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-gray-200">
                    <ul className="divide-y divide-gray-100">
                      {module.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 hover:bg-gray-50"
                        >
                          <span className="flex-shrink-0 w-6 text-sm text-gray-500 font-medium">
                            {item.index}.
                          </span>
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {renderTypeIcon(item.type)}
                            <div className="flex-1 min-w-0">
                              <span className="block text-sm text-gray-900">
                                {item.name}
                              </span>
                              {item.duration && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                  {item.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {curriculum.length === 0 && (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <p className="text-gray-500 text-sm">
                  Chưa có nội dung cho khóa học này.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Instructor Section - Simplified */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Giảng viên
          </h2>
          <div className="flex items-center gap-4">
            <img
              src={FALLBACK_IMAGE}
              alt={author}
              className="w-16 h-16 rounded-full border border-gray-200 flex-shrink-0"
              loading="lazy"
            />
            <div>
              <h3 className="font-medium text-gray-900">{author}</h3>
              <p className="mt-1 text-sm text-gray-600">
                {instructorBio}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section - Simplified */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Đánh giá từ học viên
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_REVIEWS.map((review, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {review.name}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Courses Section - Simplified */}
      {relatedCourses.length > 0 && (
        <section className="bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Khóa học liên quan
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedCourses.map((course, index) => (
                <Link
                  key={index}
                  to={`/courses/${course.id}`}
                  className="block border border-gray-200 rounded-lg bg-white overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}