import { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Edit3, Trash2 } from 'lucide-react';
import type { NoteResponse } from '../../service/NoteService';
import { NoteService } from '../../service/NoteService';
import NoteForm from './NoteForm';

interface NotesOverlayProps {
  notes: Array<string | NoteResponse>;
  onClose: () => void;
  title?: string;
  onUpdateNote?: (noteId: number, newText: string) => Promise<void>;
  onDeleteNote?: (noteId: number) => Promise<void>;
  enrollmentId?: number;
}

export default function NotesOverlay({ notes: initialNotes, onClose, title, onUpdateNote, onDeleteNote, enrollmentId }: NotesOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [contentFilter, setContentFilter] = useState<'all' | 'current'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteResponse | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  
  const noteService = useMemo(() => new NoteService(), []);



  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Chỉ chạy khi filters hoặc enrollmentId thay đổi
  useEffect(() => {
    if (!enrollmentId) return;

    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        const currentContentId = contentFilter === 'current' ? 
          (initialNotes.find(n => typeof n !== 'string' && n.contentId) as NoteResponse)?.contentId : 
          undefined;

        const filteredNotes = await noteService.getFilteredNotes(
          enrollmentId,
          currentContentId,
          sortOrder
        );
        setNotes(filteredNotes);
      } catch (error) {
        console.error('Failed to load filtered notes:', error);
        setNotes(initialNotes);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [contentFilter, sortOrder, enrollmentId, initialNotes, noteService]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const stripHtml = (html = '') => {
    try {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    } catch (e) {
      return html || '';
    }
  };

  const extractTitle = (item: string | NoteResponse) => {
    if (typeof item !== 'string' && item.contentTitle) return item.contentTitle;
    const text = typeof item === 'string' ? stripHtml(item) : stripHtml(item.noteText || '');
    const firstLine = text.split(/\r?\n/).map(l => l.trim()).find(Boolean);
    return firstLine || (text.substring(0, 60) || 'Ghi chú');
  };

  const extractTime = (item: string | NoteResponse) => {
    if (typeof item !== 'string' && item.timestamp) return item.timestamp;
    const raw = typeof item === 'string' ? item : (item.noteText || '');
    const m = raw.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
    if (m && m[1]) return m[1];
    // fallback: try mm:ss like 00:32
    const m2 = raw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    return m2 ? m2[1] : '00:00';
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Right drawer */}
      <aside
        className={`absolute top-0 right-0 h-full w-full md:w-1/2 bg-white shadow-xl transform transition-transform duration-300 flex flex-col ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Ghi chú của tôi"
      >
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-md">
              <Edit3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ghi chú của tôi</h3>
              <p className="text-sm text-gray-500">{title || ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select 
              className="border rounded-md px-3 py-1 text-sm bg-white"
              value={contentFilter}
              onChange={(e) => setContentFilter(e.target.value as 'all' | 'current')}
            >
              <option value="all">Trong tất cả các chương</option>
              <option value="current">Chương hiện tại</option>
            </select>
            <select 
              className="border rounded-md px-3 py-1 text-sm bg-white"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Đang tải ghi chú...</div>
          ) : notes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Chưa có ghi chú nào.</div>
          ) : (
            notes.map((note, idx) => {
              const titleText = extractTitle(note);
              const timeText = extractTime(note);
              const contentHtml = typeof note === 'string' ? note : (note.noteText || '');

              return (
                <article
                  key={idx}
                  className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 pt-1">
                      <span className="inline-block bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {timeText}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-semibold text-orange-600">{titleText}</h4>
                        </div>

                          <div className="flex items-center gap-2 text-gray-400">
                          <button 
                            className="p-1.5 rounded hover:bg-gray-100"
                            onClick={() => typeof note !== 'string' && onUpdateNote?.(note.id, note.noteText)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 rounded hover:bg-gray-100"
                            onClick={() => typeof note !== 'string' && onDeleteNote?.(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 bg-gray-50 rounded-md p-4 text-sm text-gray-700 prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
