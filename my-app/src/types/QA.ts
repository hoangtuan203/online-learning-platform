export interface QuestionRequest {
    contentId: string;
    questionText: string;
}

export interface AnswerRequest {
    answerText: string;
    answeredBy: number;
}

export interface QuestionResponse {
    id: number;
    contentId: string;
    questionText: string;
    answered: boolean;
    authorName?: string;
    authorAvatar?: string;
    createdAt: string;
}

export interface AnswerResponse {
    id: number;
    questionId: number;
    answerText: string;
    answeredBy: number;
    answererName?: string;
    createdAt: string;
}

export interface QAResponse {
    question: QuestionResponse;
    answer: AnswerResponse | null;
}