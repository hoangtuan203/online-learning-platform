package com.learning.notification_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.notification_service.dto.NotificationEventDTO;
import com.learning.notification_service.entity.Notification;
import com.learning.notification_service.entity.NotificationType;
import com.learning.notification_service.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;  // Inject để gửi WebSocket

    private final ObjectMapper objectMapper = new ObjectMapper();


    @Transactional
    public Notification createNotification(String userId, NotificationType type, String title, String message, String link, Map<String, Object> data) {
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setType(type);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setLink(link);
        notif.setData(data);  // Sử dụng method từ entity để set JSON

        Notification saved = notificationRepository.save(notif);
        log.info("Created notification {} for user {}", saved.getId(), userId);

        messagingTemplate.convertAndSendToUser(userId, "/notifications", saved);
        return saved;
    }

    @KafkaListener(topics = "question-answered-topic", groupId = "notification-group")
    public void handleQuestionAnsweredEvent(NotificationEventDTO event) {
        if (!"QUESTION_ANSWERED".equals(event.getType())) {
            log.warn("Unexpected event type: {}", event.getType());
            return;
        }

        String userId = event.getTargetUserId().toString();
        String title = "Câu hỏi của bạn đã được trả lời!";
        String message = event.getMessage();  // Từ event: "Câu hỏi của bạn đã được trả lời bởi [Tên]"
        String link = "/qa/question/" + event.getQuestionId();  // Link redirect đến Q&A page

        Map<String, Object> data = new HashMap<>();
        data.put("questionId", event.getQuestionId());
        data.put("answerId", event.getAnswerId());
        data.put("answererName", event.getAnswererName());
        data.put("timestamp", event.getTimestamp());

        // Tạo và gửi notification (sẽ trigger WebSocket)
        createNotification(userId, NotificationType.QA_REPLY, title, message, link, data);
    }

    public List<Notification> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }


    @Transactional
    public void markAsRead(Long id, String userId) {
        notificationRepository.markAsRead(id, userId);
    }


    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional  // Đảm bảo transaction cho batch create
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
                        Map.of("progress", progress, "courseName", courseName)
                );
            }
        }
    }


    private List<Map<String, Object>> getLowProgressUsers() {
        // TODO: Implement real logic, e.g., via RestTemplate or FeignClient
        // Ví dụ:
        // RestTemplate restTemplate = new RestTemplate();
        // ResponseEntity<List<Map>> response = restTemplate.getForEntity("http://enrollment-service/enrollments/low-progress", List.class);
        // return response.getBody();
        log.info("Sending progress reminders - implement getLowProgressUsers()");
        return List.of();  // Trả về empty tạm thời
    }
}