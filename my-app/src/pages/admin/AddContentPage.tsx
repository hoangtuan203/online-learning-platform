import React, { useState } from 'react';
import { FileText, HelpCircle, Film } from 'lucide-react';
import { AddVideo } from '../../components/content/AddVideo';
import { AddDocument } from '../../components/content/AddDocument';
import { AddQuiz } from '../../components/content/AddQuiz';


const AddContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('video');
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateVideoForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.title) newErrors.title = 'Tiêu đề không được để trống';
    if (!data.category) newErrors.category = 'Danh mục không được để trống';
    if (!data.description) newErrors.description = 'Mô tả không được để trống';
    return newErrors;
  };

  const validateDocumentForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.title) newErrors.title = 'Tiêu đề không được để trống';
    if (!data.category) newErrors.category = 'Danh mục không được để trống';
    if (!data.description) newErrors.description = 'Mô tả không được để trống';
    return newErrors;
  };

  const validateQuizForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.title) newErrors.title = 'Tiêu đề không được để trống';
    if (!data.category) newErrors.category = 'Danh mục không được để trống';
    if (!data.description) newErrors.description = 'Mô tả không được để trống';
    data.questions.forEach((q: any, i: number) => {
      if (!q.question) newErrors[`question_${i}`] = 'Câu hỏi không được để trống';
    });
    return newErrors;
  };

  const handleVideoSubmit = (data: any) => {
    const newErrors = validateVideoForm(data);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSuccessMsg('Video đã được thêm thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
    console.log('Video Data:', data);
    // Gọi API để lưu dữ liệu
  };

  const handleDocumentSubmit = (data: any) => {
    const newErrors = validateDocumentForm(data);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSuccessMsg('Tài liệu đã được thêm thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
    console.log('Document Data:', data);
    // Gọi API để lưu dữ liệu
  };

  const handleQuizSubmit = (data: any) => {
    const newErrors = validateQuizForm(data);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSuccessMsg('Quiz đã được thêm thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
    console.log('Quiz Data:', data);
    // Gọi API để lưu dữ liệu
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setErrors({});
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
    

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Thêm Nội Dung Học Tập</h1>
          <p className="text-gray-500 mt-1">Tạo video, tài liệu hoặc quiz mới cho khóa học</p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('video')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'video'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Film className="w-5 h-5" />
              Video
            </button>
            <button
              onClick={() => handleTabChange('document')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'document'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              Tài Liệu
            </button>
            <button
              onClick={() => handleTabChange('quiz')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'quiz'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              Quiz
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'video' && (
              <AddVideo onSubmit={handleVideoSubmit} errors={errors} />
            )}
            {activeTab === 'document' && (
              <AddDocument onSubmit={handleDocumentSubmit} errors={errors} />
            )}
            {activeTab === 'quiz' && (
              <AddQuiz onSubmit={handleQuizSubmit} errors={errors} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContentPage;