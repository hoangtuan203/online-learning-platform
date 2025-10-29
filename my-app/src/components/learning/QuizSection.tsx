// src/components/learning/QuizSection.tsx
interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface QuizResult {
  score: number;
  total: number;
  answers: boolean[];
}

interface QuizSectionProps {
  questions: QuizQuestion[];
  quizAnswers: number[] | null;
  quizResult: QuizResult | null;
  onQuizChange: (qIndex: number, oIndex: number) => void;
  onQuizSubmit: () => void;
}

export default function QuizSection({
  questions,
  quizAnswers,
  quizResult,
  onQuizChange,
  onQuizSubmit,
}: QuizSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Bài kiểm tra</h3>
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
          <p className="font-medium text-gray-900 mb-4">{question.questionText}</p>
          <div className="space-y-2">
            {question.options.map((option, oIndex) => (
              <label
                key={oIndex}
                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`q${qIndex}`}
                  value={oIndex}
                  checked={quizAnswers?.[qIndex] === oIndex}
                  onChange={() => onQuizChange(qIndex, oIndex)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
          {quizResult && (
            <div
              className={`mt-4 p-2 rounded text-sm ${
                quizResult.answers[qIndex]
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {quizResult.answers[qIndex]
                ? "Đúng!"
                : `Sai. Đáp án đúng là: ${question.options[question.correctOptionIndex]}`}
            </div>
          )}
        </div>
      ))}
      {!quizResult && (
        <button
          onClick={onQuizSubmit}
          disabled={
            !(quizAnswers && quizAnswers.length === questions.length)
          }
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Nộp bài
        </button>
      )}
      {quizResult && (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <h4 className="text-lg font-semibold">
            Kết quả: {quizResult.score}/{quizResult.total}
          </h4>
          <p className="text-sm text-gray-600 mt-2">
            Bạn đã hoàn thành {Math.round((quizResult.score / quizResult.total) * 100)}%!
          </p>
        </div>
      )}
    </div>
  );
}