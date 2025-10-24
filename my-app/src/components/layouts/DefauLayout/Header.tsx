import { Link, NavLink } from "react-router-dom";
import { Logo } from "../../common/Logo";

const navLinkBase =
  "px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${navLinkBase} ${isActive ? "text-blue-500" : ""}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/courses" className={({ isActive }) => `${navLinkBase} ${isActive ? "text-blue-500" : ""}`}>
            Khóa học
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="hidden sm:inline-flex items-center rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
          >
            Bắt đầu học
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 active:scale-[0.98] md:hidden"
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