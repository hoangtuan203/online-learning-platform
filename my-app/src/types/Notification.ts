export const NotificationTypeValues = {
    PROGRESS_REMINDER: 'PROGRESS_REMINDER',
    QA_REPLY: 'QA_REPLY',
    OTHER: 'OTHER'
} as const;

export type NotificationType = typeof NotificationTypeValues[keyof typeof NotificationTypeValues];

export interface NotificationData {
    [key: string]: any;  
}

export interface NotificationResponse {
    id: number;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
    data?: NotificationData;  
}

export interface CreateNotificationRequest {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    data?: NotificationData;
}

export interface MarkReadResponse {
    message: string;
}
