package com.learning.content_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.content_service.client.CourseClient;
import com.learning.content_service.dto.CreateContentRequest;
import com.learning.content_service.entity.Content;
import com.learning.content_service.entity.ContentType;
import com.learning.content_service.entity.LevelType;
import com.learning.content_service.repository.ContentRepository;
import jakarta.ws.rs.core.Application;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.web.context.request.ServletRequestAttributes;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;


@Slf4j
@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final CourseClient courseClient;


    private Mono<String> getTokenFromContext() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .filter(Authentication::isAuthenticated)  // Chỉ lấy nếu authenticated
                .map(auth -> {
                    if (auth.getPrincipal() instanceof Jwt) {
                        Jwt jwt = (Jwt) auth.getPrincipal();
                        return "Bearer " + jwt.getTokenValue();
                    }
                    log.info("okkkk");
                    return (String) auth.getPrincipal();
                })
                .doOnNext(token -> log.debug("Service: Extracted token from context: {}", token.substring(0, 20) + "..."))
                .switchIfEmpty(Mono.empty());  // Empty nếu không authenticated
    }


    public Mono<Content> createContent(CreateContentRequest request) {
        log.info("Service: Starting createContent for courseId={}", request.getCourseId());

        return getTokenFromContext()
                .doOnNext(token -> log.info("Service: Token found: {}", token != null ? "present" : "null"))  // Log token status
                .switchIfEmpty(Mono.just("dummy-token"))  // ← FIX: Dùng dummy thay null để chain không empty
                .flatMap(token -> {
                    log.info("Service: Using token: {}...", token.substring(0, Math.min(10, token.length())));  // Log token dùng

                    return Mono.fromCallable(() -> courseClient.getCourseById(Long.valueOf(request.getCourseId()), token))
                            .subscribeOn(Schedulers.boundedElastic())  // Chạy async tránh block
                            .doOnSuccess(course -> log.info("Service: Course fetch: {}", course != null ? "found" : "NULL"))
                            .flatMap(course -> {
                                if (course == null) {
                                    log.error("Service: Course not found id={}", request.getCourseId());
                                    return Mono.error(new IllegalArgumentException("Course không tồn tại"));
                                }

                                log.info("Service: Course found: {}", course.getTitle());

                                ContentType contentType;
                                try {
                                    contentType = ContentType.valueOf(request.getType().toUpperCase());  // ← FIX: toUpperCase() safe
                                } catch (IllegalArgumentException e) {
                                    log.error("Service: Invalid type: {}", request.getType());
                                    return Mono.error(new IllegalArgumentException("Loại nội dung không hợp lệ: " + request.getType()));
                                }

                                Content content = new Content();
                                content.setTitle(request.getTitle());
                                content.setDescription(request.getDescription());
                                content.setType(contentType);
                                content.setUrl(request.getUrl());
                                content.setDuration(request.getDuration());
                                content.setCourseId(Long.valueOf(request.getCourseId()));
                                try {
                                    content.setLevel(LevelType.valueOf(request.getLevel().toUpperCase()));  // ← FIX: toUpperCase() safe
                                } catch (IllegalArgumentException e) {
                                    log.error("Service: Invalid level: {}", request.getLevel());
                                    return Mono.error(new IllegalArgumentException("Level không hợp lệ: " + request.getLevel()));
                                }
                                // ← FIX: Serialize tags to JSON nếu List<String>
                                ObjectMapper mapper = new ObjectMapper();
                                try {
                                    content.setTags(mapper.writeValueAsString(request.getTags()));  // → "[\"java\",\"springboot\"]"
                                } catch (Exception e) {
                                    log.warn("Service: Tags serialize error: {}", e.getMessage());
                                    content.setTags("[]");  // Fallback
                                }
                                content.setCreatedAt(LocalDateTime.now());

                                log.info("Service: Saving content: {}", content.getTitle());

                                return contentRepository.save(content)
                                        .doOnSuccess(saved -> log.info("Service: Save success id={}", saved.getId()))
                                        .doOnError(e -> log.error("Service: Save error: {}", e.getMessage()));
                            });
                })
                .doOnSuccess(content -> log.info("Service: createContent complete id={}", content.getId()))  // Log cuối success
                .doOnError(e -> log.error("Service: createContent error: {}", e.getMessage(), e));  // Log cuối error
    }

    public Mono<Content> getContentById(String contentId) {
        log.info("Fetching content with id = {}", contentId);

        return contentRepository.findById(contentId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Content không tồn tại")))
                .doOnError(e -> log.error("Error fetching content: {}", e.getMessage()));
    }

    public Flux<Content> getContentsByCourseId(String courseId) {
        log.info("Fetching contents for course id = {}", courseId);

        return contentRepository.findByCourseId(courseId)
                .doOnError(e -> log.error("Error fetching contents: {}", e.getMessage()));
    }

    public Mono<Content> updateContent(String contentId, CreateContentRequest request) {
        log.info("Updating content with id = {}", contentId);

        return contentRepository.findById(contentId)
                .flatMap(existingContent -> {
                    // Cập nhật các field
                    existingContent.setTitle(request.getTitle());
                    existingContent.setDescription(request.getDescription());
                    existingContent.setUrl(request.getUrl());
                    existingContent.setDuration(request.getDuration());
                    existingContent.setLevel(LevelType.valueOf(request.getLevel()));
                    existingContent.setTags(request.getTags().toString());
                    existingContent.setUpdatedAt(LocalDateTime.now());

                    if (request.getType() != null) {
                        try {
                            existingContent.setType(ContentType.valueOf(request.getType().toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            return Mono.error(new IllegalArgumentException("Loại nội dung không hợp lệ"));
                        }
                    }

                    return contentRepository.save(existingContent);
                })
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Content không tồn tại")))
                .doOnError(e -> log.error("Error updating content: {}", e.getMessage()));
    }

    public Mono<Void> deleteContent(String contentId) {
        log.info("Deleting content with id = {}", contentId);

        return contentRepository.deleteById(contentId)
                .doOnSuccess(v -> log.info("Content deleted successfully"))
                .doOnError(e -> log.error("Error deleting content: {}", e.getMessage()));
    }


    public Mono<Void> deleteContentsByCourseId(String courseId) {
        log.info("Deleting all contents for course id = {}", courseId);

        return contentRepository.deleteByCourseId(courseId)
                .doOnSuccess(v -> log.info("All contents for course deleted successfully"))
                .doOnError(e -> log.error("Error deleting contents: {}", e.getMessage()));
    }


    public Mono<Integer> getTotalDurationByCourseId(String courseId) {
        log.info("Calculating total duration for course id = {}", courseId);

        return contentRepository.findByCourseId(courseId)
                .map(Content::getDuration)
                .reduce(0, Integer::sum)
                .doOnSuccess(total -> log.info("Total duration for course: {} minutes", total));
    }


    public Flux<Content> getContentsByTypeAndCourseId(String courseId, ContentType type) {
        log.info("Fetching {} contents for course id = {}", type, courseId);

        return contentRepository.findByCourseIdAndType(courseId, type)
                .doOnError(e -> log.error("Error fetching contents by type: {}", e.getMessage()));
    }

    /**
     * Đếm số lượng contents trong course
     */
    public Mono<Long> countContentsByCourseId(String courseId) {
        log.info("Counting contents for course id = {}", courseId);

        return contentRepository.countByCourseId(courseId)
                .doOnSuccess(count -> log.info("Total contents in course: {}", count));
    }
}
