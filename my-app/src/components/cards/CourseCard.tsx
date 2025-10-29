// components/cards/CourseCard.tsx - Updated with level badge on top-right of thumbnail
import { Link } from "react-router-dom";
import type { CourseCardProps } from "../../types/Course";  // Import from types

export function CourseCard(props: CourseCardProps) {
  const { 
    id,
    title, 
    category = "Chưa có danh mục", 
    author, 
    thumbnailUrl: image = "/default-image.png",  // Fallback if null
    price,
    hours,
    lessons,
    level,
    rating 
  } = props;


  const formattedPrice = price ? `${price.toLocaleString("vi-VN")} VND` : "Miễn phí";
  const authorName = props.author;

  return (
    <Link
      to={`/courses/detail/${id}`}  // Dynamic link using id from Course
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Khóa học: ${title} bởi ${authorName}`}
    >
      {/* Image Section - Simplified with subtle hover scale */}
      <div className="relative  overflow-hidden">  {/* Adjusted aspect for better mobile */}
        <img
          src={image}
          alt={title}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />  {/* Softer gradient */}
        {/* Category Badge - Top-left */}
        <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          {category}
        </div>
        {/* Level Badge - Top-right, similar to category */}
        <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-violet-500/90 px-2 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
          {level}
        </div>
      </div>

      {/* Content Section - Cleaner layout with better spacing */}
      <div className="flex flex-1 flex-col p-4">  {/* Reduced padding for compact feel */}
        {/* Title - Single line clamp for simplicity */}
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Meta Info - Compact row with icons (only hours/lessons now) */}
        <div className="flex items-center justify-start text-xs text-gray-500 mb-2">  {/* justify-start to left-align */}
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-indigo-500">
              <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hours}h • {lessons} bài
          </span>
        </div>

        {/* Author - Subtle and compact */}
        <div className="text-xs text-gray-500 mb-2 truncate">Giảng viên: {authorName}</div>

        {/* Price and Rating - Combined in one row (flex justify-between) */}
        <div className="flex items-center justify-between text-sm">
          {/* Price */}
          <div className="font-bold">
            {formattedPrice !== "Miễn phí" ? (
              <span className="text-green-600">{formattedPrice}</span>
            ) : (
              <span className="text-gray-400">Miễn phí</span>
            )}
          </div>
          {/* Rating - Aligned to right */}
          {rating && (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <span className="text-yellow-500">★ ★ ★ ★ ☆</span>
              <span className="text-gray-500 ml-1">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}