import { Link } from "react-router-dom";

export interface CourseCardProps {
  title: string;
  category: string;
  level: string;
  hours: number;
  lessons: number;
  author: string;
  image: string;
}

export function CourseCard(props: CourseCardProps) {
  return (
    <Link
      to="/courses"
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={props.image}
          alt={props.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur">
          {props.category}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{props.title}</h3>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
              <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {props.hours} giờ • {props.lessons} bài
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-violet-600">
              <path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" stroke="currentColor" strokeWidth="2" />
            </svg>
            {props.level}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">Giảng viên: {props.author}</div>
      </div>
    </Link>
  );
}
