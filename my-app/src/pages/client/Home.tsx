// Home.tsx - Fixed errors, beautiful & readable design
import { Link } from "react-router-dom";
import { 
  User, 
  BookOpen, 
  Star, 
  Play, 
  Users, 
  Award, 
  Search as SearchIcon,
  ArrowRight 
} from "lucide-react";
import { lazy, Suspense } from "react";

// Fixed lazy import: Ensure CourseCard exports default or use named export
const LazyCourseCard = lazy(() => import("../../components/cards/CourseCard").then(module => ({ default: module.CourseCard })));
const featured = [
  {
    title: "React + TailwindCSS: Xây dựng giao diện đỉnh cao",
    category: "Frontend",
    level: "Cơ bản",
    hours: 6,
    lessons: 34,
    author: "Nguyễn Hoàng Tuấn",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1762314494/thumbnail_url/pwx0mfdvwuphbkqv1f0j.jpg",
  },
  {
    title: "Next.js 15: Từ cơ bản đến nâng cao",
    category: "Fullstack",
    level: "Trung cấp",
    hours: 14,
    lessons: 76,
    author: "Lê Khánh Duy",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1762314494/thumbnail_url/pwx0mfdvwuphbkqv1f0j.jpg",
  },
  {
    title: "Data Visualization với Recharts",
    category: "Data",
    level: "Cơ bản",
    hours: 5,
    lessons: 28,
    author: "Trần Phương Linh",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1762314494/thumbnail_url/pwx0mfdvwuphbkqv1f0j.jpg",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero - Simplified */}
      <section className="bg-white border-b border-gray-200 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Học nhanh hơn, thông minh hơn với
                <span className="block text-blue-600">Elysia Academy</span>
              </h1>
              <p className="text-gray-600 leading-relaxed max-w-lg">
                Khám phá hàng trăm khóa học chất lượng cao, cập nhật liên tục. Lộ trình rõ ràng, thực hành thực tế, hỗ trợ tận tâm.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center bg-blue-600 px-6 py-2.5 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Khám phá khóa học
                </Link>
                <Link
                  to="#popular"
                  className="inline-flex items-center justify-center border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Xem khóa học nổi bật
                </Link>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { value: "50k+", label: "Học viên", icon: User },
                  { value: "300+", label: "Khóa học", icon: BookOpen },
                  { value: "4.9/5", label: "Đánh giá", icon: Star },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="mx-auto h-6 w-6 text-blue-600 mb-2" />
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-first lg:order-last">
              <div className="border border-gray-200 rounded-lg bg-white p-4">
                <div className="flex items-center border border-gray-200 rounded-md bg-white p-3 mb-3">
                  <SearchIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <input 
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 flex-1" 
                    placeholder="Bạn muốn học gì hôm nay?" 
                  />
                  <button className="hidden sm:block bg-blue-600 px-4 py-1.5 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors">
                    Tìm kiếm
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['React', 'TailwindCSS', 'UI/UX', 'Node.js', 'TypeScript', 'Data'].map((t) => (
                    <span key={t} className="inline-flex items-center justify-center border border-gray-200 bg-gray-50 px-2 py-1 rounded text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Simplified */}
      <section className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tại sao chọn Elysia?</h2>
            <p className="text-sm text-gray-600">Thiết kế đẹp, nội dung chất lượng, trải nghiệm học tập tuyệt vời.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Lộ trình rõ ràng",
                desc: "Học theo từng bước, phù hợp mọi cấp độ.",
                icon: Play,
              },
              {
                title: "Dự án thực tế",
                desc: "Áp dụng ngay vào công việc.",
                icon: BookOpen,
              },
              {
                title: "Cộng đồng hỗ trợ",
                desc: "Mentor và học viên nhiệt tình.",
                icon: Users,
              },
              {
                title: "Chứng chỉ uy tín",
                desc: "Khẳng định năng lực của bạn.",
                icon: Award,
              },
            ].map((f, index) => (
              <div
                key={f.title}
                className="border border-gray-200 rounded-lg bg-white p-4"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses - Simplified */}
      <section id="popular" className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Khóa học nổi bật</h2>
              <p className="mt-1 text-sm text-gray-600">Lựa chọn bởi hàng ngàn học viên mỗi ngày.</p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Xem tất cả <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded-lg" />}>
              {featured.map((c, index) => (
                <div key={c.title}>
                  <LazyCourseCard {...c} />
                </div>
              ))}
            </Suspense>
          </div>
        </div>
      </section>

      {/* Testimonials - Simplified */}
      <section className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Học viên nói gì?</h2>
            <p className="text-sm text-gray-600">Trải nghiệm tuyệt vời từ cộng đồng Elysia.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Minh Anh",
                text: "Giao diện quá đẹp và dễ dùng. Lộ trình học rõ ràng, mình tiến bộ rất nhanh!",
                rating: 5,
              },
              { 
                name: "Hữu Phúc", 
                text: "Khóa học chất lượng, giảng viên nhiệt tình. Rất đáng tiền!", 
                rating: 4.5 
              },
              { 
                name: "Lan Hương", 
                text: "Thực hành nhiều, ứng dụng ngay vào dự án thực tế của mình.", 
                rating: 5 
              },
            ].map((t, index) => (
              <div
                key={t.name}
                className="border border-gray-200 rounded-lg bg-white p-4"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(t.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t.text}</p>
                <div className="text-xs font-medium text-gray-900">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Simplified */}
      <section className="bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center border border-gray-200 rounded-lg bg-gray-50 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sẵn sàng bắt đầu?</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
              Tham gia Elysia Academy ngay hôm nay và chinh phục mục tiêu của bạn.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center bg-blue-600 px-6 py-2.5 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Bắt đầu học ngay <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}