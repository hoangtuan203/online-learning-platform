package com.learning.content_service.entity;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "contents")  // Bảng MongoDB
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Content {
    @Id
    private String id;  // MongoDB ObjectId

    @Field("course_id")
    private Long courseId;  // FK đến course.id từ course-service

    @Field("title")
    private String title;

    @Field("description")
    private String description;

    @Field("type")  // VIDEO, DOC, QUIZ
    private ContentType type;

    @Field("url")
    private String url;  // URL video/file

    @Field("thumbnail")
    private String thumbnail;

    @Field("duration")  // Cho video
    private Integer duration;  // Giây

    @Field("level")
    private LevelType level;

    @Field("tags")
    private String tags;

    @Field("created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    private List<QuizQuestion> questions;


}

