export interface Instructor {
  id: number;
  username: string;
  fullName: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  price: number;
  thumbnailUrl?: string;
  category?: string;
  instructor: Instructor;
  createdAt: string;
}

export interface CoursePage {
  content: Course[];
  totalElements: number;
  totalPages: number;
}

export interface CourseCardProps extends Course {
  hours: number;  
  lessons: number;  
  level: string;  
  rating?: number;
}