
export interface EnrollmentRequest {
  userId: number;
  courseId: number;  
}

export interface EnrollResponse {
  message: string;
  enrollmentId: string | null;  
}


export interface Enrollment {
  id: string;
  userId: number | string;
  courseId: number | string;
  enrollmentDate: string; 
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  totalContentItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentStatus {
  status?: 'PENDING' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
}