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
    image: "/placeholder.svg",
  },
  {
    title: "Next.js 15: Từ cơ bản đến nâng cao",
    category: "Fullstack",
    level: "Trung cấp",
    hours: 14,
    lessons: 76,
    author: "Lê Khánh Duy",
    image: "/placeholder.svg",
  },
  {
    title: "Data Visualization với Recharts",
    category: "Data",
    level: "Cơ bản",
    hours: 5,
    lessons: 28,
    author: "Trần Phương Linh",
    image: "/placeholder.svg",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute left-1/2 top-[-120px] -z-10 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-500/20 via-fuchsia-400/20 to-indigo-500/20 blur-3xl" />
        {/* Thay container bằng w-full + padding responsive */}
        <div className="w-full px-4 sm:px-6 lg:px-8 grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600" />
              Nền tảng học trực tuyến số 1
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Học nhanh hơn, thông minh hơn với
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> Elysia Academy</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
              Hàng trăm khóa học chất lượng cao, cập nhật liên tục. Lộ trình rõ ràng, thực hành thực tế, hỗ trợ tận tâm.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500"
              >
                Khám phá khóa học
              </Link>
              <a
                href="#popular"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem khóa học nổi bật
              </a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-slate-900">50k+</div>
                <div className="text-xs text-slate-600">Học viên</div>
              </div>
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-red-900">300+</div>
                <div className="text-xs text-slate-600">Khóa học</div>
              </div>
              <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-slate-900">4.9/5</div>
                <div className="text-xs text-slate-600">Đánh giá</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border bg-white p-3 shadow-xl">
              <div className="flex items-center overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mx-2 text-slate-400">
                  <path d="M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm10 2l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Bạn muốn học gì hôm nay?" />
                <button className="hidden shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white sm:block">Tìm kiếm</button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                {['React', 'TailwindCSS', 'UI/UX', 'Node.js', 'TypeScript', 'Data'].map((t) => (
                  <span key={t} className="inline-flex items-center justify-center rounded-lg border bg-white px-2 py-1 text-slate-600 hover:text-indigo-600">
                    {t}
                  </span>
                ))}
              </div>
              <img src="/placeholder.svg" alt="learning" className="mt-4 h-56 w-full rounded-xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-14"> {/* Thay container */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Tại sao chọn Elysia?</h2>
          <p className="mt-2 text-slate-600">Thiết kế đẹp, nội dung chất lượng, trải nghiệm học tập tuyệt vời.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Lộ trình rõ ràng", desc: "Học theo từng bước, phù hợp mọi cấp độ.", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="2"/></svg>
            ) },
            { title: "Dự án thực tế", desc: "Áp dụng ngay vào công việc.", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            ) },
            { title: "Cộng đồng hỗ trợ", desc: "Mentor và học viên nhiệt tình.", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2"/><path d="M6 21a6 6 0 1 1 12 0" stroke="currentColor" strokeWidth="2"/></svg>
            ) },
            { title: "Chứng chỉ uy tín", desc: "Khẳng định năng lực của bạn.", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 3v6c0 3.866-3.582 7-8 7s-8-3.134-8-7V6l6-3" stroke="currentColor" strokeWidth="2"/></svg>
            ) },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section id="popular" className="w-full px-4 sm:px-6 lg:px-8 py-14"> {/* Thay container */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Khóa học nổi bật</h2>
            <p className="mt-2 text-slate-600">Lựa chọn bởi hàng ngàn học viên mỗi ngày.</p>
          </div>
          <Link to="/courses" className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:inline-flex">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CourseCard key={c.title} {...c} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/60 to-transparent" />
        {/* Thay container */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Học viên nói gì?</h2>
            <p className="mt-2 text-slate-600">Trải nghiệm tuyệt vời từ cộng đồng Elysia.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Minh Anh",
                text: "Giao diện quá đẹp và dễ dùng. Lộ trình học rõ ràng, mình tiến bộ rất nhanh!",
              },
              { name: "Hữu Phúc", text: "Khóa học chất lượng, giảng viên nhiệt tình. Rất đáng tiền!" },
              { name: "Lan Hương", text: "Thực hành nhiều, ứng dụng ngay vào dự án thực tế của mình." },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 11h4v6H7zM13 11h4v6h-4z" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <p className="text-sm text-slate-700">{t.text}</p>
                <div className="mt-3 text-xs font-semibold text-slate-900">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-20"> {/* Thay container */}
        <div className="overflow-hidden rounded-3xl border bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-extrabold sm:text-3xl">Sẵn sàng bắt đầu?</h3>
              <p className="mt-1 text-white/80">Tham gia Elysia Academy ngay hôm nay và chinh phục mục tiêu của bạn.</p>
            </div>
            <Link to="/courses" className="inline-flex items-center rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:from-violet-400 hover:to-indigo-400">
              Bắt đầu học ngay
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}