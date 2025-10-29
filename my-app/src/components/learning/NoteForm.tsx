import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Edit3 } from "lucide-react";

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface NoteFormProps {
  show: boolean;
  newNote: string;
  timestamp: number;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  contentTitle?: string;
}

export default function NoteForm({ show, newNote, timestamp, onChange, onSave, onCancel, isEditing = false, contentTitle }: NoteFormProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 transform transition-all duration-300 ease-in-out ${
      show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Edit3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Chỉnh sửa ghi chú' : `Thêm ghi chú tại ${formatTime(timestamp)}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditing 
                    ? contentTitle
                    : 'Ghi chú sẽ được lưu vào thời điểm hiện tại của video'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <ReactQuill
              theme="snow"
              value={newNote}
              onChange={onChange}
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
              placeholder="Nhập nội dung ghi chú của bạn tại đây..."
              className="bg-white rounded-lg"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onSave}
              disabled={!newNote.trim()}
              className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200
                flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? 'Cập nhật' : 'Lưu ghi chú'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}