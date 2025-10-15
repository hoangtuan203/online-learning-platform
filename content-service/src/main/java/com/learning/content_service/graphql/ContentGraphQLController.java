package com.learning.content_service.graphql;

import com.learning.content_service.dto.CreateContentRequest;
import com.learning.content_service.entity.Content;
import com.learning.content_service.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Controller
public class ContentGraphQLController {

    @Autowired
    private ContentService contentService;

    @QueryMapping
    public Mono<Content> getContent(@Argument String id) {
        return contentService.getContentById(id);
    }

    @QueryMapping
    public Flux<Content> getContentsByCourse(@Argument Long courseId) {
        return contentService.getContentsByCourse(courseId);
    }

    @QueryMapping
    public Flux<Content> findAllContents() {
        return contentService.findAllContents();
    }

    @MutationMapping
    public Mono<Content> addContent(@Argument("input") CreateContentRequest input) {
        return contentService.createContent(input);
    }

    @MutationMapping
    public Mono<Content> updateContent(@Argument String id, @Argument("input") CreateContentRequest input) {
        return contentService.updateContent(id, input);
    }

    @MutationMapping
    public Mono<Boolean> deleteContent(@Argument String id) {
        return contentService.deleteContent(id).then(Mono.just(true));
    }
}