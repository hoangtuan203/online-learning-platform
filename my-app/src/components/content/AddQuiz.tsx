import React, { useState } from 'react';
import { Upload, Plus, X, Save } from 'lucide-react';

interface AddQuizProps {
  onSubmit: (data: any) => void;
  errors: Record<string, string>;
}

export const AddQuiz: React.FC<AddQuizProps> = ({ onSubmit, errors }) => {
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
    duration: '30',
    passingScore: '70',
    tags: [],
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
    thumbnail: null,
  });

  const [quizTags, setQuizTags] = useState('');

  const handleQuizInputChange = (e: any) => {
    const { name, value } = e.target;
    setQuizForm(prev => ({ ...prev, [name]: value }));
  };

  const handleQuizFileChange = (e: any, fileType: string) => {
    const file = e.target.files[0];
    if (file) {
      setQuizForm(prev => ({ ...prev, [fileType]: file.name }));
    }
  };

  const addQuizTag = () => {
    if (quizTags.trim() && !quizForm.tags.includes(quizTags.trim())) {
      setQuizForm(prev => ({
        ...prev,
        tags: [...prev.tags, quizTags.trim()]
      }));
      setQuizTags('');
    }
  };

  const removeQuizTag = (tagToRemove: string) => {
    setQuizForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuizForm(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    setQuizForm(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].options[oIndex] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSubmit = () => {
    onSubmit(quizForm);
  };

  const resetForm = () => {
    setQuizForm({
      title: '',
      description: '',
      category: '',
      instructor: '',
      duration: '30',
      passingScore: '70',
      tags: [],
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
      thumbnail: null,
    });
    setQuizTags('');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tiêu Đề Quiz <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={quizForm.title}
          onChange={handleQuizInputChange}
          placeholder="Nhập tiêu đề quiz"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
            errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô Tả <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={quizForm.description}
          onChange={handleQuizInputChange}
          placeholder="Nhập mô tả chi tiết về quiz"
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
            errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh Mục <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={quizForm.category}
            onChange={handleQuizInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
              errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn danh mục</option>
            <option value="web">Web Development</option>
            <option value="mobile">Mobile Dev</option>
            <option value="data">Data Science</option>
            <option value="design">UI/UX Design</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giảng Viên
          </label>
          <input
            type="text"
            name="instructor"
            value={quizForm.instructor}
            onChange={handleQuizInputChange}
            placeholder="Tên giảng viên"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời Gian (phút)
          </label>
          <input
            type="number"
            name="duration"
            value={quizForm.duration}
            onChange={handleQuizInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Điểm Qua (%)
          </label>
          <input
            type="number"
            name="passingScore"
            value={quizForm.passingScore}
            onChange={handleQuizInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            min="0"
            max="100"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Các Câu Hỏi ({quizForm.questions.length})</h3>
          <button
            onClick={addQuestion}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Thêm Câu Hỏi
          </button>
        </div>

        <div className="space-y-4">
          {quizForm.questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-sm font-medium text-gray-700">
                  Câu hỏi {qIndex + 1} <span className="text-red-500">*</span>
                </label>
                {quizForm.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <textarea
                value={q.question}
                onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                placeholder="Nhập câu hỏi"
                rows={2}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  errors[`question_${qIndex}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors[`question_${qIndex}`] && (
                <p className="text-red-500 text-sm">{errors[`question_${qIndex}`]}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={q.correctAnswer === oIndex}
                      onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Tùy chọn ${oIndex + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={quizTags}
            onChange={(e) => setQuizTags(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuizTag())}
            placeholder="Thêm tag và nhấn Enter"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <button
            onClick={addQuizTag}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
          >
            <Plus size={18} />
          </button>
        </div>
        {quizForm.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quizForm.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2 border border-indigo-200"
              >
                {tag}
                <button
                  onClick={() => removeQuizTag(tag)}
                  className="hover:text-indigo-900"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          onClick={resetForm}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center gap-2"
        >
          <Save size={18} />
          Lưu Quiz
        </button>
      </div>
    </div>
  );
};