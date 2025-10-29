import { useEffect, useState, useMemo } from 'react';
import { X, MessageCircle, Edit3, Trash2 } from 'lucide-react';

interface QAResponse {
  id: number;
  contentId: string;
  contentTitle: string;
  question: string;
  answer?: string;
  createdAt: string;
  status: 'pending' | 'answered';
}

interface QAOverlayProps {
  questions: QAResponse[];
  onClose: () => void;
  title?: string;
  onUpdateQuestion?: (questionId: number, newText: string) => Promise<void>;
  onDeleteQuestion?: (questionId: number) => Promise<void>;
  onAskQuestion?: (question: string) => Promise<void>;
  enrollmentId?: number;
}

export default function QAOverlay({ 
  questions: initialQuestions, 
  onClose, 
  title, 
  onUpdateQuestion, 
  onDeleteQuestion,
  onAskQuestion, 
  enrollmentId 
}: QAOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [questions, setQuestions] = useState(initialQuestions);
  const [contentFilter, setContentFilter] = useState<'all' | 'current'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Effect để lọc câu hỏi dựa trên filters
  useEffect(() => {
    let filteredQuestions = [...initialQuestions];
    
    // Lọc theo trạng thái
    if (statusFilter !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.status === statusFilter);
    }

    // Sắp xếp theo thời gian
    filteredQuestions.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setQuestions(filteredQuestions);
  }, [initialQuestions, statusFilter, sortOrder]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !onAskQuestion) return;

    try {
      setIsLoading(true);
      await onAskQuestion(newQuestion);
      setNewQuestion('');
      setShowAskForm(false);
    } catch (error) {
      console.error('Failed to ask question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        aria-label="Hỏi đáp"
      >
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-md">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hỏi đáp</h3>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'answered')}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chưa trả lời</option>
              <option value="answered">Đã trả lời</option>
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

        <div className="p-6 overflow-y-auto flex-1">
          {/* Ask Question Button */}
          <div className="mb-6">
            {showAskForm ? (
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Nhập câu hỏi của bạn..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    onClick={() => setShowAskForm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleAskQuestion}
                    disabled={!newQuestion.trim() || isLoading}
                  >
                    {isLoading ? 'Đang gửi...' : 'Gửi câu hỏi'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAskForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Đặt câu hỏi mới
              </button>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {isLoading && questions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Đang tải câu hỏi...</div>
            ) : questions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Chưa có câu hỏi nào.</div>
            ) : (
              questions.map((question) => (
                <article
                  key={question.id}
                  className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {question.contentTitle}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{formatDate(question.createdAt)}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              question.status === 'answered' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {question.status === 'answered' ? 'Đã trả lời' : 'Chờ trả lời'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400">
                          <button 
                            className="p-1.5 rounded hover:bg-gray-100"
                            onClick={() => onUpdateQuestion?.(question.id, question.question)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 rounded hover:bg-gray-100"
                            onClick={() => onDeleteQuestion?.(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-gray-700">{question.question}</p>
                        {question.answer && (
                          <div className="mt-4 bg-gray-50 rounded-md p-4">
                            <p className="text-xs font-medium text-gray-500 mb-2">Trả lời:</p>
                            <p className="text-sm text-gray-700">{question.answer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}