import { Link } from "react-router-dom";
import { CourseCard } from "../../components/cards/CourseCard";

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-white/95 backdrop-blur-sm" />
        <div className="absolute left-1/2 top-[-100px] -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-100/30 blur-3xl animate-pulse" />
        <div className="w-full px-4 sm:px-6 lg:px-8 grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-md backdrop-blur-lg transition-all hover:shadow-lg">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              Nền tảng học trực tuyến số 1
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl leading-tight">
              Học nhanh hơn, thông minh hơn với
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500"> Elysia Academy</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-600 leading-relaxed">
              Khám phá hàng trăm khóa học chất lượng cao, cập nhật liên tục. Lộ trình rõ ràng, thực hành thực tế, hỗ trợ tận tâm.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-all duration-300 transform hover:-translate-y-1"
              >
                Khám phá khóa học
              </Link>
              <a
                href="#popular"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
              >
                Xem khóa học nổi bật
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: "50k+", label: "Học viên" },
                { value: "300+", label: "Khóa học" },
                { value: "4.9/5", label: "Đánh giá" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-gray-100 bg-white/90 p-5 text-center shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
                  <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-lg transition-all hover:shadow-xl">
              <div className="flex items-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mx-3 text-gray-400">
                  <path d="M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm10 2l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input className="w-full bg-transparent text-base outline-none placeholder:text-gray-400" placeholder="Bạn muốn học gì hôm nay?" />
                <button className="hidden shrink-0 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white sm:block hover:bg-blue-400 transition-colors">
                  Tìm kiếm
                </button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                {['React', 'TailwindCSS', 'UI/UX', 'Node.js', 'TypeScript', 'Data'].map((t) => (
                  <span key={t} className="inline-flex items-center justify-center rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-colors">
                    {t}
                  </span>
                ))}
              </div>
              <img src="/placeholder.svg" alt="learning" className="mt-5 h-64 w-full rounded-xl object-cover transform transition-transform duration-500 hover:scale-105" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tại sao chọn Elysia?</h2>
          <p className="mt-3 text-lg text-gray-600 leading-relaxed">Thiết kế đẹp, nội dung chất lượng, trải nghiệm học tập tuyệt vời.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Lộ trình rõ ràng",
              desc: "Học theo từng bước, phù hợp mọi cấp độ.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 group-hover:scale-110">
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="2" />
                </svg>
              ),
            },
            {
              title: "Dự án thực tế",
              desc: "Áp dụng ngay vào công việc.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 group-hover:scale-110">
                  <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: "Cộng đồng hỗ trợ",
              desc: "Mentor và học viên nhiệt tình.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 group-hover:scale-110">
                  <path d="M16 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 21a6 6 0 1 1 12 0" stroke="currentColor" strokeWidth="2" />
                </svg>
              ),
            },
            {
              title: "Chứng chỉ uy tín",
              desc: "Khẳng định năng lực của bạn.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 group-hover:scale-110">
                  <path d="M12 3l6 3v6c0 3.866-3.582 7-8 7s-8-3.134-8-7V6l6-3" stroke="currentColor" strokeWidth="2" />
                </svg>
              ),
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section id="popular" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Khóa học nổi bật</h2>
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">Lựa chọn bởi hàng ngàn học viên mỗi ngày.</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-all"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <div className="transform transition-all duration-300 hover:-translate-y-1">
              <CourseCard key={c.title} {...c} />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative overflow-hidden py-20 bg-white">
        <div className="absolute inset-0 -z-10 bg-white/95 backdrop-blur-sm" />
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Học viên nói gì?</h2>
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">Trải nghiệm tuyệt vời từ cộng đồng Elysia.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Minh Anh",
                text: "Giao diện quá đẹp và dễ dùng. Lộ trình học rõ ràng, mình tiến bộ rất nhanh!",
              },
              { name: "Hữu Phúc", text: "Khóa học chất lượng, giảng viên nhiệt tình. Rất đáng tiền!" },
              { name: "Lan Hương", text: "Thực hành nhiều, ứng dụng ngay vào dự án thực tế của mình." },
            ].map((t, index) => (
              <div
                key={t.name}
                className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-500 transform hover:shadow-md ${
                  index % 2 === 0 ? 'animate-slide-in-left' : 'animate-slide-in-right'
                }`}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M7 11h4v6H7zM13 11h4v6h-4z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">{t.text}</p>
                <div className="mt-4 text-sm font-semibold text-gray-900">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-24 bg-white">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg sm:p-14">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-3xl font-extrabold sm:text-4xl text-gray-900">Sẵn sàng bắt đầu?</h3>
              <p className="mt-2 text-lg text-gray-600 leading-relaxed">
                Tham gia Elysia Academy ngay hôm nay và chinh phục mục tiêu của bạn.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center rounded-xl bg-blue-500 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-400 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              Bắt đầu học ngay
            </Link>
          </div>
        </div>
      </section>


    </>
  );
}