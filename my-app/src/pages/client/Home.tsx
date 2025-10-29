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
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1760767641/react_tailwind_ikg2jg.png",
  },
  {
    title: "Next.js 15: Từ cơ bản đến nâng cao",
    category: "Fullstack",
    level: "Trung cấp",
    hours: 14,
    lessons: 76,
    author: "Lê Khánh Duy",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1760767641/react_tailwind_ikg2jg.png",
  },
  {
    title: "Data Visualization với Recharts",
    category: "Data",
    level: "Cơ bản",
    hours: 5,
    lessons: 28,
    author: "Trần Phương Linh",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1760767641/react_tailwind_ikg2jg.png",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero - Clean, high readability with better contrast */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-blue-50/30" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid items-center gap-12 lg:gap-16 lg:grid-cols-2">
          <div className="order-2 lg:order-1 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Nền tảng học trực tuyến số 1
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
              Học nhanh hơn, thông minh hơn với
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Elysia Academy</span>
            </h1>
            <p className="max-w-lg text-lg text-gray-600 leading-relaxed">
              Khám phá hàng trăm khóa học chất lượng cao, cập nhật liên tục. Lộ trình rõ ràng, thực hành thực tế, hỗ trợ tận tâm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Khám phá khóa học
              </Link>
              <Link
                to="#popular"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Xem khóa học nổi bật
              </Link>
            </div>
            {/* Stats - High contrast, larger font */}
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: "50k+", label: "Học viên", icon: User },
                { value: "300+", label: "Khóa học", icon: BookOpen },
                { value: "4.9/5", label: "Đánh giá", icon: Star },
              ].map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <stat.icon className="mx-auto h-10 w-10 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 relative">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-100 bg-white p-4">
                <SearchIcon className="mx-3 h-5 w-5 text-gray-400 flex-shrink-0" />
                <input 
                  className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 flex-1" 
                  placeholder="Bạn muốn học gì hôm nay?" 
                />
                <button className="hidden sm:block shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors duration-200">
                  Tìm kiếm
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                {['React', 'TailwindCSS', 'UI/UX', 'Node.js', 'TypeScript', 'Data'].map((t) => (
                  <span key={t} className="inline-flex items-center justify-center rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-colors duration-200 cursor-pointer">
                    {t}
                  </span>
                ))}
              </div>
              <img 
                src="/placeholder.svg" 
                alt="learning" 
                className="mt-4 w-full h-64 rounded-xl object-cover" 
                loading="lazy" // Performance: Lazy load
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features - Clean cards, no hover for simplicity */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Tại sao chọn Elysia?</h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">Thiết kế đẹp, nội dung chất lượng, trải nghiệm học tập tuyệt vời.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Courses - Simple grid */}
      <section id="popular" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Khóa học nổi bật</h2>
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">Lựa chọn bởi hàng ngàn học viên mỗi ngày.</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
          >
            Xem tất cả <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded-xl" />}>
            {featured.map((c, index) => (
              <div key={c.title} className="transition-shadow duration-300 hover:shadow-md">
                <LazyCourseCard {...c} />
              </div>
            ))}
          </Suspense>
        </div>
      </section>

      {/* Testimonials - Simple, high readability */}
      <section className="relative py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Học viên nói gì?</h2>
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">Trải nghiệm tuyệt vời từ cộng đồng Elysia.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(t.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-base text-gray-700 leading-relaxed mb-4">{t.text}</p>
                <div className="text-sm font-semibold text-gray-900">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Clean, focused */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-24 bg-white">
        <div className="mx-auto max-w-4xl text-center rounded-2xl bg-gray-50 p-12 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Sẵn sàng bắt đầu?</h3>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Tham gia Elysia Academy ngay hôm nay và chinh phục mục tiêu của bạn.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Bắt đầu học ngay <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}