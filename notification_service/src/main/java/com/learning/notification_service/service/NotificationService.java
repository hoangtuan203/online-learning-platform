package com.learning.notification_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.notification_service.entity.Notification;
import com.learning.notification_service.entity.NotificationType;
import com.learning.notification_service.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private  NotificationRepository notificationRepository;

    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Notification createNotification(String userId, NotificationType type, String title, String message, String link, Map<String, Object> data) {
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setType(type);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setLink(link);
        if (data != null && !data.isEmpty()) {
            try {
                notif.setDataJson(objectMapper.writeValueAsString(data));
            } catch (Exception e) {
                throw new RuntimeException("Lỗi convert Map to JSON", e);
            }
        } else {
            notif.setDataJson(null);
        }
        Notification saved = notificationRepository.save(notif);

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, saved);
        return saved;
    }

    public List<Notification> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long id, String userId) {
        notificationRepository.markAsRead(id, userId);
    }

    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Scheduled(cron = "0 0 8 * * ?")
    public void sendProgressReminders() {
        List<Map<String, Object>> lowProgressUsers = getLowProgressUsers();
        for (Map<String, Object> userData : lowProgressUsers) {
            String userId = (String) userData.get("userId");
            int progress = (Integer) userData.get("progress");
            String courseName = (String) userData.get("courseName");
            if (progress < 80) {
                createNotification(
                        userId,
                        NotificationType.PROGRESS_REMINDER,
                        "Nhắc nhở tiến độ học",
                        String.format("Bạn đã hoàn thành %d%% khóa '%s'. Hãy tiếp tục!", progress, courseName),
                        "/courses/" + courseName,
                        Map.of("progress", progress)
                );
            }
        }
    }

    private List<Map<String, Object>> getLowProgressUsers() {
        return List.of();
    }
}
