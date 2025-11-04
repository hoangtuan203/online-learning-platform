import React, { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react'; // Nếu bạn dùng lucide-react

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lỗi trong QAOverlay:', error, errorInfo);
    // Bạn có thể gửi error lên logging service (như Sentry) ở đây nếu cần
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Có lỗi xảy ra trong phần Q&A
            </h3>
            <p className="text-gray-600 mb-4">
              Vui lòng thử lại hoặc liên hệ hỗ trợ. Chi tiết lỗi đã được ghi vào console.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;