// DetailCourse.tsx - Updated to fetch dynamic data using CourseService
import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Play,
  FileText,
  HelpCircle,
  AlertCircle,
  Clock,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { CourseService } from "../../service/CourseService";
import { EnrollService } from "../../service/EnrollService";
import type { ContentResponse } from "../../service/CourseService";
import type {
  EnrollmentRequest,
  EnrollmentStatus,
} from "../../types/Enrollment";
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
    <div className="bg-white min-h-screen">
      <Toaster position="top-center" />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              {/* <span 
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-600"
                aria-label={`${courseData.category}, ${courseData.level || 'Cơ bản'}`}
              >
                {courseData.category} • {courseData.level || 'Cơ bản'}
              </span> */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {courseData.title}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {courseData.description}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium">{hours} giờ</span> • {lessons}{" "}
                  bài học
                  <span>
                    • Giảng viên:{" "}
                    <span className="font-medium text-gray-900">{author}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(rating)}
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {rating}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                {isEnrolled ? (
                  <Link
                    to={`/course/learning/${id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Tiếp tục học"
                  >
                    Tiếp tục học
                  </Link>
                ) : (
                  <>
                    <button
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Đăng ký học ngay"
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
                            userId: userId, // Truyền userId từ state (đã là number)
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
                      disabled={enrolling || !userId} // Disable nếu chưa login
                    >
                      {enrolling
                        ? "Đang đăng ký..."
                        : `Đăng ký học ngay (${priceDisplay})`}
                    </button>
                    <Link
                      to={`/course/learning/${id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Xem thử miễn phí"
                    >
                      Xem thử miễn phí
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="order-first md:order-last">
              <img
                src={courseData.thumbnailUrl || FALLBACK_IMAGE}
                alt={courseData.title}
                className="w-full rounded-xl shadow-lg object-cover h-48 md:h-64"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Now dynamic based on contents */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center md:text-left">
          Bạn sẽ học được gì?
        </h2>
        {benefits.length > 0 ? (
          <ul className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto md:mx-0">
            {benefits.map((benefit, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">
                  ✓
                </span>
                <span className="text-gray-700 leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Chưa có nội dung chi tiết để hiển thị lợi ích học tập.
          </p>
        )}
      </section>

      {/* Curriculum Section - Updated for better readability */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Nội dung khóa học
            </h2>
            {curriculum[0]?.totalDuration && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Tổng thời lượng: {curriculum[0].totalDuration}</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {curriculum.map((module, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleModule(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={openModules.includes(index)}
                  aria-controls={`module-${index}`}
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{module.lessons} bài học</span>
                      {module.totalDuration && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {module.totalDuration}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform duration-300 ease-in-out ${
                      openModules.includes(index) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  id={`module-${index}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openModules.includes(index)
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-gray-100">
                    <ul className="divide-y divide-gray-100">
                      {module.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex-shrink-0 w-8 text-right font-mono text-sm text-gray-500">
                            {item.index}
                          </span>
                          <div className="flex items-start gap-3 flex-1 min-w-0 py-1">
                            {renderTypeIcon(item.type)}
                            <div className="flex-1 min-w-0">
                              <span className="block font-medium text-gray-900 text-sm leading-relaxed truncate">
                                {item.name}
                              </span>
                              {item.duration && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3" />
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
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">
                  Chưa có nội dung cho khóa học này. Hãy kiểm tra lại sau!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Giảng viên
        </h2>
        <div className="max-w-md mx-auto flex flex-col md:flex-row gap-6 items-center md:items-start">
          <img
            src={FALLBACK_IMAGE} // Default image, can be extended
            alt={author}
            className="w-24 h-24 rounded-full shadow-md flex-shrink-0"
            loading="lazy"
          />
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-gray-900 text-xl">{author}</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              {instructorBio}
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Đánh giá từ học viên
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {DEFAULT_REVIEWS.map((review, index) => (
            <article
              key={index}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {review.name}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{review.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Related Courses Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Khóa học liên quan
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {relatedCourses.map((course, index) => (
            <Link
              key={index}
              to={`/courses/${course.id}`}
              className="block rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Xem khóa học ${course.title}`}
            >
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {course.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}