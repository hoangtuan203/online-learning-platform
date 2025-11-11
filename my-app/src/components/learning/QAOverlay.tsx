import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import {
  X,
  MessageCircle,
  MoreHorizontal,
  ThumbsUp,
  Send,
  Edit2,
  Trash2,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import DOMPurify from "dompurify";
import { QAService } from "../../service/QAService";
import { NotificationService } from "../../service/NotificationService";
import type {
  QAResponse,
  QuestionResponse,
  AnswerResponse,
} from "../../service/QAService";
import { connectQaRealtime } from "../../utils/qaRealtime";
import type { User } from "../../types/User";
import { toast } from "react-toastify";

// ============ TYPES ============
interface AnswerItem {
  id: number;
  answerText: string;
  answererName: string;
  answererAvatar?: string; // THÊM FIELD MỚI: Avatar của người trả lời
  createdAt: string;
  answererUsername?: string;
  parentId?: number;
  children: AnswerItem[];
  liked?: boolean;
  likeCount?: number;
  answeredBy?: number; // Added for owner check
}

interface QAItem {
  id: number;
  questionHtml: string;
  createdAt: string;
  answers: AnswerItem[];
  authorName?: string;
  authorAvatar?: string;
  userId?: number;
  authorUsername?: string;
  answered?: boolean;
  liked?: boolean;
  likeCount?: number;
  askedBy?: number; // Added for owner check
}

interface ReplyTarget {
  questionId: number;
  parentAnswerId?: number;
  authorName: string;
}

interface QAOverlayProps {
  questions?: any[];
  onClose: () => void;
  title?: string;
  onUpdateQuestion?: (questionId: number, newText: string) => Promise<void>;
  onDeleteQuestion?: (questionId: number) => Promise<void>;
  onAskQuestion?: (question: string) => Promise<void>;
  enrollmentId?: number;
  userEnrollmentId?: number;
  currentContentId?: string;
  courseId?: number;
  contentTitle?: string;
}

// ============ CONSTANTS ============
const MAX_IMAGE_SIZE = 5000000;
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 600;
const IMAGE_QUALITY = 0.7;

const qaService = new QAService();
const notificationService = new NotificationService();

// ============ UTILITIES ============
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sanitizeHtml = (rawHtml: string) => {
  const sanitized = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ["loading"] });
  return sanitized.replace(/<img /g, '<img loading="lazy" ');
};

