package com.learning.content_service.repository;

import com.learning.content_service.entity.Content;
import com.learning.content_service.entity.ContentType;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;


@Repository
public interface ContentRepository extends ReactiveMongoRepository<Content, String> {

    @Query("{'course_id': ?0}")
    Flux<Content> findByCourseId(Long courseId);


    Flux<Content> findByCourseIdAndType(String courseId, ContentType type);


    Mono<Void> deleteByCourseId(String courseId);


    Mono<Long> countByCourseId(String courseId);


    Flux<Content> findByTitleContainingIgnoreCase(String title);


    Flux<Content> findByLevel(String level);


    @Query("{ 'tags': { $in: [?0] } }")
    Flux<Content> findByTagsContaining(String tag);

    @Query("{ 'createdAt': { $gte: ?0, $lte: ?1 } }")
    Flux<Content> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Content> courseId(Long courseId);
}