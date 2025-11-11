import { Link } from "react-router-dom";
import { 
  User, 
  BookOpen, 
  Star, 
  Play, 
  Users, 
  Award, 
  Search as SearchIcon,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";  // Add framer-motion for smooth animations (install if needed: npm i framer-motion)

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
    rating: 4.9,
  },
  {
    title: "Next.js 15: Từ cơ bản đến nâng cao",
    category: "Fullstack",
    level: "Trung cấp",
    hours: 14,
    lessons: 76,
    author: "Lê Khánh Duy",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1762314494/thumbnail_url/pwx0mfdvwuphbkqv1f0j.jpg",
    rating: 4.8,
  },
  {
    title: "Data Visualization với Recharts",
    category: "Data",
    level: "Cơ bản",
    hours: 5,
    lessons: 28,
    author: "Trần Phương Linh",
    image: "https://res.cloudinary.com/dm1alq68q/image/upload/v1762314494/thumbnail_url/pwx0mfdvwuphbkqv1f0j.jpg",
    rating: 4.7,
  },
];

// Testimonials data
const testimonials = [
  {
    name: "Minh Anh",
    text: "Giao diện quá đẹp và dễ dùng. Lộ trình học rõ ràng, mình tiến bộ rất nhanh!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  },
  { 
    name: "Hữu Phúc", 
    text: "Khóa học chất lượng, giảng viên nhiệt tình. Rất đáng tiền!", 
    rating: 4.5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  { 
    name: "Lan Hương", 
    text: "Thực hành nhiều, ứng dụng ngay vào dự án thực tế của mình.", 
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");  // Add state for search (optimized for UX)

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Hero - Enhanced with gradient, better search, and animated stats */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200 py-12 md:py-20 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid lg:grid-cols-2 gap-8 items-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <motion.h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                Học nhanh hơn, thông minh hơn với
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Elysia Academy</span>
              </motion.h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Khám phá hàng trăm khóa học chất lượng cao, cập nhật liên tục. Lộ trình rõ ràng, thực hành thực tế, hỗ trợ tận tâm.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/courses"
                  className="group inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Khám phá khóa học
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="#popular"
                  className="inline-flex items-center justify-center border-2 border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:shadow-md"
                >
                  Xem khóa học nổi bật
                </Link>
              </div>
              {/* Animated Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-6 pt-4"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                {[
                  { value: "50k+", label: "Học viên", icon: User },
                  { value: "300+", label: "Khóa học", icon: BookOpen },
                  { value: "4.9/5", label: "Đánh giá", icon: Star },
                ].map((stat, index) => (
                  <motion.div 
                    key={index} 
                    variants={itemVariants}
                    className="text-center group"
                    whileHover={{ scale: 1.05 }}
                  >
                    <stat.icon className="mx-auto h-8 w-8 text-blue-600 mb-2 group-hover:rotate-12 transition-transform duration-300" />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              className="order-first lg:order-last relative"
            >
              {/* Enhanced Search Bar with shadow and focus effects */}
              <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-1">
                <div className="relative flex">
                  <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-sm outline-none placeholder:text-gray-500 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    placeholder="Bạn muốn học gì hôm nay?" 
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 px-2 pb-2 text-xs">
                  {['React', 'TailwindCSS', 'UI/UX', 'Node.js', 'TypeScript', 'Data'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="inline-flex items-center justify-center border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-md text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features - Enhanced with icons and hover effects */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tại sao chọn Elysia?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Thiết kế đẹp, nội dung chất lượng, trải nghiệm học tập tuyệt vời và cá nhân hóa.</p>
          </motion.div>
          <motion.div 
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
          >
            {[
              {
                title: "Lộ trình rõ ràng",
                desc: "Học theo từng bước, phù hợp mọi cấp độ từ mới bắt đầu đến chuyên gia.",
                icon: Play,
                color: "from-blue-50 to-blue-100",
              },
              {
                title: "Dự án thực tế",
                desc: "Áp dụng ngay kiến thức vào các dự án thực tế, xây dựng portfolio ấn tượng.",
                icon: GraduationCap,
                color: "from-green-50 to-green-100",
              },
              {
                title: "Cộng đồng hỗ trợ",
                desc: "Kết nối với mentor và học viên, trao đổi kinh nghiệm 24/7 qua diễn đàn.",
                icon: Users,
                color: "from-purple-50 to-purple-100",
              },
              {
                title: "Chứng chỉ uy tín",
                desc: "Nhận chứng chỉ được công nhận, nâng tầm CV và cơ hội việc làm.",
                icon: Award,
                color: "from-yellow-50 to-yellow-100",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                <div className="relative z-10">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm shadow-lg group-hover:bg-white transition-all duration-300">
                    <feature.icon className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 relative z-10">{feature.title}</h3>
                  <p className="text-sm text-gray-600 relative z-10 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Courses - Enhanced with gradient cards and better fallback */}
      <section id="popular" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mb-8 flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Khóa học nổi bật</h2>
              <p className="mt-2 text-lg text-gray-600">Lựa chọn bởi hàng ngàn học viên mỗi ngày. Khám phá ngay!</p>
            </div>
            <Link
              to="/courses"
              className="group inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Xem tất cả
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <Suspense fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          }>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course, index) => (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <LazyCourseCard 
                    {...course}
                    rating={course.rating}  // Pass rating if CourseCard supports
                  />
                </motion.div>
              ))}
            </div>
          </Suspense>
        </div>
      </section>

      {/* Testimonials - Enhanced with carousel-like stagger animation and avatars */}
      <section className="bg-gradient-to-b from-indigo-50 to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Học viên nói gì?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Trải nghiệm thực tế từ cộng đồng Elysia – hơn 50.000 học viên đã tin tưởng.</p>
          </motion.div>
          <motion.div 
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden"
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 opacity-50"></div>
                {/* Avatar */}
                <img 
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="absolute -top-6 left-4 w-12 h-12 rounded-full border-2 border-white shadow-md"
                />
                {/* Stars */}
                <div className="flex items-center gap-1 mb-3 relative z-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(testimonial.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600">{testimonial.rating}</span>
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed relative z-10">{testimonial.text}</p>
                <div className="relative z-10">
                  <div className="text-xs font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">Học viên Elysia</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA - Enhanced with gradient and animation */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-700 py-16 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng bắt đầu hành trình?</h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed opacity-90">
              Tham gia Elysia Academy ngay hôm nay và chinh phục mục tiêu nghề nghiệp của bạn với các khóa học hàng đầu.
            </p>
            <Link
              to="/courses"
              className="group inline-flex items-center bg-white text-indigo-600 px-8 py-3 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Bắt đầu học ngay
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}