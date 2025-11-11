// ListCourses.tsx - Fixed flicker on search: Use skeleton loading instead of full spinner, keep previous data visible with overlay dim
// Updated: Initial load now uses skeleton grid instead of full spinner for smoother experience
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Search as SearchIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { CoursePage } from "../../types/Course";
import { CourseService } from "../../service/CourseService";

const LazyCourseCard = lazy(() =>
  import("../../components/cards/CourseCard").then((module) => ({
    default: module.CourseCard,
  }))
);

const courseService = new CourseService();

// Skeleton Card Component for loading state
const SkeletonCourseCard = () => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

export default function ListCourses() {
  const [coursesData, setCoursesData] = useState<CoursePage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTitle, setSearchTitle] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string | undefined>(undefined);
  const [selectedFilter, setSelectedFilter] = useState<string>("Tất cả");
  const [categories, setCategories] = useState<string[]>([]);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Fetch dynamic categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const firstPage = await courseService.getAllCourses(0, 50);
        const uniqueCategories = Array.from(
          new Set(firstPage.content.map((course: any) => course.category).filter(Boolean))
        ).sort();
        setCategories(["Tất cả", ...uniqueCategories]);
      } catch (err) {
        console.error("Error fetching categories:", err);
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

  // Debounce search
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      setSearchTitle(searchQuery.trim());
      setCurrentPage(0);
      setSearchCategory(undefined);
      setSelectedFilter("Tất cả");
    }, 500);

    setDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchCourses = async () => {
    try {
      setLoading(true); // Always set loading for all fetches (initial and subsequent)
      setError(null);
      let data: CoursePage;

      if (searchTitle || searchCategory) {
        data = await courseService.searchCourses(searchTitle, searchCategory, currentPage, pageSize);
      } else {
        data = await courseService.getAllCourses(currentPage, pageSize);
      }

      const enrichedContent = await Promise.all(
        data.content.map(async (course) => {
          try {
            const contents = await courseService.getContentsByCourseId(course.id.toString());
            const totalLessons = contents.length;
            const totalSeconds = contents
              .filter((content) => content.type === "VIDEO" && content.duration != null)
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
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải khóa học");
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
      setSearchTitle("");
      setSearchQuery("");
      setSelectedFilter(category);
    }
    setCurrentPage(0);
  };

  const getPageNumbers = () => {
    const totalPages = coursesData?.totalPages || 0;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }

    return pages;
  };

  return (
    <section className="relative bg-gradient-to-b from-white via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 min-h-screen overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {searchTitle || searchCategory ? "Kết quả tìm kiếm" : "Tất cả khóa học"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Khám phá {coursesData?.totalElements || 0} khóa học từ cơ bản đến nâng cao.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div className="mb-8 max-w-2xl mx-auto" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg overflow-hidden group">
            <div className="relative flex">
              <input
                className="w-full pl-12 pr-4 py-4 text-lg bg-transparent text-gray-900 placeholder:text-gray-500 outline-none transition-all duration-300 focus:pl-12 group-hover:shadow-md"
                placeholder="Tìm kiếm khóa học theo tên hoặc mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div className="mb-8 flex overflow-x-auto gap-2 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 shadow-sm">
            <Filter className="h-4 w-4" />
            Lọc theo danh mục
          </div>
          {categories.map((cat, index) => (
            <motion.span
              key={cat}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-105 ${
                selectedFilter === cat
                  ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600"
              }`}
              onClick={() => handleFilterChange(cat)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat}
            </motion.span>
          ))}
        </motion.div>

        {error && (
          <motion.div className="mb-12 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-lg" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold text-lg">Không thể tải khóa học</p>
              <p className="text-red-600 text-sm mt-2">{error}</p>
              <button onClick={fetchCourses} className="mt-3 inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium">
                Thử lại ngay
              </button>
            </div>
          </motion.div>
        )}

        {/* Initial loading: Skeleton grid (no data yet) */}
        {loading && !coursesData && (
          <div className="mb-12">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <SkeletonCourseCard key={index} />
              ))}
            </div>
          </div>
        )}

        {/* Subsequent loading: Skeleton overlay on dimmed previous data */}
        {loading && coursesData && (
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Đang tìm kiếm...</p>
              </div>
            </div>
            {/* Render previous data dimmed */}
            <div className="opacity-50 pointer-events-none">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {coursesData.content.map((course: any) => (
                  <Link key={course.id} to={`/courses/detail/${course.id}`} className="block">
                    <LazyCourseCard {...course} category={course.category || "Chưa có mô tả"} level="Cơ bản" hours={course.totalHours || 0} lessons={course.totalLessons || 0} rating={4.5} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && coursesData && (
          <motion.div initial="hidden" whileInView="visible" variants={containerVariants} viewport={{ once: true }}>
            {coursesData.content.length > 0 ? (
              <div className="mb-12">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <Suspense fallback={<></> /* Handled by skeleton above */}>
                    {coursesData.content.map((course: any, index) => (
                      <motion.div key={course.id} variants={itemVariants} transition={{ duration: 0.4, delay: index * 0.05 }} whileHover={{ y: -5, scale: 1.02 }} className="group">
                        <Link to={`/courses/detail/${course.id}`} className="block hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <LazyCourseCard {...course} category={course.category || "Chưa có mô tả"} level="Cơ bản" hours={course.totalHours || 0} lessons={course.totalLessons || 0} rating={4.5} />
                        </Link>
                      </motion.div>
                    ))}
                  </Suspense>
                </div>
              </div>
            ) : (
              <motion.div className="mb-12 text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-2xl font-semibold text-gray-900 mb-2">Không tìm thấy khóa học nào</p>
                {searchTitle && <p className="text-gray-500 text-lg">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem thêm.</p>}
                <Link to="/courses" className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold">
                  Xem tất cả khóa học
                </Link>
              </motion.div>
            )}

            {/* Pagination */}
            {coursesData.totalPages > 1 && (
              <motion.div className="flex items-center justify-center gap-1 flex-wrap" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <motion.button className="group flex items-center gap-1 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md" disabled={currentPage === 0} onClick={() => handlePageChange(currentPage - 1)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ChevronLeft className="h-4 w-4 group-hover:translate-x-[-1px] transition-transform" />
                  Trước
                </motion.button>

                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <motion.button key={index} className={`px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm ${page === currentPage ? "border-blue-500 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"}`} onClick={() => handlePageChange(page)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {page + 1}
                    </motion.button>
                  ) : (
                    <span key={index} className="px-3 py-2.5 text-gray-400 font-medium">{page}</span>
                  )
                )}

                <motion.button className="group flex items-center gap-1 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md" disabled={currentPage === coursesData.totalPages - 1} onClick={() => handlePageChange(currentPage + 1)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  Sau
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-[1px] transition-transform" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}