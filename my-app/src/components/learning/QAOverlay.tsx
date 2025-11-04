import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { X, MessageCircle, MoreHorizontal, ThumbsUp, Send } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import DOMPurify from "dompurify";
import { QAService } from "../../service/QAService";
import type {
  QAResponse,
  QuestionResponse,
  AnswerResponse,
} from "../../service/QAService";
import { connectQaRealtime } from "../../utils/qaRealtime";
import type { User } from "../../types/User";
import { toast } from "react-toastify";

interface AnswerItem {
  id: number;
  answerText: string;
  answererName: string;
  createdAt: string;
  answererUsername?: string;
  parentId?: number;
  children: AnswerItem[];
  liked?: boolean;
  likeCount?: number;
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

const QAServiceInstance = new QAService();

// Sub-component: Render Avatar
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
    return avatar ? (
      <img
        src={avatar}
        alt={name || "user"}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    ) : (
      <div
        className={`${className} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-xs font-medium text-gray-500">
          {name?.charAt(0).toUpperCase() || "U"}
        </span>
      </div>
    );
  },
);

// Sub-component: Render Message Header
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
  }) => {
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
    return (
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
    );
  },
);

// Sub-component: Safe HTML Renderer
const SafeHtml = React.memo(({ html }: { html: string }) => {
  const safeHtml = (rawHtml: string) => {
    const sanitized = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ["loading"] });
    return sanitized.replace(/<img /g, '<img loading="lazy" ');
  };
  return (
    <div
      className="text-sm text-gray-800 prose prose-sm max-w-none prose-p:mb-1 prose-p:mt-0 text-left"
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
});

// Sub-component: AnswersList (Recursive)
const AnswersList = React.memo(
  ({
    answers,
    level = 0,
    questionId,
    openReplyForm,
    canInteract,
    onToggleLike,
  }: {
    answers: AnswerItem[];
    level?: number;
    questionId: number;
    openReplyForm: (qId: number, pId?: number, aName?: string) => void;
    canInteract: boolean;
    onToggleLike: (answerId: number) => Promise<void>;
  }) => (
    <div className={`space-y-3`} style={{ marginLeft: 12 + level * 16 }}>
      {answers.map((answer) => (
        <div key={answer.id} className="flex items-start gap-2">
          <Avatar avatar={undefined} name={answer.answererName} size="sm" />
          <div className="flex-1 min-w-0 space-y-1">
            <MessageHeader
              name={answer.answererName}
              username={answer.answererUsername}
              createdAt={answer.createdAt}
              isReply
            />
            <div className="rounded-xl p-2">
              <SafeHtml html={answer.answerText} />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
              <button
                className={`inline-flex items-center gap-1 hover:text-blue-600 border-none focus:outline-none transition-colors ${
                  answer.liked ? "text-blue-600" : ""
                }`}
                onClick={() => onToggleLike(answer.id)}
                disabled={!canInteract}
              >
                <ThumbsUp
                  className={`h-4 w-4 ${answer.liked ? "fill-current" : ""}`}
                />
                <span>{answer.likeCount || 0}</span>
              </button>
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
              />
            )}
          </div>
        </div>
      ))}
    </div>
  ),
);

// Sub-component: QuestionForm
interface QuestionFormProps {
  newQuestion: string;
  setNewQuestion: (val: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  canInteract: boolean;
  imageHandler: () => void;
  handlePaste: (e: ClipboardEvent) => void;
}

const QuestionForm = React.memo(
  ({
    newQuestion,
    setNewQuestion,
    onSubmit,
    isLoading,
    canInteract,
    imageHandler,
    handlePaste,
  }: QuestionFormProps) => {
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
      [imageHandler],
    );

    useEffect(() => {
      if (quillRef.current && !isEditorReady) {
        setIsEditorReady(true);
        const editor = quillRef.current?.getEditor();
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
        }
        return () => {
          if (editor?.root)
            editor.root.removeEventListener("paste", handlePaste);
        };
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
            onClick={() => {
              setNewQuestion("");
            }}
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
  },
);

// Sub-component: ReplyForm
interface ReplyFormProps {
  target: ReplyTarget | null;
  newAnswer: string;
  setNewAnswer: (val: string) => void;
  onSubmit: (qId: number) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  canInteract: boolean;
  imageHandler: () => void;
  handlePaste: (e: ClipboardEvent) => void;
}

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
  }: ReplyFormProps) => {
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
      [imageHandler],
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
        }
        return () => {
          if (editor?.root)
            editor.root.removeEventListener("paste", handlePaste);
        };
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
  },
);

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
  contentTitle = "",
}: QAOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyForm, setReplyForm] = useState<ReplyTarget | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const qaService = QAServiceInstance;
  const realtimeRef = useRef<{
    close: () => void;
    send?: (type: string, payload: any) => void;
  } | null>(null);
  const processedLikeCheckRef = useRef<{
    questions: Set<number>;
    answers: Set<number>;
  }>({
    questions: new Set<number>(),
    answers: new Set<number>(),
  });
  const loadLocalUser = useCallback((): User | null => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }, []);

  const canInteract = useMemo(
    () => isEnrolled && !!currentUser,
    [isEnrolled, currentUser],
  );

  const currentUserIdNum = useMemo(() => {
    const raw = currentUser?.id;
    const parsed = raw !== undefined ? Number(raw) : undefined;
    return typeof parsed === "number" && !Number.isNaN(parsed)
      ? parsed
      : undefined;
  }, [currentUser]);

  const compressAndInsertImage = useCallback((file: File, quill: any) => {
    return new Promise((resolve) => {
      if (file.size > 5000000) {
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
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const range = quill.getSelection();
          quill.insertEmbed(range?.index || 0, "image", compressedDataUrl);
          quill.setSelection(range?.index + 1 || 0);
          resolve(true);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const imageHandlerQuestion = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      console.warn("Use in sub-component");
    };
  }, []);

  const imageHandlerAnswer = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      console.warn("Use in sub-component");
    };
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent, quillRef: React.RefObject<ReactQuill>) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              const quillInstance = quillRef.current?.getEditor();
              if (quillInstance) {
                compressAndInsertImage(file, quillInstance);
              }
            }
          }
        }
      }
    },
    [compressAndInsertImage],
  );

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
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    },
    [],
  );

  const addAnswerToTree = useCallback(
    (
      answers: AnswerItem[],
      newAns: AnswerItem,
      parentId?: number,
    ): AnswerItem[] => {
      if (!parentId) return [...answers, newAns];
      return answers.map((ans) => {
        if (ans.id === parentId) {
          return { ...ans, children: [...ans.children, newAns] };
        } else {
          return {
            ...ans,
            children: addAnswerToTree(ans.children, newAns, parentId),
          };
        }
      });
    },
    [],
  );

  const verifyEnrollment = useCallback(async () => {
    if (!courseId || !userEnrollmentId || !currentUserIdNum) {
      setIsEnrolled(!!(courseId && userEnrollmentId));
      return;
    }
    try {
      setIsEnrolled(true);
    } catch {
      setIsEnrolled(false);
      toast.warning("Bạn chưa đăng ký khóa học này!");
    }
  }, [courseId, userEnrollmentId, currentUserIdNum]);

  useEffect(() => {
    const load = async () => {
      if (!courseId && !enrollmentId) return;
      await verifyEnrollment();
      if (!isEnrolled) {
        setQuestions([]);
        return;
      }
      try {
        setIsLoading(true);
        let data: QAResponse[] = [];
        if (courseId && currentContentId) {
          data = await qaService.getQAByContentInCourse(
            courseId,
            currentContentId,
            currentUserIdNum,
          );
        }
        const flatMapped = data.map(
          (item): QAItem => ({
            id: item.question.id,
            questionHtml: item.question.questionText || "",
            createdAt: item.question.createdAt,
            answers: item.answers.map((ans: AnswerResponse) => ({
              id: ans.id!,
              answerText: ans.answerText,
              answererName: ans.answererName || "Admin",
              createdAt: ans.createdAt,
              answererUsername: ans.answererUsername || "",
              parentId: ans.parentId,
              children: [],
              liked: ans.liked || false,
              likeCount: ans.likeCount || 0,
            })),
            authorName: item.question.authorName || "Anonymous",
            authorAvatar: item.question.authorAvatar || undefined,
            answered: item.answers.length > 0,
            liked: item.question.liked || false,
            likeCount: item.question.likeCount || 0,
          }),
        );
        const processed = flatMapped.map((q) => ({
          ...q,
          answers: buildTree(q.answers),
        }));
        processed.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    verifyEnrollment,
    buildTree,
    qaService,
    currentUserIdNum,
  ]);

  useEffect(() => {
    if (initialQuestions && !enrollmentId && !courseId) {
      try {
        const flatMapped = (initialQuestions as QAResponse[]).map(
          (item): QAItem => ({
            id: item.question.id,
            questionHtml: item.question.questionText || "",
            createdAt: item.question.createdAt,
            answers: item.answers.map((ans: AnswerResponse) => ({
              id: ans.id!,
              answerText: ans.answerText,
              answererName: ans.answererName || "Admin",
              createdAt: ans.createdAt,
              answererUsername: ans.answererUsername || "",
              parentId: ans.parentId,
              children: [],
              liked: ans.liked || false,
              likeCount: ans.likeCount || 0,
            })),
            authorName: item.question.authorName || "Anonymous",
            authorAvatar: item.question.authorAvatar || undefined,
            answered: item.answers.length > 0,
            liked: item.question.liked || false,
            likeCount: item.question.likeCount || 0,
          }),
        );
        const processed = flatMapped.map((q) => ({
          ...q,
          answers: buildTree(q.answers),
        }));
        processed.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setQuestions(processed);
      } catch {
        setQuestions([]);
      }
    }
  }, [initialQuestions, buildTree]);

  const updateAnswerLikeInTree = useCallback(
    (
      answers: AnswerItem[],
      answerId: number,
      liked: boolean,
      likeCount: number,
    ): AnswerItem[] => {
      return answers.map((ans) => {
        if (ans.id === answerId) {
          return { ...ans, liked, likeCount };
        }
        if (ans.children.length > 0) {
          return {
            ...ans,
            children: updateAnswerLikeInTree(
              ans.children,
              answerId,
              liked,
              likeCount,
            ),
          };
        }
        return ans;
      });
    },
    [],
  );

  useEffect(() => {
    if (!courseId || !currentContentId) return;

    // Batch realtime updates to minimize renders
    const eventQueueRef = { current: [] as any[] };
    const rafIdRef = { current: 0 as number | 0 };

    const flushQueue = () => {
      const events = eventQueueRef.current;
      eventQueueRef.current = [];
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
              };
              next = [newQaItem, ...next];
              // Keep optional toast lightweight
              // toast.info("Có câu hỏi mới!", { autoClose: 1500, pauseOnHover: false });
            } else if (evt.type === "ANSWER_CREATED") {
              const newAns: AnswerItem = {
                id: evt.payload.answerId || 0,
                answerText: evt.payload.answerText || evt.payload.answer || "",
                answererName: evt.payload.answererName || "Admin",
                createdAt: evt.payload.createdAt || new Date().toISOString(),
                answererUsername: evt.payload.answererUsername || "",
                parentId: evt.payload.parentAnswerId,
                children: [],
                liked: false,
                likeCount: 0,
              };
              next = next.map((q) =>
                q.id === evt.payload.questionId
                  ? {
                      ...q,
                      answers: addAnswerToTree(
                        q.answers,
                        newAns,
                        evt.payload.parentAnswerId,
                      ),
                      answered: true,
                    }
                  : q,
              );
              // toast.success("Có câu trả lời mới!", { autoClose: 1500, pauseOnHover: false });
            } else if (evt.type === "QUESTION_LIKE_TOGGLED") {
              const { questionId, liked, likeCount } = evt.payload;
              next = next.map((q) =>
                q.id === questionId ? { ...q, liked, likeCount } : q,
              );
            } else if (evt.type === "ANSWER_LIKE_TOGGLED") {
              const { answerId, liked, likeCount } = evt.payload;
              next = next.map((q) => ({
                ...q,
                answers: updateAnswerLikeInTree(
                  q.answers,
                  answerId,
                  liked,
                  likeCount,
                ),
              }));
            }
          }
          return next;
        });
      });
    };

    const enqueue = (evt: any) => {
      eventQueueRef.current.push(evt);
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = 0;
          flushQueue();
        });
      }
    };

    const realtimeConnection = connectQaRealtime({
      courseId,
      contentId: currentContentId,
      onEvent: (evt) => enqueue(evt),
      debug: false,
    });

    (realtimeRef.current as any) = realtimeConnection;

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      realtimeConnection.close();
      realtimeRef.current = null;
    };
  }, [courseId, currentContentId, addAnswerToTree, updateAnswerLikeInTree]);

  useEffect(() => {
    setCurrentUser(loadLocalUser());
  }, [loadLocalUser]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Reset processed like cache when user changes
  useEffect(() => {
    processedLikeCheckRef.current = {
      questions: new Set<number>(),
      answers: new Set<number>(),
    };
  }, [currentUserIdNum]);

  // Check like status for questions and answers for current user and update UI
  useEffect(() => {
    if (!currentUserIdNum || questions.length === 0) return;

    let cancelled = false;

    const collectAnswerIds = (
      answers: AnswerItem[],
      acc: number[] = [],
    ): number[] => {
      for (const ans of answers) {
        if (!processedLikeCheckRef.current.answers.has(ans.id)) {
          acc.push(ans.id);
        }
        if (ans.children && ans.children.length > 0) {
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
          collectAnswerIds(q.answers),
        );

        if (questionIdsToCheck.length === 0 && answerIdsToCheck.length === 0)
          return;

        const [questionStatuses, answerStatuses] = await Promise.all([
          Promise.all(
            questionIdsToCheck.map(async (qid) => {
              try {
                const liked = await qaService.checkQuestionLikeStatus(
                  qid,
                  currentUserIdNum,
                );
                return { id: qid, liked };
              } catch {
                return { id: qid, liked: false };
              }
            }),
          ),
          Promise.all(
            answerIdsToCheck.map(async (aid) => {
              try {
                const liked = await qaService.checkAnswerLikeStatus(
                  aid,
                  currentUserIdNum,
                );
                return { id: aid, liked };
              } catch {
                return { id: aid, liked: false };
              }
            }),
          ),
        ]);

        if (cancelled) return;

        const questionLikedMap = new Map(
          questionStatuses.map((s) => [s.id, s.liked]),
        );
        const answerLikedMap = new Map(
          answerStatuses.map((s) => [s.id, s.liked]),
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
                    ans.children && ans.children.length > 0
                      ? updateAnswers(ans.children)
                      : ans.children,
                }));
              return { ...q, liked: qLiked, answers: updateAnswers(q.answers) };
            }),
          );

          // Mark processed
          questionLikedMap.forEach((_, id) =>
            processedLikeCheckRef.current.questions.add(id),
          );
          answerLikedMap.forEach((_, id) =>
            processedLikeCheckRef.current.answers.add(id),
          );
        }
      } catch {
        // silent fail - UI just won't pre-color likes
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [questions, currentUserIdNum, qaService]);

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
          userId: currentUserIdNum || 0,
          authorUsername: currentUser?.username,
          answered: false,
          liked: created.liked || false,
          likeCount: created.likeCount || 0,
        };
        setQuestions((prev) => [newQaItem, ...prev]);
        // Publish realtime event
        realtimeRef.current?.send?.("QUESTION_CREATED", {
          id: created.id,
          questionText: created.questionText || created.question || newQuestion,
          createdAt: created.createdAt,
          askerName: created.authorName || currentUser?.name || "Anonymous",
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
    qaService,
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
          createdAt: created.createdAt || new Date().toISOString(),
          answererUsername: currentUser?.username || "",
          parentId: parentAnswerId,
          children: [],
          liked: created.liked || false,
          likeCount: created.likeCount || 0,
        };
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: addAnswerToTree(q.answers, newAns, parentAnswerId),
                  answered: true,
                }
              : q,
          ),
        );
        // Publish realtime event
        realtimeRef.current?.send?.("ANSWER_CREATED", {
          answerId: created.id,
          questionId,
          answerText: created.answerText,
          answererName: created.answererName || currentUser?.name || "Admin",
          answererUsername: currentUser?.username || "",
          parentAnswerId: parentAnswerId,
          createdAt: created.createdAt || new Date().toISOString(),
        });
        setNewAnswer("");
        setReplyForm(null);
        toast.success("Câu trả lời đã được gửi!");
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể gửi câu trả lời. Vui lòng thử lại!",
        );
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [
      newAnswer,
      replyForm,
      currentUser,
      qaService,
      addAnswerToTree,
      canInteract,
    ],
  );

  const openReplyForm = useCallback(
    (questionId: number, parentAnswerId?: number, authorName?: string) => {
      setReplyForm({
        questionId,
        parentAnswerId,
        authorName: authorName || "Người dùng",
      });
      const mention = ``;
      setNewAnswer(mention);
    },
    [],
  );

  const closeReplyForm = useCallback(() => {
    setReplyForm(null);
    setNewAnswer("");
  }, []);

  // Handle toggle like for question
  const handleToggleQuestionLike = useCallback(
    async (questionId: number) => {
      if (!canInteract || !currentUserIdNum) {
        toast.warning("Bạn cần đăng nhập để thích câu hỏi!");
        return;
      }

      try {
        const result = await qaService.toggleQuestionLike(
          questionId,
          currentUserIdNum,
        );

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId 
              ? { ...q, liked: result.liked, likeCount: result.likeCount }
              : q,
          ),
        );
        realtimeRef.current?.send?.("QUESTION_LIKE_TOGGLED", {
          questionId,
          liked: result.liked,
          likeCount: result.likeCount,
        });
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể thích câu hỏi. Vui lòng thử lại!",
        );
      }
    },
    [canInteract, currentUserIdNum, qaService],
  );

  // Handle toggle like for answer
  const handleToggleAnswerLike = useCallback(
    async (answerId: number) => {
      if (!canInteract || !currentUserIdNum) {
        toast.warning("Bạn cần đăng nhập để thích câu trả lời!");
        return;
      }

      try {
        const result = await qaService.toggleAnswerLike(
          answerId,
          currentUserIdNum,
        );

        // Helper function to update answer in nested structure
        const updateAnswerLike = (answers: AnswerItem[]): AnswerItem[] => {
          return answers.map((ans) => {
            if (ans.id === answerId) {
              return {
                ...ans,
                liked: result.liked,
                likeCount: result.likeCount,
              };
            }
            if (ans.children.length > 0) {
              return { ...ans, children: updateAnswerLike(ans.children) };
            }
            return ans;
          });
        };

        setQuestions((prev) =>
          prev.map((q) => ({
            ...q,
            answers: updateAnswerLike(q.answers),
          })),
        );
        // Publish realtime event
        realtimeRef.current?.send?.("ANSWER_LIKE_TOGGLED", {
          answerId,
          liked: result.liked,
          likeCount: result.likeCount,
        });
      } catch (error: any) {
        toast.error(
          error?.message || "Không thể thích câu trả lời. Vui lòng thử lại!",
        );
      }
    },
    [canInteract, currentUserIdNum, qaService],
  );

  const memoizedQuestions = useMemo(() => questions, [questions]);

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
                  Hỏi đáp -{" "}
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
              handlePaste={(e) =>
                handlePaste(e, { current: { getEditor: () => null } as any })
              }
            />
          )}

          <div className="flex items-center justify-between text-sm mb-4">
            <div className="font-medium text-gray-900">
              {memoizedQuestions.length} câu hỏi
            </div>
          </div>

          <div className="space-y-6">
            {isLoading && memoizedQuestions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Đang tải câu hỏi...
              </div>
            ) : memoizedQuestions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {!isEnrolled
                  ? "Đăng ký khóa học để xem hỏi đáp!"
                  : "Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!"}
              </div>
            ) : (
              memoizedQuestions.map((q) => (
                <div key={q.id} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar avatar={q.authorAvatar} name={q.authorName} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between ml-2">
                        <MessageHeader
                          name={q.authorName || "Người dùng"}
                          username={q.authorUsername}
                          createdAt={q.createdAt}
                        />
                        <button
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                          onClick={() =>
                            onUpdateQuestion?.(q.id, q.questionHtml)
                          }
                          title="Tùy chọn"
                          disabled={!canInteract}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="rounded-2xl pl-2 pb-2">
                        <SafeHtml html={q.questionHtml} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 ml-2">
                        <button
                          className={`inline-flex items-center gap-1 hover:text-blue-600 focus:outline-none transition-colors ${
                            q.liked ? "text-blue-600" : ""
                          }`}
                          onClick={() => handleToggleQuestionLike(q.id)}
                          disabled={!canInteract}
                        >
                          <ThumbsUp
                            className={`h-4 w-4 ${
                              q.liked ? "fill-current" : ""
                            }`}
                          />
                          <span>{q.likeCount || 0}</span>
                        </button>
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
                          handlePaste={(e) =>
                            handlePaste(e, {
                              current: { getEditor: () => null } as any,
                            })
                          }
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
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
