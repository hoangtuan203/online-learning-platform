// src/components/learning/LearningSidebar.tsx
import { ChevronLeft, BookOpen, Plus, CheckCircle } from "lucide-react";
import type { NoteResponse } from '../../service/NoteService';

type NoteItem = NoteResponse | { __raw?: string; noteText?: string; timestamp?: string; contentTitle?: string; createdAt?: string };

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: string;
}

interface SidebarSection {
  icon: any;
  title: string;
  count?: number;
  items?: any[];
}

interface LearningSidebarProps {
  isOpen: boolean;
  activeTab: "lessons" | "notes";
  lessons: Lesson[];
  sidebarSections: SidebarSection[];
  notes: Array<string | NoteResponse>;
  selectedLessonId: string | null;
  onLessonSelect: (id: string) => void;
  onToggleSidebar: (open: boolean) => void;
  onToggleTab: (tab: "lessons" | "notes") => void;
  renderTypeIcon: (type: string) => any;
}

export default function LearningSidebar({
  isOpen,
  activeTab,
  lessons,
  sidebarSections,
  notes,
  selectedLessonId,
  onLessonSelect,
  onToggleSidebar,
  renderTypeIcon,
}: LearningSidebarProps) {
  return (
    <aside
      className={`bg-white border-l border-gray-200 h-full w-full max-w-[320px] transition-all duration-300 ease-in-out min-h-0 overflow-hidden ${isOpen ? '' : ''}`}
    >
      <div className="h-full flex flex-col min-h-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">
            {activeTab === "lessons" ? "Nội dung khóa học" : "Ghi chú"}
          </h3>
          <button
            onClick={() => onToggleSidebar(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Sidebar Content - Independent scroll */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 overscroll-contain">
          {activeTab === "lessons" ? (
            <>
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <BookOpen className="h-4 w-4 text-gray-600" />({lessons.length}{" "}
                bài)
              </h4>
              <div className="space-y-2">
                {lessons.map((lesson) => {
                  const isSelected = selectedLessonId === lesson.id;
                  const isCompleted = lesson.completed;
                  let buttonClass =
                    "w-full text-left p-3 rounded-lg transition-colors border border-transparent flex items-center gap-3";
                  if (isSelected) {
                    buttonClass += " bg-blue-50 border-blue-200 text-blue-700";
                  } else if (isCompleted) {
                    buttonClass +=
                      " bg-green-50 border-green-200 text-green-700";
                  } else {
                    buttonClass += " hover:bg-gray-50 text-gray-700";
                  }
                  return (
                    <button
                      key={lesson.id}
                      className={buttonClass}
                      onClick={() => onLessonSelect(lesson.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {renderTypeIcon(lesson.type)}
                          <span className="font-medium truncate">
                            {lesson.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 block">
                          {lesson.duration}
                        </span>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              {sidebarSections.slice(1).map((section, index) => (
                <div key={index} className="p-4 border-b border-gray-200 mt-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <section.icon className="h-4 w-4 text-gray-600" />
                    {section.title}
                    {section.count && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {section.count}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Chưa có nội dung</p>
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Plus className="h-4 w-4" />
                      Thêm mới
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Ghi chú thêm</h4>
                  <select className="text-sm border border-gray-200 rounded px-2 py-1">
                    <option>Trong chương hiện tại</option>
                    <option>Mở rộng</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                    00:32
                  </span>
                  <span>Static file & SCSS Kiến thức cơ bản</span>
                </div>
              </div>
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chưa có ghi chú nào.
                  </p>
                ) : (
                  notes.map((note, index) => {
                    const item = typeof note === 'string' ? { __raw: note, noteText: note } as NoteItem : note as NoteItem;
                    const raw = ('__raw' in item ? (item as any).__raw : undefined) || item.noteText || '';
                    const timeMatch = raw.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/)?.[1] || (('timestamp' in item && (item as any).timestamp) || '00:00');
                    const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                    const title = (item as any).contentTitle || (stripHtml(raw).split(/\r?\n/).find(Boolean) || 'Ghi chú');
                    const contentHtml = item.noteText || (('__raw' in item ? (item as any).__raw : '') as string) || '';

                    return (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">{timeMatch}</span>
                            <div className="truncate">
                              <div className="text-sm font-semibold text-orange-600 truncate">{title}</div>
                              <div className="text-xs text-gray-500 truncate">Kiến thức cốt lõi</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <button className="p-1 rounded hover:bg-gray-100">
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20h9"></path></svg>
                            </button>
                            <button className="p-1 rounded hover:bg-gray-100">
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 prose prose-sm max-w-none bg-gray-50 rounded-md p-3"> 
                          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