const loadUserFromStorage = (): User | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ============ HOOKS ============
const useImageCompression = () => {
  return useCallback((file: File, quill: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.warning("Ảnh quá lớn! Hãy chọn ảnh nhỏ hơn.");
        resolve(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          let { width, height } = img;
          if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
            const ratio = Math.min(
              MAX_IMAGE_WIDTH / width,
              MAX_IMAGE_HEIGHT / height
            );
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL(
            "image/jpeg",
            IMAGE_QUALITY
          );
          const range = quill.getSelection();
          quill.insertEmbed(range?.index || 0, "image", compressedDataUrl);
          quill.setSelection((range?.index || 0) + 1);
          resolve(true);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);
};

const useAnswerTree = () => {
  const buildTree = useCallback(
    (flatAnswers: AnswerItem[], parentId?: number): AnswerItem[] => {
      return flatAnswers
        .filter((ans) => ans.parentId === parentId)
        .map((ans) => ({
          ...ans,
          children: buildTree(flatAnswers, ans.id),
        }))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    },
    []
  );

  const addAnswerToTree = useCallback(
    (
      answers: AnswerItem[],
      newAns: AnswerItem,
      parentId?: number
    ): AnswerItem[] => {
      if (!parentId) return [...answers, newAns];

      return answers.map((ans) => {
        if (ans.id === parentId) {
          return { ...ans, children: [...ans.children, newAns] };
        }
        return {
          ...ans,
          children: addAnswerToTree(ans.children, newAns, parentId),
        };
      });
    },
    []
  );

  const updateAnswerInTree = useCallback(
    (
      answers: AnswerItem[],
      answerId: number,
      updates: Partial<AnswerItem>
    ): AnswerItem[] => {
      return answers.map((ans) => {
        if (ans.id === answerId) {
          return { ...ans, ...updates };
        }
        if (ans.children.length > 0) {
          return {
            ...ans,
            children: updateAnswerInTree(ans.children, answerId, updates),
          };
        }
        return ans;
      });
    },
    []
  );

  const removeAnswerFromTree = useCallback(
    (answers: AnswerItem[], answerId: number): AnswerItem[] => {
      return answers
        .filter((ans) => ans.id !== answerId)
        .map((ans) => ({
          ...ans,
          children: removeAnswerFromTree(ans.children, answerId),
        }));
    },
    []
  );

  return {
    buildTree,
    addAnswerToTree,
    updateAnswerInTree,
    removeAnswerFromTree,
  };
};

// ============ SUB-COMPONENTS ============
const Avatar = React.memo(
  ({
    avatar,
    name,
    size = "md",
  }: {
    avatar?: string;
    name?: string;
    size?: "sm" | "md";
  }) => {
    const className = size === "sm" ? "h-7 w-7" : "h-9 w-9";

    if (avatar) {
      return (
        <img
          src={avatar}
          alt={name || "user"}
          className={`${className} rounded-full object-cover flex-shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${className} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-xs font-medium text-gray-500">
          {name?.charAt(0).toUpperCase() || "U"}
        </span>
      </div>
    );
  }
);

const MessageHeader = React.memo(
  ({
    name,
    username,
    createdAt,
    isReply = false,
  }: {
    name: string;
    username?: string;
    createdAt: string;
    isReply?: boolean;
  }) => (
    <div className="flex items-center gap-2 mb-1">
      <span
        className={`text-sm font-semibold ${
          isReply ? "text-gray-800" : "text-gray-900"
        }`}
      >
        {name}
      </span>
      {username && <span className="text-sm text-blue-600">@{username}</span>}
      <span
        className={`text-xs ${isReply ? "text-gray-500" : "text-gray-500"}`}
      >
        {formatDate(createdAt)}
      </span>
    </div>
  )
);

const SafeHtml = React.memo(({ html }: { html: string }) => (
  <div
    className="text-sm text-gray-800 prose prose-sm max-w-none prose-p:mb-1 prose-p:mt-0 text-left"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
  />
));

const LikeButton = React.memo(
  ({
    liked,
    count,
    onClick,
    disabled,
  }: {
    liked?: boolean;
    count?: number;
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button
      className={`inline-flex items-center gap-1 hover:text-blue-600 border-none focus:outline-none transition-colors ${
        liked ? "text-blue-600" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{count || 0}</span>
    </button>
  )
);

// NEW: Dropdown Menu Component
const DropdownMenu = React.memo(
  ({
    isOpen,
    onEdit,
    onDelete,
    onClose,
  }: {
    isOpen: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
  }) => {
    useEffect(() => {
      if (isOpen) {
        const handleClickOutside = () => onClose();
        setTimeout(
          () => document.addEventListener("click", handleClickOutside),
          0
        );
        return () => document.removeEventListener("click", handleClickOutside);
      }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
        >
          <Edit2 className="h-4 w-4" />Sửa
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
        >
          <Trash2 className="h-4 w-4" />Xóa
        </button>
      </div>
    );
  }
);

const AnswersList = React.memo(
  ({
    answers,
    level = 0,
    questionId,
    openReplyForm,
    canInteract,
    onToggleLike,
    currentUserId,
    onEditAnswer,
    onDeleteAnswer,
  }: {
    answers: AnswerItem[];
    level?: number;
    questionId: number;
    openReplyForm: (qId: number, pId?: number, aName?: string) => void;
    canInteract: boolean;
    onToggleLike: (answerId: number) => Promise<void>;
    currentUserId?: number;
    onEditAnswer: (answerId: number, currentText: string) => void;
    onDeleteAnswer: (answerId: number) => void;
  }) => {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    return (
      <div className="space-y-3" style={{ marginLeft: 12 + level * 16 }}>
        {answers.map((answer) => {
          // Kiểm tra xem user hiện tại có phải là owner của answer không
          // Đảm bảo so sánh number với number (nếu answeredBy là string từ API, cast nó)
          const answeredByNum = answer.answeredBy
            ? Number(answer.answeredBy)
            : undefined;
          const isOwner =
            currentUserId !== undefined &&
            answeredByNum !== undefined &&
            currentUserId === answeredByNum;
          console.log(
            "Answer owner check:",
            answer.id,
            "answeredBy:",
            answer.answeredBy,
            "answeredByNum:",
            answeredByNum,
            "currentUserId:",
            currentUserId,
            "isOwner:",
            isOwner
          ); // Debug log cải thiện

          return (
            <div key={answer.id} className="flex items-start gap-2 ml-8">
              {/* SỬ DỤNG answererAvatar MỚI */}
              <Avatar
                avatar={answer.answererAvatar}
                name={answer.answererName}
                size="sm"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <MessageHeader
                    name={answer.answererName}
                    username={answer.answererUsername}
                    createdAt={answer.createdAt}
                    isReply
                  />
                  {isOwner && (
                    <div className="relative">
                      <button
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === answer.id ? null : answer.id
                          );
                        }}
                        title="Tùy chọn"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <DropdownMenu
                        isOpen={openMenuId === answer.id}
                        onEdit={() =>
                          onEditAnswer(answer.id, answer.answerText)
                        }
                        onDelete={() => onDeleteAnswer(answer.id)}
                        onClose={() => setOpenMenuId(null)}
                      />
                    </div>
                  )}
                </div>
                <div className="rounded-xl p-2">
                  <SafeHtml html={answer.answerText} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <LikeButton
                    liked={answer.liked}
                    count={answer.likeCount}
                    onClick={() => onToggleLike(answer.id)}
                    disabled={!canInteract}
                  />
                  <button
                    className="hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed border-none focus:outline-none"
                    onClick={() =>
                      openReplyForm(questionId, answer.id, answer.answererName)
                    }
                    disabled={!canInteract}
                  >
                    Trả lời
                  </button>
                </div>
                {answer.children.length > 0 && (
                  <AnswersList
                    answers={answer.children}
                    level={level + 1}
                    questionId={questionId}
                    openReplyForm={openReplyForm}
                    canInteract={canInteract}
                    onToggleLike={onToggleLike}
                    currentUserId={currentUserId}
                    onEditAnswer={onEditAnswer}
                    onDeleteAnswer={onDeleteAnswer}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

const QuestionForm = React.memo(
  ({
    newQuestion,
    setNewQuestion,
    onSubmit,
    isLoading,
    canInteract,
    imageHandler,
    handlePaste,
  }: {
    newQuestion: string;
    setNewQuestion: (val: string) => void;
    onSubmit: () => Promise<void>;
    isLoading: boolean;
    canInteract: boolean;
    imageHandler: () => void;
    handlePaste: (e: ClipboardEvent) => void;
  }) => {
    const quillRef = useRef<ReactQuill>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);

    const modules = useMemo(
      () => ({
        toolbar: {
          container: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
          handlers: { image: imageHandler },
        },
      }),
      [imageHandler]
    );

    useEffect(() => {
      if (quillRef.current && !isEditorReady) {
        setIsEditorReady(true);
        const editor = quillRef.current.getEditor();
        if (editor) {
          setTimeout(() => {
            editor.focus();
            const length = editor.getLength();
            editor.setSelection(length, 0);
          }, 0);
        }
      }

      if (isEditorReady) {
        const editor = quillRef.current?.getEditor();
        if (editor?.root) {
          editor.root.addEventListener("paste", handlePaste);
          return () => editor.root.removeEventListener("paste", handlePaste);
        }
      }
    }, [isEditorReady, handlePaste]);

    return (
      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">
        <div className="mb-3 text-sm font-medium text-gray-700">
          Nhập câu hỏi của bạn
        </div>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={newQuestion}
          onChange={setNewQuestion}
          placeholder="Viết nội dung câu hỏi..."
          className="bg-white mb-2"
          modules={modules}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setNewQuestion("")}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            onClick={onSubmit}
            disabled={!newQuestion.trim() || isLoading || !canInteract}
          >
            {isLoading ? "Đang gửi..." : "Gửi câu hỏi"}
          </button>
        </div>
      </div>
    );
  }
);

const ReplyForm = React.memo(
  ({
    target,
    newAnswer,
    setNewAnswer,
    onSubmit,
    onClose,
    isSubmitting,
    canInteract,
    imageHandler,
    handlePaste,
  }: {
    target: ReplyTarget | null;
    newAnswer: string;
    setNewAnswer: (val: string) => void;
    onSubmit: (qId: number) => Promise<void>;
    onClose: () => void;
    isSubmitting: boolean;
    canInteract: boolean;
    imageHandler: () => void;
    handlePaste: (e: ClipboardEvent) => void;
  }) => {
    const quillRef = useRef<ReactQuill>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);

    const modules = useMemo(
      () => ({
        toolbar: {
          container: [
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
          handlers: { image: imageHandler },
        },
      }),
      [imageHandler]
    );

    useEffect(() => {
      if (target && quillRef.current && !isEditorReady) {
        setIsEditorReady(true);
      }

      if (target && isEditorReady && newAnswer) {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          setTimeout(() => {
            editor.focus();
            const length = editor.getLength();
            editor.setSelection(length, 0);
          }, 0);
        }
      }
    }, [target, isEditorReady, newAnswer]);

    useEffect(() => {
      if (isEditorReady) {
        const editor = quillRef.current?.getEditor();
        if (editor?.root) {
          editor.root.addEventListener("paste", handlePaste);
          return () => editor.root.removeEventListener("paste", handlePaste);
        }
      }
    }, [isEditorReady, handlePaste]);

    if (!target) return null;

    return (
      <div className="border rounded-xl p-3 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
          <span>
            Trả lời{" "}
            <span className="font-medium text-blue-600">
              @{target.authorName}
            </span>
          </span>
          <button
            onClick={onClose}
            className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
            title="Hủy trả lời"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={newAnswer}
          onChange={setNewAnswer}
          placeholder="Nhập nội dung trả lời..."
          className="bg-white mb-2"
          modules={modules}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            onClick={() => target && onSubmit(target.questionId)}
            disabled={!newAnswer.trim() || isSubmitting || !canInteract}
          >
            <Send className="h-3 w-3" />
            {isSubmitting ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    );
  }
);

// ============ MAIN COMPONENT ============
export default function QAOverlay({
  questions: initialQuestions,
  onClose,
  title,
  onUpdateQuestion,
  onDeleteQuestion,
  onAskQuestion,
  enrollmentId,
  userEnrollmentId,
  currentContentId,
  courseId,
}: QAOverlayProps) {
  // State
  const [visible, setVisible] = useState(false);
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolled] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyForm, setReplyForm] = useState<ReplyTarget | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // NEW: States for edit/delete functionality
  const [openQuestionMenuId, setOpenQuestionMenuId] = useState<number | null>(
    null
  );
  const [editingQuestion, setEditingQuestion] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<{
    id: number;
    questionId: number;
    text: string;
  } | null>(null);

  // Refs
  const realtimeRef = useRef<{
    close: () => void;
    send?: (type: string, payload: any) => void;
  } | null>(null);
  const processedLikeCheckRef = useRef<{
    questions: Set<number>;
    answers: Set<number>;
  }>({
    questions: new Set(),
    answers: new Set(),
  });

  // Custom hooks
  const compressAndInsertImage = useImageCompression();
  const {
    buildTree,
    addAnswerToTree,
    updateAnswerInTree,
    removeAnswerFromTree,
  } = useAnswerTree();

  // Memoized values
  const canInteract = useMemo(
    () => isEnrolled && !!currentUser,
    [isEnrolled, currentUser]
  );

  const currentUserIdNum = useMemo(() => {
    const raw = currentUser?.id;
    const parsed = raw !== undefined ? Number(raw) : undefined;
    return typeof parsed === "number" && !Number.isNaN(parsed)
      ? parsed
      : undefined;
  }, [currentUser]);

  // Data transformation
  const transformQAResponse = useCallback((item: QAResponse): QAItem => {
    // Cast askedBy to number để đảm bảo so sánh đúng (nếu API trả string)
    const questionAskedByRaw = (item.question as any).askedBy;
    const questionAskedBy = questionAskedByRaw
      ? Number(questionAskedByRaw)
      : undefined;
    console.log(
      "Transform QA:",
      item.question.id,
      "askedByRaw:",
      questionAskedByRaw,
      "askedBy:",
      questionAskedBy
    ); // Debug log cải thiện
    const transformedAnswers = item.answers.map((ans: AnswerResponse) => {
      // Cast answeredBy to number để đảm bảo so sánh đúng
      const answeredByRaw = ans.answeredBy;
      const answeredBy = answeredByRaw ? Number(answeredByRaw) : undefined;
      console.log(
        "Transform Answer:",
        ans.id,
        "answeredByRaw:",
        answeredByRaw,
        "answeredBy:",
        answeredBy
      ); // Debug log cải thiện
      return {
        id: ans.id!,
        answerText: ans.answerText,
        answererName: ans.answererName || "Admin",
        answererAvatar: ans.answererAvatar || undefined, // THÊM PARSE AVATAR MỚI
        createdAt: ans.createdAt,
        answererUsername: ans.answererUsername || "",
        parentId: ans.parentId,
        children: [],
        liked: ans.liked || false,
        likeCount: ans.likeCount || 0,
        answeredBy, // Sử dụng version đã cast
      };
    });
    return {
      id: item.question.id,
      questionHtml: item.question.questionText || "",
      createdAt: item.question.createdAt,
      answers: transformedAnswers,
      authorName: item.question.authorName || "Anonymous",
      authorAvatar: item.question.authorAvatar || undefined,
      userId: questionAskedBy,
      authorUsername: item.question.authorName || undefined,
      answered: item.answers.length > 0,
      liked: item.question.liked || false,
      likeCount: item.question.likeCount || 0,
      askedBy: questionAskedBy, // Sử dụng version đã cast
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      if (!courseId && !enrollmentId) return;

      try {
        setIsLoading(true);
        let data: QAResponse[] = [];

        if (courseId && currentContentId) {
          data = await qaService.getQAByContentInCourse(
            courseId,
            currentContentId,
            currentUserIdNum
          );
        }

        const processed = data
          .map(transformQAResponse)
          .map((q) => ({ ...q, answers: buildTree(q.answers) }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setQuestions(processed);
      } catch (e) {
        console.error("Không thể tải danh sách hỏi đáp:", e);
        toast.error("Không thể tải danh sách hỏi đáp. Vui lòng thử lại!");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [
    courseId,
    enrollmentId,
    currentContentId,
    buildTree,
    currentUserIdNum,
    transformQAResponse,
  ]);

  // Load initial questions from props
  useEffect(() => {
    if (initialQuestions && !enrollmentId && !courseId) {
      try {
        const processed = (initialQuestions as QAResponse[])
          .map(transformQAResponse)
          .map((q) => ({ ...q, answers: buildTree(q.answers) }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setQuestions(processed);
      } catch {
        setQuestions([]);
      }
    }
  }, [
    initialQuestions,
    buildTree,
    enrollmentId,
    courseId,
    transformQAResponse,
  ]);

  // Realtime connection
  useEffect(() => {
    if (!courseId || !currentContentId) return;

    const eventQueue: any[] = [];
    let rafId = 0;

    const flushQueue = () => {
      const events = [...eventQueue];
      eventQueue.length = 0;

      if (events.length === 0) return;

      startTransition(() => {
        setQuestions((prev) => {
          let next = prev;

          for (const evt of events) {
            if (evt.type === "QUESTION_CREATED") {
              const newQaItem: QAItem = {
                id: evt.payload.id,
                questionHtml:
                  evt.payload.questionText || evt.payload.question || "",
                createdAt: evt.payload.createdAt || new Date().toISOString(),
                answers: [],
                authorName: evt.payload.askerName || "Anonymous",
                authorAvatar: undefined,
                answered: false,
                liked: false,
                likeCount: 0,
                userId: evt.payload.askedBy,
                askedBy: evt.payload.askedBy,
              };
              next = [newQaItem, ...next];
            } else if (evt.type === "ANSWER_CREATED") {
              const newAns: AnswerItem = {
                id: evt.payload.answerId || 0,
                answerText: evt.payload.answerText || evt.payload.answer || "",
                answererName: evt.payload.answererName || "Admin",
                answererAvatar: evt.payload.answererAvatar || undefined, // HỖ TRỢ AVATAR MỚI TRONG REALTIME (nếu cần)
                createdAt: evt.payload.createdAt || new Date().toISOString(),
                answererUsername: evt.payload.answererUsername || "",
                parentId: evt.payload.parentAnswerId,
                children: [],
                liked: false,
                likeCount: 0,
                answeredBy: evt.payload.answeredBy,
              };
              next = next.map((q) =>
                q.id === evt.payload.questionId
                  ? {
                      ...q,
                      answers: addAnswerToTree(
                        q.answers,
                        newAns,
                        evt.payload.parentAnswerId
                      ),
                      answered: true,
                    }
                  : q
              );
            } else if (evt.type === "QUESTION_LIKE_TOGGLED") {
              const { questionId, liked, likeCount } = evt.payload;
              next = next.map((q) =>
                q.id === questionId ? { ...q, liked, likeCount } : q
              );
            } else if (evt.type === "ANSWER_LIKE_TOGGLED") {
              const { answerId, liked, likeCount } = evt.payload;
              next = next.map((q) => ({
                ...q,
                answers: updateAnswerInTree(q.answers, answerId, {
                  liked,
                  likeCount,
                }),
              }));
            }
          }

          return next;
        });
      });
    };

    const enqueue = (evt: any) => {
      eventQueue.push(evt);
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          flushQueue();
        });
      }
    };

    const realtimeConnection = connectQaRealtime({
      courseId,
      contentId: currentContentId,
      onEvent: enqueue,
      debug: false,
    });

    realtimeRef.current = realtimeConnection as any;

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      realtimeConnection.close();
      realtimeRef.current = null;
    };
  }, [courseId, currentContentId, addAnswerToTree, updateAnswerInTree]);

  // Load current user
  useEffect(() => {
    setCurrentUser(loadUserFromStorage());
  }, []);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Check like status
  useEffect(() => {
    if (!currentUserIdNum || questions.length === 0) return;

    let cancelled = false;

    const collectAnswerIds = (
      answers: AnswerItem[],
      acc: number[] = []
    ): number[] => {
      for (const ans of answers) {
        if (!processedLikeCheckRef.current.answers.has(ans.id)) {
          acc.push(ans.id);
        }
        if (ans.children?.length > 0) {
          collectAnswerIds(ans.children, acc);
        }
      }
      return acc;
    };

    const run = async () => {
      try {
        const questionIdsToCheck = questions
          .map((q) => q.id)
          .filter((id) => !processedLikeCheckRef.current.questions.has(id));

        const answerIdsToCheck = questions.flatMap((q) =>
          collectAnswerIds(q.answers)
        );

        if (questionIdsToCheck.length === 0 && answerIdsToCheck.length === 0)
          return;

        const [questionStatuses, answerStatuses] = await Promise.all([
          Promise.all(
            questionIdsToCheck.map(async (qid) => {
              try {
                const liked = await qaService.checkQuestionLikeStatus(
                  qid,
                  currentUserIdNum
                );
                return { id: qid, liked };
              } catch {
                return { id: qid, liked: false };
              }
            })
          ),
          Promise.all(
            answerIdsToCheck.map(async (aid) => {
              try {
                const liked = await qaService.checkAnswerLikeStatus(
                  aid,
                  currentUserIdNum
                );
                return { id: aid, liked };
              } catch {
                return { id: aid, liked: false };
              }
            })
          ),
        ]);

        if (cancelled) return;

        const questionLikedMap = new Map(
          questionStatuses.map((s) => [s.id, s.liked])
        );
        const answerLikedMap = new Map(
          answerStatuses.map((s) => [s.id, s.liked])
        );

        if (questionLikedMap.size > 0 || answerLikedMap.size > 0) {
          setQuestions((prev) =>
            prev.map((q) => {
              const qLiked = questionLikedMap.has(q.id)
                ? questionLikedMap.get(q.id)!
                : q.liked || false;

              const updateAnswers = (answers: AnswerItem[]): AnswerItem[] =>
                answers.map((ans) => ({
                  ...ans,
                  liked: answerLikedMap.has(ans.id)
                    ? answerLikedMap.get(ans.id)!
                    : ans.liked || false,
                  children:
                    ans.children?.length > 0
                      ? updateAnswers(ans.children)
                      : ans.children,
                }));

              return { ...q, liked: qLiked, answers: updateAnswers(q.answers) };
            })
          );

          questionLikedMap.forEach((_, id) =>
            processedLikeCheckRef.current.questions.add(id)
          );
          answerLikedMap.forEach((_, id) =>
            processedLikeCheckRef.current.answers.add(id)
          );
        }
      } catch {
        // silent fail
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [questions, currentUserIdNum]);

  // Event handlers
  const handleAskQuestion = useCallback(async () => {
    if (!newQuestion.trim() || !canInteract) {
      toast.warning("Vui lòng nhập nội dung câu hỏi!");
      return;
    }

    if (!enrollmentId && !userEnrollmentId) {
      toast.error("Không thể gửi câu hỏi. Vui lòng thử lại!");
      return;
    }

    try {
      setIsLoading(true);
      let created: QuestionResponse | null = null;

      if (onAskQuestion) {
        await onAskQuestion(newQuestion);
      } else {
        const activeEnrollmentId = (userEnrollmentId ?? enrollmentId)!;
        created = await qaService.askQuestion(activeEnrollmentId, {
          contentId: currentContentId || "",
          questionText: newQuestion,
          askedBy: currentUserIdNum!,
          askedName: currentUser?.name || "",
        });
      }

      if (created) {
        const newQaItem: QAItem = {
          id: created.id,
          questionHtml: created.questionText || created.question || "",
          createdAt: created.createdAt,
          answers: [],
          authorName: created.authorName || currentUser?.name || "Anonymous",
          authorAvatar:
            created.authorAvatar || currentUser?.avatarUrl || undefined,
          userId: currentUserIdNum,
          authorUsername: currentUser?.username,
          answered: false,
          liked: created.liked || false,
          likeCount: created.likeCount || 0,
          askedBy: currentUserIdNum,
        };

        setQuestions((prev) => [newQaItem, ...prev]);

        realtimeRef.current?.send?.("QUESTION_CREATED", {
          id: created.id,
          questionText: created.questionText || created.question || newQuestion,
          createdAt: created.createdAt,
          askerName: created.authorName || currentUser?.name || "Anonymous",
          askedBy: currentUserIdNum,
        });
      }

      setNewQuestion("");
      setShowAskForm(false);
      toast.success("Câu hỏi của bạn đã được gửi!");
    } catch (error: any) {
      toast.error(error?.message || "Không thể gửi câu hỏi. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  }, [
    newQuestion,
    onAskQuestion,
    enrollmentId,
    userEnrollmentId,
    currentContentId,
    currentUser,
    currentUserIdNum,
    canInteract,
  ]);

  const handleAddAnswer = useCallback(
    async (questionId: number) => {
      if (!newAnswer.trim() || !canInteract) {
        toast.warning("Vui lòng nhập nội dung câu trả lời!");
        return;
      }

      try {
        setIsSubmittingAnswer(true);
        const parentAnswerId = replyForm?.parentAnswerId;
        const authorName = replyForm?.authorName || "Người dùng";
        const mentionHtml = `<span style="color: #2563eb; font-weight: 600;">@${authorName} </span>`;

        let fullAnswer = newAnswer;
        if (!fullAnswer.startsWith(mentionHtml)) {
          fullAnswer = mentionHtml + fullAnswer;
        }

        const created = await qaService.addAnswer(questionId, {
          answerText: fullAnswer,
          answeredBy: currentUserIdNum!,
          answererName: currentUser?.name || "",
          parentAnswerId,
        });

        const newAns: AnswerItem = {
          id: created.id!,
          answerText: created.answerText,
          answererName: created.answererName || currentUser?.name || "Admin",
          answererAvatar:
            created.answererAvatar || currentUser?.avatarUrl || undefined, // HỖ TRỢ AVATAR MỚI
          createdAt: created.createdAt || new Date().toISOString(),
          answererUsername: currentUser?.username || "",
          parentId: parentAnswerId,
          children: [],
          liked: created.liked || false,
          likeCount: created.likeCount || 0,
          answeredBy: currentUserIdNum,
        };

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: addAnswerToTree(q.answers, newAns, parentAnswerId),
                  answered: true,
                }
              : q
          )
        );

        realtimeRef.current?.send?.("ANSWER_CREATED", {
          answerId: created.id,
          questionId,
          answerText: created.answerText,
          answererName: created.answererName || currentUser?.name || "Admin",
          answererAvatar:
            created.answererAvatar || currentUser?.avatarUrl || undefined, // GỬI AVATAR TRONG REALTIME
          answererUsername: currentUser?.username || "",
          parentAnswerId: parentAnswerId,
          createdAt: created.createdAt || new Date().toISOString(),
          answeredBy: currentUserIdNum,
        });

        // Send notification
        const question = questions.find((q) => q.id === questionId);
        if (
          question &&
          question.userId &&
          question.userId !== currentUserIdNum
        ) {
          try {
            await notificationService.createNotification({
              userId: question.userId.toString(),
              type: "QA_REPLY",
              title: "Câu hỏi của bạn đã được trả lời!",
              message: `Người dùng ${
                currentUser?.name || "Anonymous"
              } đã trả lời câu hỏi của bạn.`,
              link: `/course/learning/questions/${questionId}`,
              data: {
                questionId,
                answerId: created.id,
                answererName: currentUser?.name || "Anonymous",
                timestamp: new Date().toISOString(),
              },
            });
          } catch (notifError) {
            console.error("Failed to create notification:", notifError);
          }
        }

        setNewAnswer("");
        setReplyForm(null);
        toast.success("Câu trả lời đã được gửi!");
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể gửi câu trả lời. Vui lòng thử lại!"
        );
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [
      newAnswer,
      replyForm,
      currentUser,
      currentUserIdNum,
      addAnswerToTree,
      canInteract,
      questions,
    ]
  );

  // NEW: Handle edit question (sử dụng onUpdateQuestion nếu có, fallback đến service)
  const handleEditQuestion = useCallback(
    async (questionId: number, newText: string) => {
      if (!newText.trim()) {
        toast.warning("Nội dung câu hỏi không được để trống!");
        return;
      }

      if (!enrollmentId && !userEnrollmentId) {
        toast.error("Không thể cập nhật câu hỏi. Vui lòng thử lại!");
        return;
      }

      try {
        let updatedText = newText; // Default fallback

        if (onUpdateQuestion) {
          await onUpdateQuestion(questionId, newText);
          // Giả sử onUpdateQuestion không return data, sử dụng newText trực tiếp
        } else {
          const activeEnrollmentId = (userEnrollmentId ?? enrollmentId)!;
          const updated = await qaService.updateQuestion(
            activeEnrollmentId,
            questionId,
            newText
          );
          updatedText = updated.questionText || updated.question || newText;
        }

        // Update state với text đã cập nhật
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, questionHtml: updatedText } : q
          )
        );

        setEditingQuestion(null);
        toast.success("Câu hỏi đã được cập nhật!");
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể cập nhật câu hỏi. Vui lòng thử lại!"
        );
      }
    },
    [enrollmentId, userEnrollmentId, onUpdateQuestion]
  );

  // NEW: Handle delete question (sử dụng onDeleteQuestion nếu có, fallback đến service)
  const handleDeleteQuestion = useCallback(
    async (questionId: number) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
        return;
      }

      if (!enrollmentId && !userEnrollmentId) {
        toast.error("Không thể xóa câu hỏi. Vui lòng thử lại!");
        return;
      }

      try {
        if (onDeleteQuestion) {
          await onDeleteQuestion(questionId);
        } else {
          const activeEnrollmentId = (userEnrollmentId ?? enrollmentId)!;
          await qaService.deleteQuestion(activeEnrollmentId, questionId);
        }

        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        toast.success("Câu hỏi đã được xóa!");
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể xóa câu hỏi. Vui lòng thử lại!"
        );
      }
    },
    [enrollmentId, userEnrollmentId, onDeleteQuestion]
  );

  // NEW: Handle edit answer
  const handleEditAnswer = useCallback(
    async (answerId: number, questionId: number, newText: string) => {
      if (!newText.trim()) {
        toast.warning("Nội dung câu trả lời không được để trống!");
        return;
      }

      if (!currentUserIdNum) {
        toast.error("Không thể cập nhật câu trả lời. Vui lòng thử lại!");
        return;
      }

      try {
        const updated = await qaService.updateAnswer(
          questionId,
          answerId,
          newText,
          currentUserIdNum
        );

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: updateAnswerInTree(q.answers, answerId, {
                    answerText: updated.answerText,
                  }),
                }
              : q
          )
        );

        setEditingAnswer(null);
        toast.success("Câu trả lời đã được cập nhật!");
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể cập nhật câu trả lời. Vui lòng thử lại!"
        );
      }
    },
    [currentUserIdNum, updateAnswerInTree]
  );

  // NEW: Handle delete answer
  const handleDeleteAnswer = useCallback(
    async (answerId: number, questionId: number) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa câu trả lời này?")) {
        return;
      }

      if (!currentUserIdNum) {
        toast.error("Không thể xóa câu trả lời. Vui lòng thử lại!");
        return;
      }

      try {
        await qaService.deleteAnswer(questionId, answerId, currentUserIdNum);

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: removeAnswerFromTree(q.answers, answerId),
                }
              : q
          )
        );

        toast.success("Câu trả lời đã được xóa!");
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể xóa câu trả lời. Vui lòng thử lại!"
        );
      }
    },
    [currentUserIdNum, removeAnswerFromTree]
  );

  const handleToggleQuestionLike = useCallback(
    async (questionId: number) => {
      if (!canInteract || !currentUserIdNum) {
        toast.warning("Bạn cần đăng nhập để thích câu hỏi!");
        return;
      }

      try {
        const result = await qaService.toggleQuestionLike(
          questionId,
          currentUserIdNum
        );

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, liked: result.liked, likeCount: result.likeCount }
              : q
          )
        );

        realtimeRef.current?.send?.("QUESTION_LIKE_TOGGLED", {
          questionId,
          liked: result.liked,
          likeCount: result.likeCount,
        });
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể thích câu hỏi. Vui lòng thử lại!"
        );
      }
    },
    [canInteract, currentUserIdNum]
  );

  const handleToggleAnswerLike = useCallback(
    async (answerId: number) => {
      if (!canInteract || !currentUserIdNum) {
        toast.warning("Bạn cần đăng nhập để thích câu trả lời!");
        return;
      }

      try {
        const result = await qaService.toggleAnswerLike(
          answerId,
          currentUserIdNum
        );

        setQuestions((prev) =>
          prev.map((q) => ({
            ...q,
            answers: updateAnswerInTree(q.answers, answerId, {
              liked: result.liked,
              likeCount: result.likeCount,
            }),
          }))
        );

        realtimeRef.current?.send?.("ANSWER_LIKE_TOGGLED", {
          answerId,
          liked: result.liked,
          likeCount: result.likeCount,
        });
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể thích câu trả lời. Vui lòng thử lại!"
        );
      }
    },
    [canInteract, currentUserIdNum, updateAnswerInTree]
  );

  const openReplyForm = useCallback(
    (questionId: number, parentAnswerId?: number, authorName?: string) => {
      setReplyForm({
        questionId,
        parentAnswerId,
        authorName: authorName || "Người dùng",
      });
      setNewAnswer("");
    },
    []
  );

  const closeReplyForm = useCallback(() => {
    setReplyForm(null);
    setNewAnswer("");
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
          }
        }
      }
    }
  }, []);

  const imageHandlerQuestion = useCallback(() => {
    console.warn("Image handler - use in sub-component");
  }, []);

  const imageHandlerAnswer = useCallback(() => {
    console.warn("Image handler - use in sub-component");
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute top-0 right-0 h-full w-full md:w-1/2 bg-white shadow-xl transform transition-transform duration-300 flex flex-col ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Hỏi đáp"
      >
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-md">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Hỏi đáp -
                </h3>
                <p className="text-lg text-gray-500">
                  {title || "Tất cả câu hỏi"}
                </p>
              </div>
              {!isEnrolled && (
                <p className="text-xs text-red-500">
                  Bạn chưa đăng ký khóa học này!
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {!showAskForm ? (
            <div className="flex items-start gap-3 mb-5">
              <Avatar
                avatar={currentUser?.avatarUrl}
                name={currentUser?.name}
              />
              <button
                onClick={() => setShowAskForm(true)}
                className="flex-1 flex items-center justify-between bg-gray-50 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canInteract}
              >
                <span className="text-sm">
                  {canInteract
                    ? "Viết câu hỏi của bạn..."
                    : "Đăng ký khóa học để hỏi đáp"}
                </span>
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <QuestionForm
              newQuestion={newQuestion}
              setNewQuestion={setNewQuestion}
              onSubmit={handleAskQuestion}
              isLoading={isLoading}
              canInteract={canInteract}
              imageHandler={imageHandlerQuestion}
              handlePaste={handlePaste}
            />
          )}

          <div className="flex items-center justify-between text-sm mb-4">
            <div className="font-medium text-gray-900">
              {questions.length} câu hỏi
            </div>
          </div>

          <div className="space-y-6">
            {isLoading && questions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Đang tải câu hỏi...
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {!isEnrolled
                  ? "Đăng ký khóa học để xem hỏi đáp!"
                  : "Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!"}
              </div>
            ) : (
              questions.map((q) => {
                const askedByNum = q.askedBy ? Number(q.askedBy) : undefined;
                const isQuestionOwnerPrimary =
                  currentUserIdNum !== undefined &&
                  askedByNum !== undefined &&
                  currentUserIdNum === askedByNum;
                const isQuestionOwnerFallback =
                  !isQuestionOwnerPrimary &&
                  currentUser &&
                  q.authorName === currentUser.name; // FALLBACK BY NAME
                const isQuestionOwner =
                  isQuestionOwnerPrimary || isQuestionOwnerFallback;

                if (isQuestionOwnerFallback) {
                  console.warn(
                    `Fallback owner check for question ${q.id} (askedBy missing, using name: ${q.authorName}) – fix backend!`
                  );
                }

                console.log(
                  "Question owner check:",
                  q.id,
                  "askedBy:",
                  q.askedBy,
                  "askedByNum:",
                  askedByNum,
                  "currentUserIdNum:",
                  currentUserIdNum,
                  "authorName match:",
                  q.authorName === currentUser?.name,
                  "isPrimary:",
                  isQuestionOwnerPrimary,
                  "isFallback:",
                  isQuestionOwnerFallback,
                  "final:",
                  isQuestionOwner
                );
                return (
                  <div key={q.id} className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar avatar={q.authorAvatar} name={q.authorName} />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between ml-2">
                          <MessageHeader
                            name={q.authorName || "Người dùng"}
                            createdAt={q.createdAt}
                          />
                          {isQuestionOwner && (
                            <div className="relative">
                              <button
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenQuestionMenuId(
                                    openQuestionMenuId === q.id ? null : q.id
                                  );
                                }}
                                title="Tùy chọn"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              <DropdownMenu
                                isOpen={openQuestionMenuId === q.id}
                                onEdit={() => {
                                  setEditingQuestion({
                                    id: q.id,
                                    text: q.questionHtml,
                                  });
                                  setOpenQuestionMenuId(null);
                                }}
                                onDelete={() => {
                                  handleDeleteQuestion(q.id);
                                  setOpenQuestionMenuId(null);
                                }}
                                onClose={() => setOpenQuestionMenuId(null)}
                              />
                            </div>
                          )}
                        </div>

                        {editingQuestion?.id === q.id ? (
                          <div className="border rounded-xl p-3 bg-gray-50">
                            <ReactQuill
                              theme="snow"
                              value={editingQuestion.text}
                              onChange={(val) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  text: val,
                                })
                              }
                              placeholder="Chỉnh sửa câu hỏi..."
                              className="bg-white mb-2"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                onClick={() => setEditingQuestion(null)}
                              >
                                Hủy
                              </button>
                              <button
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() =>
                                  handleEditQuestion(q.id, editingQuestion.text)
                                }
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="rounded-2xl pl-2 pb-2">
                              <SafeHtml html={q.questionHtml} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-2">
                              <LikeButton
                                liked={q.liked}
                                count={q.likeCount}
                                onClick={() => handleToggleQuestionLike(q.id)}
                                disabled={!canInteract}
                              />
                              <button
                                className="hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed border-none focus:outline-none"
                                onClick={() =>
                                  openReplyForm(q.id, undefined, q.authorName)
                                }
                                disabled={!canInteract}
                              >
                                Trả lời
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {replyForm?.questionId === q.id &&
                      !replyForm.parentAnswerId && (
                        <div className="ml-12">
                          <ReplyForm
                            target={replyForm}
                            newAnswer={newAnswer}
                            setNewAnswer={setNewAnswer}
                            onSubmit={handleAddAnswer}
                            onClose={closeReplyForm}
                            isSubmitting={isSubmittingAnswer}
                            canInteract={canInteract}
                            imageHandler={imageHandlerAnswer}
                            handlePaste={handlePaste}
                          />
                        </div>
                      )}

                    {q.answers.length > 0 && (
                      <AnswersList
                        answers={q.answers}
                        level={0}
                        questionId={q.id}
                        openReplyForm={openReplyForm}
                        canInteract={canInteract}
                        onToggleLike={handleToggleAnswerLike}
                        currentUserId={currentUserIdNum}
                        onEditAnswer={(answerId, currentText) => {
                          setEditingAnswer({
                            id: answerId,
                            questionId: q.id,
                            text: currentText,
                          });
                        }}
                        onDeleteAnswer={(answerId) =>
                          handleDeleteAnswer(answerId, q.id)
                        }
                      />
                    )}

                    {editingAnswer && editingAnswer.questionId === q.id && (
                      <div className="ml-12 border rounded-xl p-3 bg-gray-50">
                        <div className="mb-2 text-sm text-gray-600">
                          Chỉnh sửa câu trả lời
                        </div>
                        <ReactQuill
                          theme="snow"
                          value={editingAnswer.text}
                          onChange={(val) =>
                            setEditingAnswer({ ...editingAnswer, text: val })
                          }
                          placeholder="Chỉnh sửa câu trả lời..."
                          className="bg-white mb-2"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded"
                            onClick={() => setEditingAnswer(null)}
                          >
                            Hủy
                          </button>
                          <button
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() =>
                              handleEditAnswer(
                                editingAnswer.id,
                                editingAnswer.questionId,
                                editingAnswer.text
                              )
                            }
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
