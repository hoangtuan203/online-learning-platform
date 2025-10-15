package com.learning.content_service.repository;

import com.learning.content_service.entity.Content;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ContentRepository extends ReactiveMongoRepository<Content, String> {
    Flux<Content> findByCourseId(Long courseId);
    Mono<Content> findByIdAndCourseId(String id, Long courseId);
}