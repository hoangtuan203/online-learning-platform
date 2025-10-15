export interface Instructor {
  id: number;
  username: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  price: number;
  thumbnailUrl?: string;
  instructor: Instructor;
  createdAt: string;
}

export interface CoursePage {
  content: Course[];
  totalElements: number;
  totalPages: number;
}
