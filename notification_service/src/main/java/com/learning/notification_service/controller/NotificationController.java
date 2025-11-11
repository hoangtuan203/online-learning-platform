package com.learning.notification_service.controller;

import com.learning.notification_service.dto.NotificationCreateRequest;
import com.learning.notification_service.entity.Notification;
import com.learning.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.antlr.v4.runtime.misc.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@Slf4j
@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NotificationController {
    @Autowired
    private NotificationService notificationService;
    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotification(@RequestBody NotificationCreateRequest request) {
        try {
            Notification saved = notificationService.createNotification(
                    request.getUserId(),
                    request.getType(),
                    request.getTitle(),
                    request.getMessage(),
                    request.getLink(),
                    request.getData()
            );
            log.info("Created notification via API for user: {}", request.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Tạo notification thành công",
                            "id", saved.getId(),
                            "createdAt", saved.getCreatedAt()
                    ));
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi tạo: " + e.getMessage()));
        }
    }


    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam @NotNull String userId) {
        try {
            List<Notification> notifications = notificationService.getNotifications(userId);
            log.debug("Fetched {} notifications for user: {}", notifications.size(), userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/count")
    public ResponseEntity<Long> getUnreadCount(@RequestParam @NotNull String userId) {
        try {
            long count = notificationService.getUnreadCount(userId);
            log.debug("Unread count for user {}: {}", userId, count);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error counting unread for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(0L);
        }
    }


    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id, @RequestParam @NotNull String userId) {
        try {
            notificationService.markAsRead(id, userId);
            log.info("Marked as read: ID {} for user {}", id, userId);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc thành công"));
        } catch (Exception e) {
            log.error("Error marking read for ID {} user {}: {}", id, userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Notification không tồn tại hoặc không thuộc user"));
        }
    }


    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead(@RequestParam @NotNull String userId) {
        try {
            notificationService.markAllAsRead(userId);
            log.info("Marked all as read for user {}", userId);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả đã đọc"));
        } catch (Exception e) {
            log.error("Error marking all read for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi cập nhật"));
        }
    }
}