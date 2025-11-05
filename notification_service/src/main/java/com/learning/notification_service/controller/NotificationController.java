package com.learning.notification_service.controller;

import com.learning.notification_service.entity.Notification;
import com.learning.notification_service.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam String userId) {
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getUnreadCount(@RequestParam String userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id, @RequestParam String userId) {
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc"));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead(@RequestParam String userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả"));
    }
}