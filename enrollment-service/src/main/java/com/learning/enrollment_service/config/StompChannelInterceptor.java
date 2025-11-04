package com.learning.enrollment_service.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class StompChannelInterceptor implements ChannelInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(StompChannelInterceptor.class);

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            logger.info("STOMP CONNECT accepted from session: {}", accessor.getSessionId());
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            logger.info("STOMP SUBSCRIBE to {}", accessor.getDestination());
        } else if (StompCommand.DISCONNECT.equals(command)) {
            logger.info("STOMP DISCONNECT from session: {}", accessor.getSessionId());
        }

        return message;
    }
}