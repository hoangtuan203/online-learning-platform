// Updated CoursePage.tsx

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CourseService } from "../../service/CourseService";
import type { Course } from "../../types/Course";
import type { CoursePage } from "../../types/Course";
import CourseContentsModal from "./CourseContentModel";

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

const CoursePage: React.FC = () => {
  const [coursePage, setCoursePage] = useState<CoursePage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "createdAt" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // New states for modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCourses = async (page: number = 0, size: number = pageSize) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const courseService = new CourseService();
      const response = await courseService.getAllCourses(page, size);
      setCoursePage(response);
    } catch (error) {
      console.error("Lỗi tải danh sách khóa học:", error);
      setErrorMessage(
        "Không thể tải danh sách khóa học. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCourses(currentPage, pageSize);
  };

  // New: Handle double-click to open modal
  const handleCourseDoubleClick = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchCourses(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Hàm sort courses (client-side cho filtered results)
  const sortCourses = (courses: Course[]) => {
    if (!sortBy) return courses;

    return [...courses].sort((a, b) => {
      let aValue: any, bValue: any;

      if (sortBy === "price") {
        aValue = a.price || 0;
        bValue = b.price || 0;
      } else if (sortBy === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredCourses = coursePage?.content
    ? coursePage.content.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const sortedCourses = sortCourses(filteredCourses);
  const totalElements = coursePage?.totalElements || 0;
  const totalPages = coursePage?.totalPages || 0;

  // Hàm toggle sort
  const toggleSort = (field: "price" | "createdAt") => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("asc");
    } else {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  // Hàm clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSortBy(null);
    setSortOrder("asc");
  };

  // Hàm pagination
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirst = () => setCurrentPage(0);
  const goToLast = () => setCurrentPage(totalPages - 1);
  const goToPrev = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const goToNext = () =>
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

  // Simplified page numbers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const delta = 2;

    // Always show first page
    if (totalPages > 1) {
      pages.push(0);
    }

    // Show pages around current page
    for (
      let i = Math.max(0, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages - 1)) {
      pages.push(totalPages - 1);
    }

    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {sortedCourses.length} / {totalElements} courses
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort & Refresh Controls */}
            <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => toggleSort("price")}
                className={`flex items-center px-2 py-1 rounded-md transition-colors text-xs ${
                  sortBy === "price"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title="Sắp xếp theo giá"
              >
                {sortBy === "price" ? (
                  sortOrder === "asc" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )
                ) : (
                  <span>₫</span>
                )}
              </button>

              <button
                onClick={() => toggleSort("createdAt")}
                className={`flex items-center px-2 py-1 rounded-md transition-colors text-xs ${
                  sortBy === "createdAt"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title="Sắp xếp theo ngày"
              >
                {sortBy === "createdAt" ? (
                  sortOrder === "asc" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )
                ) : (
                  <span>📅</span>
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center p-1 rounded-md transition-colors ${
                  isRefreshing
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                }`}
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>

              {(searchTerm || sortBy) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Xóa bộ lọc"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Add Course Button */}
            <Link
              to="/add-course"
              className="inline-flex items-center px-4 py-3 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {errorMessage}
          </div>
        )}

        {sortBy && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-700">
              Đã sắp xếp theo {sortBy === "price" ? "Giá" : "Ngày tạo"} (
              {sortOrder === "asc" ? "Tăng dần" : "Giảm dần"})
            </span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    STT
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên khóa học
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảng viên
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCourses.length > 0 ? (
                  sortedCourses.map((course, index) => (
                    <tr
                      key={course.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onDoubleClick={() => handleCourseDoubleClick(course)} // Added double-click handler
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">
                        {course.id}
                      </td>
                      <td className="px-6 py-4">
                        <CourseThumbnail
                          thumbnailUrl={course.thumbnailUrl}
                          title={course.title}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-gray-900 max-w-xs truncate"
                          title={course.title}
                        >
                          {course.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">
                        {course.instructor?.fullName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                        {course.price
                          ? `${course.price.toLocaleString("vi-VN")} VNĐ`
                          : "Miễn phí"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">
                        {new Date(course.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 flex justify-center items-center space-x-2">
                        <Link
                          to={`/add-content-course/${course.id}`}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                          title="Thêm nội dung cho khóa học"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() =>
                            console.log(`Delete course ${course.id}`)
                          }
                          className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                          title="Xóa khóa học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "Không tìm thấy khóa học phù hợp."
                        : "Chưa có khóa học nào."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Info Section */}
                <div className="text-sm text-gray-700">
                  Display {Math.min(currentPage * pageSize + 1, totalElements)} -{" "}
                  {Math.min((currentPage + 1) * pageSize, totalElements)}/
                  {totalElements} in courses
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  {/* Page Size */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(0);
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isRefreshing}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <span className="text-sm text-gray-500">Courses</span>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={goToFirst}
                      disabled={currentPage === 0 || isRefreshing}
                      className="p-2 text-blue-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={goToPrev}
                      disabled={currentPage === 0 || isRefreshing}
                      className="w-9 h-9 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                    >
                      ‹
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        disabled={isRefreshing}
                        className={`w-9 h-9 rounded-md border transition-colors text-sm font-medium ${
                          currentPage === page
                            ? "bg-blue-300 text-white border-blue-400 shadow-sm"
                            : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
                        }`}
                      >
                        {page + 1}
                      </button>
                    ))}

                    <button
                      onClick={goToNext}
                      disabled={currentPage === totalPages - 1 || isRefreshing}
                      className="w-9 h-9 border border-blue-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                    >
                      ›
                    </button>

                    <button
                      onClick={goToLast}
                      disabled={currentPage === totalPages - 1 || isRefreshing}
                      className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </button>
                  </div>

                  <span className="text-sm text-gray-700 hidden sm:inline px-3">
                    Page {currentPage + 1} / {totalPages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCourse && (
        <CourseContentsModal
          course={selectedCourse}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default CoursePage;