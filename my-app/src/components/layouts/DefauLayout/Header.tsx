import { Link, NavLink } from "react-router-dom";
import { Logo } from "../../common/Logo";

const navLinkBase =
  "px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-transparent bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/60">
      {/* Thay 'container' bằng 'w-full' để full width */}
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"> {/* Thêm px-* responsive nếu cần spacing nhỏ */}
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${navLinkBase} ${isActive ? "text-indigo-600" : ""}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/courses" className={({ isActive }) => `${navLinkBase} ${isActive ? "text-indigo-600" : ""}`}>
            Khóa học
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="hidden sm:inline-flex items-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Bắt đầu học
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 active:scale-[0.98] md:hidden"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}