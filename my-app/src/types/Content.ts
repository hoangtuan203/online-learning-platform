
export interface QuizQuestion {
  questionText: string;
  options: string[]; 
  correctOptionIndex: number; 
}

export enum ContentType {
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  QUIZ = "QUIZ",
}

export enum LevelType {
  EASY = "EASY",
  NORMAL = "NORMAL",
  HARD = "HARD",
}

export interface Content {
  id?: string | number; 
  title: string;
  description: string;
  type: ContentType;
  url?: string;
  duration?: number; 
  thumbnail?: string; 
  level?: LevelType; 
  tags?: string[]; 
  questions?: QuizQuestion[];
  courseId: string | number;
  createdAt?: string;
  updatedAt?: string; 
}

export interface ContentResponse {
  success: boolean;
  content?: Content;
  errorMessage?: string;
}