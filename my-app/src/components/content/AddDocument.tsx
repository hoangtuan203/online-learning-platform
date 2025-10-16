import React, { useState } from 'react';
import { Upload, Plus, X, Save } from 'lucide-react';

interface AddDocumentProps {
  onSubmit: (data: any) => void;
  errors: Record<string, string>;
}

export const AddDocument: React.FC<AddDocumentProps> = ({ onSubmit, errors }) => {
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
    tags: [],
    document: null,
    thumbnail: null,
  });

  const [docTags, setDocTags] = useState('');

  const handleDocInputChange = (e: any) => {
    const { name, value } = e.target;
    setDocumentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDocFileChange = (e: any, fileType: string) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentForm(prev => ({ ...prev, [fileType]: file.name }));
    }
  };

  const addDocTag = () => {
    if (docTags.trim() && !documentForm.tags.includes(docTags.trim())) {
      setDocumentForm(prev => ({
        ...prev,
        tags: [...prev.tags, docTags.trim()]
      }));
      setDocTags('');
    }
  };

  const removeDocTag = (tagToRemove: string) => {
    setDocumentForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = () => {
    onSubmit(documentForm);
  };

  const resetForm = () => {
    setDocumentForm({
      title: '',
      description: '',
      category: '',
      instructor: '',
      tags: [],
      document: null,
      thumbnail: null,
    });
    setDocTags('');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tiêu Đề Tài Liệu <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={documentForm.title}
          onChange={handleDocInputChange}
          placeholder="Nhập tiêu đề tài liệu"
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
          value={documentForm.description}
          onChange={handleDocInputChange}
          placeholder="Nhập mô tả chi tiết về tài liệu"
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
            value={documentForm.category}
            onChange={handleDocInputChange}
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
            value={documentForm.instructor}
            onChange={handleDocInputChange}
            placeholder="Tên giảng viên"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={docTags}
            onChange={(e) => setDocTags(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocTag())}
            placeholder="Thêm tag và nhấn Enter"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <button
            onClick={addDocTag}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
          >
            <Plus size={18} />
          </button>
        </div>
        {documentForm.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {documentForm.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2 border border-indigo-200"
              >
                {tag}
                <button
                  onClick={() => removeDocTag(tag)}
                  className="hover:text-indigo-900"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tải Lên File</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition cursor-pointer relative group">
            <input
              type="file"
              onChange={(e) => handleDocFileChange(e, 'thumbnail')}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
            />
            <div className="text-center pointer-events-none">
              <Upload className="mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 transition" size={32} />
              <p className="text-sm text-gray-700 font-medium">Hình Thumbnail</p>
              <p className="text-xs text-gray-500 mt-1">{documentForm.thumbnail || 'Chọn ảnh'}</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition cursor-pointer relative group">
            <input
              type="file"
              onChange={(e) => handleDocFileChange(e, 'document')}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx"
            />
            <div className="text-center pointer-events-none">
              <Upload className="mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 transition" size={32} />
              <p className="text-sm text-gray-700 font-medium">File Tài Liệu</p>
              <p className="text-xs text-gray-500 mt-1">{documentForm.document || 'Chọn file'}</p>
            </div>
          </div>
        </div>
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
          Lưu Tài Liệu
        </button>
      </div>
    </div>
  );
};