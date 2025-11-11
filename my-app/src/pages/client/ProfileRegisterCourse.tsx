import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { EnrollService } from "../../service/EnrollService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

interface EnrolledCourse {
  id: number;
  title: string;
  instructor: string;
  progress: number; // 0-100
  thumbnailUrl?: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

interface ProfileRegisterCourseProps {
  user: User;
}

const ProfileRegisterCourse: React.FC<ProfileRegisterCourseProps> = ({
  user,
}) => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      try {
        setLoading(true);
        setError(null);

        const userStr = localStorage.getItem("user");
        if (!userStr) {
          throw new Error("Không tìm thấy thông tin user trong localStorage");
        }
        const storedUser = JSON.parse(userStr);
        const userId = storedUser.id;

        if (!userId) {
          throw new Error("Không tìm thấy userId");
        }

        const enrollService = new EnrollService();
        const { enrollments } = await enrollService.getEnrolledCourses(userId);
        const mappedCourses: EnrolledCourse[] = enrollments.map(
          (enrollment) => ({
            id: enrollment.courseId,
            title: enrollment.courseTitle,
            instructor: enrollment.instructorName || "Giảng viên chưa xác định", // Fix: Sử dụng 'instructor' thay vì 'instructorName', thêm fallback để tránh undefined
            progress: enrollment.progressPercentage,
            thumbnailUrl: enrollment.thumbnailUrl, // Giữ nguyên, optional nên an toàn
          })
        );

        setEnrolledCourses(mappedCourses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Lỗi khi tải danh sách khóa học"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return <LoadingSpinner></LoadingSpinner>;
  }

  if (error) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Khóa học đã đăng ký
        </h3>
        <p className="text-red-500 text-center py-8">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Khóa học đã đăng ký ({enrolledCourses.length})
      </h3>
      {enrolledCourses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Bạn chưa đăng ký khóa học nào.
        </p>
      ) : (
        <div className="space-y-4">
          {enrolledCourses.map((course) => (
            <div
              key={course.id}
              className="flex gap-4 p-4 border border-gray-200 rounded-md"
            >
              <div className="flex-shrink-0">
                <img
                  src={course.thumbnailUrl || "/default-course.jpg"}
                  alt={course.title}
                  className="w-16 h-16 rounded-md object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-500">
                  Giảng viên: {course.instructor}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {course.progress}% hoàn thành
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to={`/course/learning/${course.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Tiếp tục học
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileRegisterCourse;
