package com.learning.content_service.service;

import com.learning.content_service.client.CourseClient;
import com.learning.content_service.dto.CreateContentRequest;
import com.learning.content_service.entity.Content;
import com.learning.content_service.entity.ContentType;
import com.learning.content_service.repository.ContentRepository;
import jakarta.ws.rs.core.Application;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentService {
    private final ContentRepository contentRepository;
    private final CourseClient courseClient;


    private Mono<String> getTokenFromContext() {
        return Mono.deferContextual(ctx -> {
            ServerWebExchange exchange = ctx.get(ServerWebExchange.class);
            if (exchange != null) {
                String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    return Mono.just(authHeader.substring(7));
                }
            }
            return Mono.empty();
        });
    }
    public Mono<Content> createContent(CreateContentRequest request) {
        log.info("course id = "+ request.getCourseId());
        return getTokenFromContext()
                .switchIfEmpty(Mono.justOrEmpty(null))
                .flatMap(token -> Mono.fromCallable(() -> courseClient.getCourseById(request.getCourseId(), token))
                        .flatMap(course -> {

                            if (course == null) {
                                log.info("course title ="+ course.getTitle());
                                return Mono.error(new IllegalArgumentException("Course không tồn tại"));
                            }
                            Content content = new Content();
                            content.setTitle(request.getTitle());
                            content.setDescription(request.getDescription());
                            content.setType(ContentType.valueOf(String.valueOf(request.getType())));
                            content.setUrl(request.getUrl());
                            content.setDuration(request.getDuration());
                            content.setCourseId(request.getCourseId());
                            content.setCreatedAt(LocalDateTime.now());
                            return contentRepository.save(content);
                        }))
                .onErrorResume(e -> {
                    if (e.getMessage().contains("course-service") || e.getMessage().contains("GraphQL")) {
                        // Log or handle specific client errors if needed
                    }
                    return Mono.error(new IllegalArgumentException("Course không tồn tại"));
                });
    }

    public Mono<Content> getContentById(String id) {
        return contentRepository.findById(id)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Content không tồn tại")));
    }

    public Flux<Content> getContentsByCourse(Long courseId) {
        return contentRepository.findByCourseId(courseId);
    }

    public Flux<Content> findAllContents() {
        return contentRepository.findAll();
    }

    public Mono<Content> updateContent(String id, CreateContentRequest request) {
        return contentRepository.findById(id)
                .flatMap(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setDescription(request.getDescription());
                    existing.setType(ContentType.valueOf(String.valueOf(request.getType())));
                    existing.setUrl(request.getUrl());
                    existing.setDuration(request.getDuration());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return contentRepository.save(existing);
                })
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Content không tồn tại")));
    }

    public Mono<Void> deleteContent(String id) {
        return contentRepository.findById(id)
                .flatMap(existing -> contentRepository.deleteById(id))
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Content không tồn tại")));
    }
}
