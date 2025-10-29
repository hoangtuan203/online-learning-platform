// ListCourses.tsx - Updated to enrich courses with total hours and lessons, integrated search functionality,
// dynamic categories from API (fetch larger page for more complete categories), and real-time search (debounced)
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Search as SearchIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { CoursePage } from "../../types/Course";
import { CourseService } from "../../service/CourseService";

const LazyCourseCard = lazy(() =>
  import("../../components/cards/CourseCard").then((module) => ({
    default: module.CourseCard,
  }))
);

const courseService = new CourseService();

export default function ListCourses() {
  const [coursesData, setCoursesData] = useState<CoursePage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // New states for search
  const [searchTitle, setSearchTitle] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("Tất cả");
  const [categories, setCategories] = useState<string[]>([]); // Dynamic categories from API
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Fetch dynamic categories on mount (from larger first page to capture more categories)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch larger page (e.g., size=50) to get more courses and extract unique categories
        // Adjust size based on your data volume (trade-off: slower initial load but more complete)
        const firstPage = await courseService.getAllCourses(0, 50);
        const uniqueCategories = Array.from(
          new Set(
            firstPage.content
              .map((course: any) => course.category)
              .filter(Boolean)
          )
        ).sort(); // Sort alphabetically, filter non-null
        setCategories(["Tất cả", ...uniqueCategories]);
      } catch (err) {
        console.error("Error fetching categories:", err);
        // Fallback to hardcoded if API fails
        setCategories([
          "Tất cả",
          "Frontend",
          "Backend",
          "Fullstack",
          "Data",
          "Design",
          "Microservices",
          "Spring Boot",
        ]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, pageSize, searchTitle, searchCategory]);

  // Real-time search debounce: Call search after user stops typing (500ms)
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      setSearchTitle(searchQuery.trim());
      setCurrentPage(0); // Reset to first page on search
      setSearchCategory(undefined); // Clear category filter if searching by title
      setSelectedFilter("Tất cả");
    }, 500); // Debounce delay: 500ms

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: CoursePage;

      // Conditional fetch: search if params present, else all courses
      if (searchTitle || searchCategory) {
        data = await courseService.searchCourses(
          searchTitle,
          searchCategory,
          currentPage,
          pageSize
        );
      } else {
        data = await courseService.getAllCourses(currentPage, pageSize);
      }

      const enrichedContent = await Promise.all(
        data.content.map(async (course) => {
          try {
            const contents = await courseService.getContentsByCourseId(
              course.id.toString()
            );
            const totalLessons = contents.length;
            const totalSeconds = contents
              .filter(
                (content) =>
                  content.type === "VIDEO" && content.duration != null
              )
              .reduce((sum, content) => sum + (content.duration || 0), 0);
            const totalHours = Math.round(totalSeconds / 3600);
            return { ...course, totalHours, totalLessons };
          } catch (enrichError) {
            console.error(`Error enriching course ${course.id}:`, enrichError);
            return { ...course, totalHours: 0, totalLessons: 0 };
          }
        })
      );

      setCoursesData({ ...data, content: enrichedContent });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải khóa học"
      );
      console.error("Error fetching courses:", err);
      setCoursesData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < (coursesData?.totalPages || 0)) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFilterChange = (category: string) => {
    if (category === "Tất cả") {
      setSearchCategory(undefined);
      setSelectedFilter("Tất cả");
    } else {
      setSearchCategory(category);
      setSearchTitle(""); // Clear title search if filtering by category
      setSearchQuery(""); // Clear input
      setSelectedFilter(category);
    }
    setCurrentPage(0); // Reset to first page on filter
  };

  const getPageNumbers = () => {
    const totalPages = coursesData?.totalPages || 0;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);

      if (currentPage > 2) {
        pages.push("...");
      }

      for (
        let i = Math.max(1, currentPage - 1);
        i <= Math.min(totalPages - 2, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      pages.push(totalPages - 1);
    }

    return pages;
  };

  return (
    <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {searchTitle || searchCategory
              ? "Kết quả tìm kiếm"
              : "Tất cả khóa học"}
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Khám phá {coursesData?.totalElements || 0} khóa học từ cơ bản đến
            nâng cao
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm">
            <SearchIcon className="mx-3 my-3 h-5 w-5 text-gray-400" />
            <input
              className="flex-1 px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none"
              placeholder="Tìm kiếm khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters (Dynamic from API) */}
        <div className="mb-8 flex overflow-x-auto gap-2 pb-2">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
            <Filter className="h-4 w-4" />
            Lọc theo
          </div>
          {categories.map((cat) => (
            <span
              key={cat}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                selectedFilter === cat
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
              onClick={() => handleFilterChange(cat)}
            >
              {cat}
            </span>
          ))}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Không thể tải khóa học</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={fetchCourses}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && coursesData && (   
          <>
            {coursesData.content.length > 0 ? (
              <div className="mb-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <Suspense
                    fallback={
                      <div className="col-span-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: pageSize }).map((_, i) => (
                          <div
                            key={i}
                            className="h-80 bg-gray-100 rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    }
                  >
                    {coursesData.content.map((course: any) => (
                      <Link
                        key={course.id}
                        to={`/courses/detail/${course.id}`}
                        className="block hover:shadow-md transition-shadow rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() =>
                          console.log(
                            `Clicked course ${course.id} - Should navigate to /courses/detail/${course.id}`
                          )
                        }
                      >
                        <LazyCourseCard
                          {...course} 
                          category={course.category || "Chưa có mô tả"} 
                          level="Cơ bản"
                          hours={course.totalHours || 0}
                          lessons={course.totalLessons || 0} 
                          rating={4.5} 
                        />
                      </Link>
                    ))}
                  </Suspense>
                </div>
              </div>
            ) : (
              <div className="mb-8 text-center py-12">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy khóa học nào
                </p>
                {searchTitle && (
                  <p className="text-gray-400 text-sm mt-2">
                    Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
                  </p>
                )}
              </div>
            )}

            {/* Pagination */}
            {coursesData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  className="flex items-center gap-1 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <button
                      key={index}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page + 1}
                    </button>
                  ) : (
                    <span key={index} className="px-2 text-gray-400">
                      {page}
                    </span>
                  )
                )}

                <button
                  className="flex items-center gap-1 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage === coursesData.totalPages - 1}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
