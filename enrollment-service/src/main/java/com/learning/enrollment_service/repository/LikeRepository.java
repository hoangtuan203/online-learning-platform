package com.learning.enrollment_service.repository;
import com.learning.enrollment_service.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
public interface LikeRepository extends JpaRepository<Like, Long> {

    Optional<Like> findByQuestionIdAndUserId(Long questionId, Long userId);

    Optional<Like> findByAnswerIdAndUserId(Long answerId, Long userId);

    int countByQuestionId(Long questionId);

    int countByAnswerId(Long answerId);

    void deleteByQuestionIdAndUserId(Long questionId, Long userId);
    void deleteByAnswerIdAndUserId(Long answerId, Long userId);

    boolean existsByQuestionIdAndUserId(Long questionId, Long userId);
    boolean existsByAnswerIdAndUserId(Long answerId, Long userId);
}