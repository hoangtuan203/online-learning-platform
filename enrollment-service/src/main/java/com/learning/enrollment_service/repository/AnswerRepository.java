package com.learning.enrollment_service.repository;

import com.learning.enrollment_service.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    Answer findByQuestionId(Long questionId);
    @Query("SELECT a FROM Answer a WHERE a.question.id = :questionId ORDER BY a.createdAt DESC")
    List<Answer> findByQuestionIdOrderByCreatedAtDesc(@Param("questionId") Long questionId);

    @Query("SELECT a FROM Answer a LEFT JOIN FETCH a.likes WHERE a.id = :id")
    Optional<Answer> findByIdWithLikes(@Param("id") Long id);

    List<Answer>  findByQuestionIdIn(List<Long> questionIds);



    @Query("SELECT a FROM Answer a WHERE a.question.id = :questionId")
    List<Answer> findAnswersByQuestionId(@Param("questionId") Long questionId);
}