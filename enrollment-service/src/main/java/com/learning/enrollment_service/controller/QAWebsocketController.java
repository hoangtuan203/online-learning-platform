package com.learning.enrollment_service.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class QAWebsocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public QAWebsocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/qa/enrollment/{enrollmentId}")
    public void relayClientEvent(@DestinationVariable String enrollmentId, @Payload Object event) {
        messagingTemplate.convertAndSend("/topic/qa/enrollment/" + enrollmentId, event);
    }

    @MessageMapping("/qa/course/{courseId}/content/{contentId}")
    public void relayCourseContentEvent(@DestinationVariable String courseId,
                                        @DestinationVariable String contentId,
                                        @Payload Object event) {
        messagingTemplate.convertAndSend("/topic/qa/course/" + courseId + "/content/" + contentId, event);
    }
}
