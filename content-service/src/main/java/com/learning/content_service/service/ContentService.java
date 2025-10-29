package com.learning.content_service.service;

import com.cloudinary.Cloudinary;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.content_service.client.CourseClient;
import com.learning.content_service.dto.ContentResponse;
import com.learning.content_service.dto.CreateContentRequest;
import com.learning.content_service.entity.Content;
import com.learning.content_service.entity.ContentType;
import com.learning.content_service.entity.LevelType;
import com.learning.content_service.entity.QuizQuestion;
import com.learning.content_service.repository.ContentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.asm.TypeReference;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final CourseClient courseClient;
    private final Cloudinary cloudinary;


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
                .doOnNext(token -> log.info("Service: Token found: {}", token != null ? "present" : "null"))
                .switchIfEmpty(Mono.just("dummy-token"))
                .flatMap(token -> {
                    log.info("Service: Using token: {}...", token.substring(0, Math.min(10, token.length())));

                    return Mono.fromCallable(() -> courseClient.getCourseById(Long.valueOf(request.getCourseId())))
                            .subscribeOn(Schedulers.boundedElastic())
                            .doOnSuccess(course -> log.info("Service: Course fetch: {}", course != null ? "found" : "NULL"))
                            .flatMap(course -> {
                                if (course == null) {
                                    log.error("Service: Course not found id={}", request.getCourseId());
                                    return Mono.error(new IllegalArgumentException("Course không tồn tại"));
                                }

                                log.info("Service: Course found: {}", course.getTitle());

                                String trimmedTitle = request.getTitle() != null ? request.getTitle().trim() : "";
                                String trimmedDescription = request.getDescription() != null ? request.getDescription().trim() : "";
                                if (trimmedTitle.isEmpty()) {
                                    log.error("Service: Title is required and cannot be empty after trim");
                                    return Mono.error(new IllegalArgumentException("Tiêu đề không được để trống"));
                                }
                                if (trimmedDescription.isEmpty()) {
                                    log.error("Service: Description is required and cannot be empty after trim");
                                    return Mono.error(new IllegalArgumentException("Mô tả không được để trống"));
                                }

                                ContentType contentType;
                                try {
                                    contentType = ContentType.valueOf(request.getType().toUpperCase());
                                } catch (IllegalArgumentException e) {
                                    log.error("Service: Invalid type: {}", request.getType());
                                    return Mono.error(new IllegalArgumentException("Loại nội dung không hợp lệ: " + request.getType()));
                                }

                                switch (contentType) {
                                    case VIDEO:
                                        if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
                                            log.error("Service: Video requires URL");
                                            return Mono.error(new IllegalArgumentException("URL video bắt buộc"));
                                        }
                                        break;
                                    case DOCUMENT:
                                        if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
                                            log.error("Service: Document requires URL");
                                            return Mono.error(new IllegalArgumentException("URL tài liệu bắt buộc"));
                                        }
                                        if (request.getDuration() != null && request.getDuration() > 0) {
                                            log.warn("Service: Duration ignored for DOCUMENT type");
                                        }
                                        break;
                                    case QUIZ:
                                        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
                                            log.error("Service: Quiz requires at least one question");
                                            return Mono.error(new IllegalArgumentException("Quiz phải có ít nhất một câu hỏi"));
                                        }
                                        if (request.getUrl() != null && !request.getUrl().trim().isEmpty()) {
                                            log.warn("Service: URL ignored for QUIZ type");
                                        }
                                        for (QuizQuestion q : request.getQuestions()) {
                                            if (q.getQuestionText() == null || q.getQuestionText().trim().isEmpty()) {
                                                log.error("Service: Quiz question text required");
                                                return Mono.error(new IllegalArgumentException("Nội dung câu hỏi không được để trống"));
                                            }
                                            if (q.getOptions() == null || q.getOptions().size() != 4) {
                                                log.error("Service: Each quiz question must have exactly 4 options");
                                                return Mono.error(new IllegalArgumentException("Mỗi câu hỏi quiz phải có đúng 4 đáp án"));
                                            }
                                            if (q.getCorrectOptionIndex() == null || q.getCorrectOptionIndex() < 0 || q.getCorrectOptionIndex() > 3) {
                                                log.error("Service: Invalid correct option index: {}", q.getCorrectOptionIndex());
                                                return Mono.error(new IllegalArgumentException("Chỉ số đáp án đúng phải từ 0 đến 3"));
                                            }
                                        }
                                        if (request.getDuration() != null && request.getDuration() > 0) {
                                            log.warn("Service: Duration ignored for QUIZ type");
                                        }
                                        break;
                                    default:
                                        log.error("Service: Unsupported content type: {}", contentType);
                                        return Mono.error(new IllegalArgumentException("Loại nội dung không được hỗ trợ: " + contentType));
                                }

                                if (request.getLevel() != null && !request.getLevel().trim().isEmpty()) {
                                    try {
                                        LevelType.valueOf(request.getLevel().toUpperCase());
                                    } catch (IllegalArgumentException e) {
                                        log.error("Service: Invalid level: {}", request.getLevel());
                                        return Mono.error(new IllegalArgumentException("Level không hợp lệ: " + request.getLevel()));
                                    }
                                }

                                Content content = Content.builder()
                                        .title(trimmedTitle)
                                        .description(trimmedDescription)
                                        .type(contentType)
                                        .url(contentType == ContentType.QUIZ ? null : (request.getUrl() != null ? request.getUrl().trim() : null))
                                        .duration(contentType == ContentType.VIDEO ? request.getDuration() : null)
                                        .courseId(Long.valueOf(request.getCourseId()))
                                        .level(request.getLevel() != null ? LevelType.valueOf(request.getLevel().toUpperCase()) : null) // Optional
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                ObjectMapper mapper = new ObjectMapper();
                                try {
                                    if (request.getTags() != null && !request.getTags().isEmpty()) {
                                        content.setTags(mapper.writeValueAsString(request.getTags().stream().map(String::trim).filter(s -> !s.isEmpty()).toList()));
                                    } else {
                                        content.setTags("[]");
                                    }
                                } catch (Exception e) {
                                    log.warn("Service: Tags serialize error: {}", e.getMessage());
                                    content.setTags("[]");
                                }

                                // Handle questions (only for QUIZ)
                                if (contentType == ContentType.QUIZ) {
                                    List<QuizQuestion> validatedQuestions = request.getQuestions().stream()
                                            .map(q -> {
                                                QuizQuestion question = new QuizQuestion();
                                                question.setQuestionText(q.getQuestionText().trim());
                                                question.setOptions(q.getOptions().stream().map(String::trim).toList());
                                                question.setCorrectOptionIndex(q.getCorrectOptionIndex());
                                                return question;
                                            })
                                            .toList();
                                    content.setQuestions(validatedQuestions);
                                } else {
                                    content.setQuestions(List.of()); // Empty list for non-QUIZ
                                }

                                if (request.getThumbnail() != null && !request.getThumbnail().trim().isEmpty()) {
                                    content.setThumbnail(request.getThumbnail().trim());
                                    log.info("Service: Using provided thumbnail for {}", contentType);
                                } else {
                                    content.setThumbnail(null);
                                    log.info("Service: No thumbnail provided for {}", contentType);
                                }

                                log.info("Service: Saving content: {} (type={})", content.getTitle(), contentType);

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


    public Mono<Integer> getTotalDurationByCourseId(Long courseId) {
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


    public Mono<Long> countContentsByCourseId(String courseId) {
        log.info("Counting contents for course id = {}", courseId);

        return contentRepository.countByCourseId(courseId)
                .doOnSuccess(count -> log.info("Total contents in course: {}", count));
    }

    public String uploadVideo(MultipartFile file) {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    Map.of(
                            "resource_type", "video",
                            "folder", "videos/"
                    ));
            return (String) uploadResult.get("secure_url");
        } catch (Exception e) {
            throw new RuntimeException("Upload video failed: " + e.getMessage());
        }
    }


    public Flux<ContentResponse> getContentsByCourseId(String courseId) {
        log.info("Service: Fetching contents for courseId={}", courseId);

        if (courseId == null || courseId.trim().isEmpty()) {
            log.error("Service: Invalid courseId provided: {}", courseId);
            return Flux.empty(); // Return empty flux cho invalid input
        }

        try {
            Long courseIdLong = Long.valueOf(courseId.trim());

            return contentRepository.findByCourseId(courseIdLong)
                    .doOnNext(content -> log.debug("Raw tags from DB for ID={}: '{}'", content.getId(), content.getTags()))
                    .map(this::mapToContentResponse)
                    .doOnNext(response -> log.debug("Service: Mapped response for content ID={}", response.getId()))
                    .doOnComplete(() -> log.info("Service: Completed fetching contents for courseId={}", courseId))
                    .doOnError(e -> log.error("Service: Error fetching contents for courseId={}: {}", courseId, e.getMessage(), e));
        } catch (NumberFormatException e) {
            log.error("Service: Invalid courseId format: {} - {}", courseId, e.getMessage());
            return Flux.empty();
        }
    }

    private ContentResponse mapToContentResponse(Content content) {
        List<String> tagsList = new ArrayList<>(); // Default empty list

        try {
            if (content.getTags() != null && !content.getTags().trim().isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                try {
                    JsonNode node = mapper.readTree(content.getTags());
                    if (node.isArray()) {
                        for (JsonNode elem : node) {
                            tagsList.add(elem.asText());
                        }
                    }
                    log.debug("Parsed tags for ID={}: {}", content.getId(), tagsList);
                } catch (JsonProcessingException e) {
                    log.warn("JSON parse failed for ID={}: '{}', fallback to comma split: {}",
                            content.getId(), content.getTags(), e.getMessage());
                    tagsList = Arrays.stream(content.getTags().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                    log.debug("Fallback tags for ID={}: {}", content.getId(), tagsList);
                }
            } else {
                log.debug("No tags for ID={}", content.getId());
            }

            return ContentResponse.builder()
                    .id(content.getId())
                    .title(content.getTitle())
                    .description(content.getDescription())
                    .type(content.getType() != null ? content.getType().toString() : null)
                    .url(content.getUrl())
                    .duration(content.getDuration())
                    .courseId(content.getCourseId() != null ? String.valueOf(content.getCourseId()) : null)
                    .thumbnail(content.getThumbnail())
                    .level(content.getLevel() != null ? content.getLevel().toString() : null)
                    .tags(tagsList)  // Parsed đầy đủ
                    .questions(content.getType() == ContentType.QUIZ ? content.getQuestions() : List.of())
                    .createdAt(content.getCreatedAt())
                    .updatedAt(content.getUpdatedAt())
                    .error(null)
                    .build();
        } catch (Exception e) {
            log.error("Full mapping error for ID={}: {}", content.getId(), e.getMessage(), e);
            return ContentResponse.builder()
                    .id(content.getId())
                    .title(content.getTitle() != null ? content.getTitle() : "")
                    .description(content.getDescription() != null ? content.getDescription() : "")
                    .type(content.getType() != null ? content.getType().toString() : null)
                    .url(content.getUrl())
                    .duration(content.getDuration())
                    .courseId(content.getCourseId() != null ? String.valueOf(content.getCourseId()) : null)
                    .thumbnail(content.getThumbnail())
                    .level(content.getLevel() != null ? content.getLevel().toString() : null)
                    .tags(List.of())  // Empty on error
                    .createdAt(content.getCreatedAt())
                    .updatedAt(content.getUpdatedAt())
                    .error("Lỗi mapping dữ liệu: " + e.getMessage())
                    .build();
        }
    }

}
