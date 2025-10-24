import { Link } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline"; 
import { useState } from "react";

// Sample course data based on fullstack.edu.vn structure
const courseData = {
  title: "React + TailwindCSS: Xây dựng giao diện đỉnh cao",
  category: "Frontend",
  level: "Cơ bản",
  hours: 6,
  lessons: 34,
  author: "Nguyễn Hoàng Tuấn",
  image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1760504138/thumbnail_url/lcu0huk5suc5y8slspdc.jpg",
  description: "Khóa học giúp bạn xây dựng giao diện web hiện đại với React và TailwindCSS. Từ cơ bản đến nâng cao, thực hành qua các dự án thực tế.",
  benefits: [
    "Xây dựng UI responsive với TailwindCSS",
    "Hiểu rõ component-based architecture trong React",
    "Tích hợp React với các thư viện UI",
    "Tối ưu hóa performance cho ứng dụng web",
    "Deploy ứng dụng React lên hosting",
  ],
  curriculum: [
    {
      title: "Giới thiệu",
      lessons: 3,
      items: ["Tổng quan về React", "Cài đặt môi trường", "Hello World với React"],
    },
    {
      title: "Cơ bản TailwindCSS",
      lessons: 8,
      items: ["Cài đặt Tailwind", "Utility classes cơ bản", "Responsive design", "Custom themes"],
    },
    {
      title: "Components trong React",
      lessons: 10,
      items: ["Functional components", "Props và State", "Lifecycle methods", "Hooks cơ bản"],
    },
    {
      title: "Tích hợp React + Tailwind",
      lessons: 7,
      items: ["Xây dựng form", "Navigation bar", "Cards và lists", "Modal và popups"],
    },
    {
      title: "Dự án thực tế",
      lessons: 6,
      items: ["Xây dựng landing page", "Dashboard admin", "E-commerce UI", "Testing và deploy"],
    },
  ],
  instructor: {
    name: "Nguyễn Hoàng Tuấn",
    bio: "Giảng viên với 5 năm kinh nghiệm phát triển frontend. Đã tham gia nhiều dự án lớn tại các công ty công nghệ.",
    image: "/placeholder-instructor.svg",
  },
  reviews: [
    { name: "Học viên A", text: "Khóa học rất thực tế, dễ hiểu!", rating: 5 },
    { name: "Học viên B", text: "Giảng viên hỗ trợ nhiệt tình.", rating: 4.5 },
    { name: "Học viên C", text: "Nội dung cập nhật, đáng học.", rating: 5 },
  ],
  relatedCourses: [
    { title: "Next.js 15: Từ cơ bản đến nâng cao", image: "/placeholder.svg" },
    { title: "Data Visualization với Recharts", image: "/placeholder.svg" },
  ],
};

export default function CourseDetail() {
  const [openModules, setOpenModules] = useState([]);

  const toggleModule = (index) => {
    setOpenModules((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-600">
                {courseData.category} • {courseData.level}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">
                {courseData.title}
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                {courseData.description}
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{courseData.hours} giờ</span> • {courseData.lessons} bài học
                </div>
                <div className="text-sm text-gray-500">
                  Giảng viên: <span className="font-medium">{courseData.author}</span>
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-400 transition-all">
                  Đăng ký học ngay
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                  Xem thử miễn phí
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <img src={courseData.image} alt={courseData.title} className="rounded-xl shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Bạn sẽ học được gì?</h2>
        <ul className="grid sm:grid-cols-2 gap-4">
          {courseData.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-500">✓</span>
              <span className="text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Curriculum Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nội dung khóa học</h2>
        <div className="space-y-4">
          {courseData.curriculum.map((module, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <button
                onClick={() => toggleModule(index)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-500">{module.lessons} bài học</p>
                </div>
                <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${openModules.includes(index) ? 'rotate-180' : ''}`} />
              </button>
              {openModules.includes(index) && (
                <ul className="px-4 pb-4 space-y-2 text-sm text-gray-700">
                  {module.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-blue-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Instructor Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Giảng viên</h2>
        <div className="flex gap-6 items-start">
          <img src={courseData.instructor.image} alt={courseData.instructor.name} className="w-24 h-24 rounded-full shadow-md" />
          <div>
            <h3 className="font-semibold text-gray-900">{courseData.instructor.name}</h3>
            <p className="mt-2 text-gray-600">{courseData.instructor.bio}</p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá từ học viên</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseData.reviews.map((review, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.floor(review.rating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">{review.text}</p>
              <p className="text-sm font-medium text-gray-900">{review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Courses Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Khóa học liên quan</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseData.relatedCourses.map((course, index) => (
            <Link key={index} to="/courses/some-slug" className="block rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
              <img src={course.image} alt={course.title} className="rounded-t-xl w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{course.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}