
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Elysia Academy home">
      <span className="flex-shrink-0 relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
          <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7l3.5 2v6L12 17l-3.5-2V9L12 7z" fill="currentColor" />
        </svg>
      </span>
      <span className="whitespace-nowrap text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Elysia Academy</span>
    </span>
  );
}