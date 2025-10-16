package com.learning.content_service.controller;

import com.learning.content_service.dto.BulkOperationResponse;
import com.learning.content_service.dto.ContentResponse;
import com.learning.content_service.dto.CreateContentRequest;
import com.learning.content_service.entity.Content;
import com.learning.content_service.service.ContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/content-course/")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;


    private ContentResponse mapToResponse(Content content) {
        return ContentResponse.builder()
                .id(content.getId())
                .title(content.getTitle())
                .description(content.getDescription())
                .type(content.getType() != null ? content.getType().toString() : null)
                .url(content.getUrl())
                .duration(content.getDuration())
                .courseId(content.getCourseId() != null ? String.valueOf(content.getCourseId()) : null)
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .build();
    }

    public record OperationResponse(
            boolean success,
            ContentResponse content,
            String errorMessage,
            HttpStatus status
    ) {}

    private record ErrorResponse(String error) {}

    private ErrorResponse createErrorResponse(String message) {
        return new ErrorResponse(message);
    }

    private BulkOperationResponse createSuccessBulkResponse(List<ContentResponse> contents) {
        return new BulkOperationResponse(
                true,
                contents,
                null,
                contents.size()
        );
    }
    private BulkOperationResponse createErrorBulkResponse(String errorMessage) {
        return new BulkOperationResponse(
                false,
                List.of(),
                errorMessage,
                0
        );
    }

    @PostMapping("/create")
    public Mono<ResponseEntity<OperationResponse>> createContent(  // Giữ return Mono (OK cho hybrid)
                                                                   @Valid @RequestBody CreateContentRequest request) {  // ← BỎ Mono<> Ở ĐÂY! Plain POJO

        return Mono.just(request)  // Wrap thành Mono để flatMap với service reactive
                .doOnNext(req -> log.info("Creating content for course id = {}", req.getCourseId()))
                .flatMap(contentService::createContent)  // Giả sử method này nhận CreateContentRequest, trả Mono<Content>
                .map(content -> {
                    log.info("Content created successfully with id = {}", content.getId());
                    ContentResponse response = mapToResponse(content);
                    return ResponseEntity
                            .status(HttpStatus.CREATED)
                            .body(new OperationResponse(true, response, null, HttpStatus.CREATED));
                })
                .onErrorResume(IllegalArgumentException.class, error -> {
                    log.warn("Validation error: {}", error.getMessage());
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(new OperationResponse(false, null, error.getMessage(), HttpStatus.BAD_REQUEST)));
                })
                .onErrorResume(Exception.class, error -> {
                    log.error("Server error: {}", error.getMessage(), error);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new OperationResponse(false, null,
                                    "Lỗi hệ thống khi tạo nội dung", HttpStatus.INTERNAL_SERVER_ERROR)));
                });
    }

    @PostMapping("/bulk")
    public Mono<ResponseEntity<BulkOperationResponse>> createContentsInBulk(
            @Valid @RequestBody Mono<List<CreateContentRequest>> requests) {

        return requests
                .switchIfEmpty(Mono.just(List.of()))
                .doOnNext(list -> log.info("Processing bulk creation for {} requests", list.size()))
                .flatMapMany(list -> Flux.fromIterable(list)
                        .flatMap(contentService::createContent, 10)) // Concurrency level 10
                .collectList()
                .map(contents -> {
                    log.info("Bulk created {} contents successfully", contents.size());
                    List<ContentResponse> responses = contents.stream()
                            .map(this::mapToResponse)
                            .toList();
                    return ResponseEntity
                            .status(HttpStatus.CREATED)
                            .body(createSuccessBulkResponse(responses));
                })
                .onErrorResume(error -> {
                    log.error("Error in bulk content creation: {}", error.getMessage(), error);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(createErrorBulkResponse("Lỗi tạo nội dung hàng loạt: " + error.getMessage())));
                });
    }

    @GetMapping("/{contentId}")
    public Mono<ResponseEntity<ContentResponse>> getContentById(
            @PathVariable String contentId) {

        return Mono.just(contentId)
                .doOnNext(id -> log.info("Fetching content with id = {}", id))
                .flatMap(contentService::getContentById)
                .map(content -> ResponseEntity.ok(mapToResponse(content)))
                .onErrorResume(error -> {
                    log.warn("Content not found with id = {}", contentId);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.NOT_FOUND)
                            .build());
                });
    }

    @GetMapping("/course/{courseId}")
    public Mono<ResponseEntity<List<ContentResponse>>> getContentsByCourseId(
            @PathVariable String courseId) {

        return Mono.just(courseId)
                .doOnNext(id -> log.info("Fetching contents for course id = {}", id))
                .flatMapMany(contentService::getContentsByCourseId)
                .map(this::mapToResponse)
                .collectList()
                .map(ResponseEntity::ok)
                .switchIfEmpty(Mono.just(ResponseEntity.ok(List.of())))
                .onErrorResume(error -> {
                    log.error("Error fetching contents for course id = {}: {}", courseId, error.getMessage());
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.NOT_FOUND)
                            .body(List.of()));
                });
    }

    @PutMapping("/{contentId}")
    public Mono<ResponseEntity<ContentResponse>> updateContent(
            @PathVariable String contentId,
            @Valid @RequestBody Mono<CreateContentRequest> request) {

        return request
                .doOnNext(req -> log.info("Updating content with id = {}", contentId))
                .flatMap(req -> contentService.updateContent(contentId, req))
                .map(content -> {
                    log.info("Content updated successfully with id = {}", contentId);
                    return ResponseEntity.ok(mapToResponse(content));
                })
                .doOnError(error -> log.error("Error updating content id = {}: {}", contentId, error.getMessage()))
                .onErrorResume(error -> Mono.just(ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .build()));
    }

    @DeleteMapping("/{contentId}")
    public Mono<ResponseEntity<Object>> deleteContent(
            @PathVariable String contentId) {

        return Mono.just(contentId)
                .doOnNext(id -> log.info("Deleting content with id = {}", id))
                .flatMap(contentService::deleteContent)
                .then(Mono.just(ResponseEntity
                        .noContent()
                        .build()))
                .doOnSuccess(res -> log.info("Content deleted successfully with id = {}", contentId))
                .onErrorResume(error -> {
                    log.error("Error deleting content id = {}: {}", contentId, error.getMessage());
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.NOT_FOUND)
                            .build());
                });
    }

    @DeleteMapping("/course/{courseId}")
    public Mono<ResponseEntity<Object>> deleteContentsByCourseId(
            @PathVariable String courseId) {

        return Mono.just(courseId)
                .doOnNext(id -> log.info("Deleting all contents for course id = {}", id))
                .flatMap(contentService::deleteContentsByCourseId)
                .then(Mono.just(ResponseEntity
                        .noContent()
                        .build()))
                .doOnSuccess(res -> log.info("All contents deleted successfully for course id = {}", courseId))
                .onErrorResume(error -> {
                    log.error("Error deleting contents for course id = {}: {}", courseId, error.getMessage());
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .build());
                });
    }
}