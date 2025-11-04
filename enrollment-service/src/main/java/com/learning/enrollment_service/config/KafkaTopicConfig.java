package com.learning.enrollment_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.stereotype.Component;

@Component
public class KafkaTopicConfig {

    @Bean
    public NewTopic qaEventsTopic() {
        return TopicBuilder.name("qa-events")
                .partitions(3)
                .replicas(1)
                .build();
    }
}