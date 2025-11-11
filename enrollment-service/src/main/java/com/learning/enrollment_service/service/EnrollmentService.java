package com.learning.enrollment_service.service;

import com.learning.enrollment_service.client.ContentClient;
import com.learning.enrollment_service.client.CourseClient;
import com.learning.enrollment_service.client.UserClient;
import com.learning.enrollment_service.dto.*;
import com.learning.enrollment_service.entity.*;
import com.learning.enrollment_service.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final EnrollProgressRepository progressRepository;

    private final ContentClient contentClient;
    private final EnrollProgressRepository enrollProgressRepository;

    private final NoteRepository noteRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final LikeRepository likeRepository;

    @Autowired
    private UserClient userClient;
    @Autowired
    private CourseClient courseClient;

    @Transactional
    public Enrollment enroll(EnrollmentRequest request) {

        log.info("user Id request : {}", request.getUserId());
        Optional<Enrollment> existingEnrollment = enrollmentRepository
                .findByUserIdAndCourseId(request.getUserId(), request.getCourseId());

        if (existingEnrollment.isPresent()) {
            throw new RuntimeException("User is already enrolled in this course!");
        }

        List<ContentDTO> contents = contentClient.getContentsByCourseId(request.getCourseId());
        // Sort contents by createdAt to match frontend ordering (ascending)
        contents.sort(Comparator.comparing(ContentDTO::getCreatedAt));
        int totalContentItems = contents.size();
        log.info("user Id request : {}", request.getUserId());
        Enrollment newEnrollment = Enrollment.builder()
                .userId(request.getUserId())
                .courseId(request.getCourseId())
                .enrollmentDate(LocalDateTime.now())
                .status(EnrollmentStatus.PENDING)
                .progressPercentage(0) // Explicitly set to 0
                .totalContentItems(totalContentItems)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(newEnrollment);

        // Create progress entries for all contents
        for (ContentDTO content : contents) {
            EnrollmentProgress progress = EnrollmentProgress.builder()
                    .enrollment(savedEnrollment)
                    .contentItemId(content.getId())
                    .contentType(ContentType.valueOf(content.getType()))
                    .completed(false)
                    .durationSpent(0)
                    .updatedAt(LocalDateTime.now())
                    .build();
            progressRepository.save(progress);
        }

        if (!contents.isEmpty()) {
            savedEnrollment.setCurrentContentId(contents.get(0).getId());
            savedEnrollment.setUpdatedAt(LocalDateTime.now()); // Update timestamp
            savedEnrollment = enrollmentRepository.save(savedEnrollment);
            log.info("Set initial current position to first content: {}", contents.get(0).getId());
        }

        return savedEnrollment;
    }

    public EnrollmentStatusDTO checkEnrollment(EnrollmentRequest request) {
        log.info("user Id request : {}", request.getUserId());
        log.info("course id : {}", request.getCourseId());
        Optional<Enrollment> enrollment = enrollmentRepository
                .findByUserIdAndCourseId(request.getUserId(), request.getCourseId());
        if (enrollment.isPresent()) {
            Enrollment e = enrollment.get();
            return new EnrollmentStatusDTO(true, e.getStatus().name(), e.getId().toString());
        } else {
            return new EnrollmentStatusDTO(false, null, null);
        }
    }


    //update progress
    @Transactional
    public Enrollment uploadEnrollment(Long enrollmentId, UpdateProgressRequest request) {
        Optional<Enrollment> optionalEnrollment = enrollmentRepository.findById(enrollmentId);
        if (optionalEnrollment.isEmpty()) {
            throw new RuntimeException("Enrollment not found!");
        }
        Enrollment enrollment = optionalEnrollment.get();
        if (enrollment.getTotalContentItems() == 0) {
            throw new RuntimeException("Enrollment has no content!");
        }
        Optional<EnrollmentProgress> optionalEnrollmentProgress = enrollProgressRepository.findByEnrollmentIdAndContentItemId(enrollmentId, request.getContentItemId());
        EnrollmentProgress progress;

        if (optionalEnrollmentProgress.isPresent()) {
            progress = optionalEnrollmentProgress.get();
        } else {
            progress = EnrollmentProgress.builder()
                    .enrollment(enrollment)
                    .contentItemId(request.getContentItemId())
                    .contentType(ContentType.VIDEO)
                    .completed(false)
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        progress.updateCompletion(request.getScore(), request.getDurationSpent());
        enrollProgressRepository.save(progress);

        enrollment.calculateProgress();
        return enrollmentRepository.save(enrollment);
    }


    public EnrollmentProgressDetailsResponse loadProgressDetails(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));

        List<EnrollmentProgress> progressEntries = progressRepository.findByEnrollment(enrollment);

        List<ContentDTO> contents = contentClient.getContentsByCourseId(enrollment.getCourseId());
        contents.sort(Comparator.comparing(ContentDTO::getCreatedAt));

        String currentContentId = enrollment.getCurrentContentId(); // Use saved currentContentId, fallback to first non-completed
        if (currentContentId == null) {
            for (ContentDTO content : contents) {
                Optional<EnrollmentProgress> progressOpt = progressEntries.stream()
                        .filter(p -> p.getContentItemId().equals(content.getId()))
                        .findFirst();
                if (progressOpt.isEmpty() || !progressOpt.get().getCompleted()) {
                    currentContentId = content.getId();
                    break;
                }
            }
        }

        List<ContentProgressDTO> contentProgressList = contents.stream()
                .map(content -> {
                    Optional<EnrollmentProgress> progressOpt = progressEntries.stream()
                            .filter(p -> p.getContentItemId().equals(content.getId()))
                            .findFirst();

                    EnrollmentProgress progress = progressOpt.orElse(EnrollmentProgress.builder()
                            .completed(false)
                            .build()); // Fallback if missing

                    ContentProgressDTO dto = ContentProgressDTO.builder()
                            .contentId(content.getId())
                            .title(content.getTitle())
                            .type(content.getType())
                            .completed(progress.getCompleted())
                            .score(progress.getScore())
                            .durationSpent(progress.getDurationSpent())
                            .build();

                    return dto;
                })
                .collect(Collectors.toList());

        int completedCount = (int) contentProgressList.stream()
                .filter(ContentProgressDTO::getCompleted)
                .count();

        return EnrollmentProgressDetailsResponse.builder()
                .enrollmentId(enrollment.getId())
                .status(enrollment.getStatus().name())
                .progressPercentage(enrollment.getProgressPercentage())
                .totalContentItems(enrollment.getTotalContentItems())
                .completedContentItems(completedCount)
                .currentContentId(currentContentId)
                .contents(contentProgressList)
                .build();
    }

    public CurrentPositionResponse getCurrentPosition(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));
        return CurrentPositionResponse.builder()
                .currentContentId(enrollment.getCurrentContentId())
                .build();
    }

    @Transactional
    public void updateCurrentPosition(Long enrollmentId, String contentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));
        enrollment.setCurrentContentId(contentId);
        enrollmentRepository.save(enrollment);
    }

    //note
    @Transactional
    public Note addNote(Long enrollmentId, NoteRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));

        Note newNote = Note.builder()
                .enrollment(enrollment)
                .contentId(request.getContentId())
                .contentTitle(request.getContentTitle())
                .courseTitle(request.getCourseTitle())
                .timestamp(request.getTimestamp())
                .noteText(request.getNoteText())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Note savedNote = noteRepository.save(newNote);
        log.info("Added note for enrollment {}: {}", enrollmentId, savedNote.getId());
        return savedNote;
    }

    public List<NoteResponse> getNotes(Long enrollmentId) {
        List<Note> notes = noteRepository.findByEnrollmentIdOrderByCreatedAtDesc(enrollmentId);
        return notes.stream()
                .map(note -> NoteResponse.builder()
                        .id(note.getId())
                        .contentId(note.getContentId())
                        .contentTitle(note.getContentTitle())
                        .courseTitle(note.getCourseTitle())
                        .timestamp(note.getTimestamp())
                        .noteText(note.getNoteText())
                        .createdAt(note.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<NoteResponse> getNotesByContent(Long enrollmentId, String contentId) {
        List<Note> notes = noteRepository.findByEnrollmentIdAndContentIdOrderByCreatedAtDesc(enrollmentId, contentId);
        return notes.stream()
                .map(note -> NoteResponse.builder()
                        .id(note.getId())
                        .contentId(note.getContentId())
                        .contentTitle(note.getContentTitle())
                        .courseTitle(note.getCourseTitle())
                        .timestamp(note.getTimestamp())
                        .noteText(note.getNoteText())
                        .createdAt(note.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public Note updateNote(Long enrollmentId, Long noteId, NoteRequest request) {
        Note note = noteRepository.findByIdAndEnrollmentId(noteId, enrollmentId)
                .orElseThrow(() -> new RuntimeException("Note not found: " + noteId));
        note.setNoteText(request.getNoteText()); // Update fields as needed
        note.setUpdatedAt(LocalDateTime.now());
        return noteRepository.save(note);
    }

    @Transactional
    public void deleteNote(Long enrollmentId, Long noteId) {
        Note note = noteRepository.findByIdAndEnrollmentId(noteId, enrollmentId)
                .orElseThrow(() -> new RuntimeException("Note not found: " + noteId));
        noteRepository.delete(note);
    }

    public List<NoteResponse> getFilteredNotes(Long enrollmentId, String contentId, String sortBy) {
        List<Note> notes;
        if ("oldest".equalsIgnoreCase(sortBy)) {
            notes = noteRepository.findByEnrollmentIdAndOptionalContentIdOrderByCreatedAtAsc(enrollmentId, contentId);
        } else {
            notes = noteRepository.findByEnrollmentIdAndOptionalContentIdOrderByCreatedAtDesc(enrollmentId, contentId);
        }

        return notes.stream()
                .map(note -> NoteResponse.builder()
                        .id(note.getId())
                        .contentId(note.getContentId())
                        .contentTitle(note.getContentTitle())
                        .courseTitle(note.getCourseTitle())
                        .timestamp(note.getTimestamp())
                        .noteText(note.getNoteText())
                        .createdAt(note.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<EnrollmentDTO> getEnrollmentsByUserId(Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserIdWithProgress(userId);
        for (Enrollment enrollment : enrollments) {
            enrollment.calculateProgress();
        }

        List<EnrollmentDTO> dtos = enrollments.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        log.info("Retrieved {} enrollments for userId: {}", dtos.size(), userId);
        return dtos;
    }

    private EnrollmentDTO toDto(Enrollment enrollment) {

        String courseTitle = null;
        String thumbnailUrl = null;
        String fullName = null;
        if (enrollment.getCourseId() != null) {
            try {
                CourseDTO courseDTO = courseClient.getCourseById(enrollment.getCourseId());
                log.info("CourseDTO : {}", courseDTO);
                courseTitle = courseDTO.getTitle();
                thumbnailUrl = courseDTO.getThumbnailUrl();
                fullName = courseDTO.getInstructor().getName();
            } catch (Exception e) {
                log.warn("Failed to fetch course title for courseId: {}, error: {}", enrollment.getCourseId(), e.getMessage());
                courseTitle = "Unknown Course";  // Fallback
            }
        }

        return EnrollmentDTO.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUserId())
                .courseId(enrollment.getCourseId())
                .courseTitle(courseTitle)
                .thumbnailUrl(thumbnailUrl)
                .instructorName(fullName)
                .enrollmentDate(enrollment.getEnrollmentDate())
                .startDate(enrollment.getStartDate())
                .completedDate(enrollment.getCompletedDate())
                .status(enrollment.getStatus())
                .progressPercentage(enrollment.getProgressPercentage())
                .totalContentItems(enrollment.getTotalContentItems())
                .currentContentId(enrollment.getCurrentContentId())
                .createdAt(enrollment.getCreatedAt())
                .updatedAt(enrollment.getUpdatedAt())
                .progressSummaries(enrollment.getEnrollmentProgresses().stream()
                        .map(this::toProgressSummary)
                        .collect(Collectors.toList()))
                .build();
    }

    // Helper method cho progress summary (như trên)
    private EnrollmentProgressSummaryDTO toProgressSummary(EnrollmentProgress progress) {
        return EnrollmentProgressSummaryDTO.builder()
                .id(progress.getId())
                .contentItemId(progress.getContentItemId())
                .contentType(progress.getContentType())
                .completed(progress.getCompleted())
                .score(progress.getScore())
                .durationSpent(progress.getDurationSpent())
                .build();
    }

    public List<QAResponse> getQAByContentInCourse(Long courseId, String contentId, Long userId) {
        List<Question> questions = questionRepository
                .findByCourseIdAndContentIdOrderByCreatedAtDesc(courseId, contentId);

        if (questions.isEmpty()) {
            return List.of();
        }

        List<Long> questionIds = questions.stream()
                .map(Question::getId)
                .collect(Collectors.toList());

        List<Answer> allAnswers = answerRepository.findByQuestionIdIn(questionIds);

        List<Long> answerIds = allAnswers.stream()
                .map(Answer::getId)
                .collect(Collectors.toList());

        Map<Long, Integer> questionLikeCounts = new HashMap<>();
        Map<Long, Integer> answerLikeCounts = new HashMap<>();
        Set<Long> likedQuestionIds = new HashSet<>();
        Set<Long> likedAnswerIds = new HashSet<>();

        for (Long qId : questionIds) {
            questionLikeCounts.put(qId, likeRepository.countByQuestionId(qId));
            if (userId != null && likeRepository.existsByQuestionIdAndUserId(qId, userId)) {
                likedQuestionIds.add(qId);
            }
        }

        for (Long aId : answerIds) {
            answerLikeCounts.put(aId, likeRepository.countByAnswerId(aId));
            if (userId != null && likeRepository.existsByAnswerIdAndUserId(aId, userId)) {
                likedAnswerIds.add(aId);
            }
        }

        Map<Long, List<Answer>> answersByQuestion = allAnswers.stream()
                .collect(Collectors.groupingBy(answer -> answer.getQuestion().getId()));

        return questions.stream()
                .map(question -> {
                    Long enrollmentUserId = question.getEnrollment().getUserId();
                    String authorName = enrollmentUserId != null
                            ? getUserNameFromClient(enrollmentUserId)
                            : "Anonymous";
                    String authorAvatar = enrollmentUserId != null
                            ? getAvatarUserFromClient(enrollmentUserId)
                            : null;

                    List<Answer> questionAnswers = answersByQuestion.getOrDefault(question.getId(), List.of());

                    List<AnswerResponse> answerResponses = questionAnswers.stream()
                            .map(answer -> {
                                Long answeredById = answer.getAnsweredBy();
                                String answererName = answeredById != null
                                        ? getUserNameFromClient(answeredById)
                                        : "Anonymous";
                                String answererAvatar = answeredById != null  // THÊM FETCH AVATAR
                                        ? getAvatarUserFromClient(answeredById)
                                        : null;

                                return AnswerResponse.builder()
                                        .id(answer.getId())
                                        .questionId(question.getId())
                                        .answerText(answer.getAnswerText())
                                        .answeredBy(answeredById)
                                        .answererName(answererName)
                                        .answererAvatar(answererAvatar)  // SET FIELD MỚI
                                        .createdAt(answer.getCreatedAt())
                                        .updatedAt(answer.getUpdatedAt())  // ĐẦY ĐỦ (nếu null thì OK)
                                        .likeCount(answerLikeCounts.getOrDefault(answer.getId(), 0))
                                        .liked(likedAnswerIds.contains(answer.getId()))
                                        .build();
                            })
                            .collect(Collectors.toList());

                    // Phần questions giữ nguyên như fix trước (với .askedBy(enrollmentUserId))
                    QuestionResponse questionResponse = QuestionResponse.builder()
                            .id(question.getId())
                            .authorName(authorName)
                            .authorAvatar(authorAvatar)
                            .contentId(question.getContentId())
                            .questionText(question.getQuestionText())
                            .answered(!questionAnswers.isEmpty())
                            .createdAt(question.getCreatedAt())
                            .updatedAt(question.getUpdatedAt())
                            .likeCount(questionLikeCounts.getOrDefault(question.getId(), 0))
                            .liked(likedQuestionIds.contains(question.getId()))
                            .askedBy(enrollmentUserId)  // Từ fix trước
                            .build();

                    return QAResponse.builder()
                            .question(questionResponse)
                            .answers(answerResponses)
                            .build();
                })
                .collect(Collectors.toList());
    }
    @Transactional
    public Question addQuestion(Long enrollmentId, QuestionRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));

        Question newQuestion = Question.builder()
                .enrollment(enrollment)
                .courseId(enrollment.getCourseId())
                .contentId(request.getContentId())
                .questionText(request.getQuestionText())
                .askedBy(request.getAskedBy())
                .askerName(request.getAskedName())
                .answered(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Question savedQuestion = questionRepository.save(newQuestion);
        log.info("Added question for enrollment {} and content {}: {}",
                enrollmentId, request.getContentId(), savedQuestion.getId());

        return savedQuestion;
    }


    @Transactional
    public Answer addAnswer(Long questionId, AnswerRequest request) {  // Renamed to addAnswer since we always add new
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));

        Answer answer = Answer.builder()
                .question(question)
                .answerText(request.getAnswerText())
                .answeredBy(request.getAnsweredBy())
                .answererName(request.getAnswereName())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())  // FIXED: LocalDateTime.now() instead of LocalDateTime.now()
                .build();
        answer = answerRepository.save(answer);

        // Mark question as answered if it has at least one answer (set only if not already true)
        if (!question.getAnswered()) {
            question.setAnswered(true);
            question.setUpdatedAt(LocalDateTime.now());
            questionRepository.save(question);
        }

        log.info("Added answer for question {}: {}", questionId, answer.getId());
        return answer;
    }

    private String getUserNameFromClient(Long userId) {
        try {
            ResponseEntity<UserResponse> response = userClient.getUserById(userId);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().getName();
            }
        } catch (Exception e) {
            log.error("Failed to get user name for userId: {}", userId, e);
        }
        return "Anonymous";
    }


    private String getAvatarUserFromClient(Long userId) {
        try {
            ResponseEntity<UserResponse> response = userClient.getUserById(userId);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().getAvatarUrl();
            }
        } catch (Exception e) {
            log.error("Failed to get avatar for userId: {}", userId, e);
        }
        return null;
    }

    @Transactional
    public LikeResponse toggleLikeQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));

        Optional<Like> existingLike = likeRepository.findByQuestionIdAndUserId(questionId, userId);

        boolean isLiked;

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            isLiked = false;
            log.info("Unlike question: {} by user: {}", questionId, userId);
        } else {
            Like like = Like.builder()
                    .question(question)
                    .answer(null)
                    .userId(userId)
                    .createdAt(LocalDateTime.now())
                    .build();
            likeRepository.save(like);
            isLiked = true;
            log.info("Like question: {} by user: {}", questionId, userId);
        }

        int likeCount = likeRepository.countByQuestionId(questionId);

        return LikeResponse.builder()
                .liked(isLiked)
                .likeCount(likeCount)
                .build();
    }

    @Transactional
    public LikeResponse toggleLikeAnswer(Long answerId, Long userId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found: " + answerId));

        Optional<Like> existingLike = likeRepository.findByAnswerIdAndUserId(answerId, userId);

        boolean isLiked;

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            isLiked = false;
            log.info("Unlike answer: {} by user: {}", answerId, userId);
        } else {
            Like like = Like.builder()
                    .question(null)
                    .answer(answer)
                    .userId(userId)
                    .createdAt(LocalDateTime.now())
                    .build();
            likeRepository.save(like);
            isLiked = true;
            log.info("Like answer: {} by user: {}", answerId, userId);
        }

        int likeCount = likeRepository.countByAnswerId(answerId);

        return LikeResponse.builder()
                .liked(isLiked)
                .likeCount(likeCount)
                .build();
    }

    public boolean hasUserLikedQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        return question.isLikedBy(userId);
    }

    public boolean hasUserLikedAnswer(Long answerId, Long userId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found"));
        return answer.getLikes().stream()
                .anyMatch(like -> like.getUserId().equals(userId));
    }


    public String getQuestionOwnerId(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));
        return question.getEnrollment().getUserId().toString();
    }

    @Transactional
    public QuestionResponse updateQuestion(Long questionId, Long enrollmentId, QuestionUpdateRequest request) {
        // Kiểm tra question tồn tại và thuộc enrollment của user
        Question question = questionRepository.findByIdAndEnrollmentId(questionId, enrollmentId)
                .orElseThrow(() -> new RuntimeException("Question not found or you are not authorized to edit: " + questionId));

        // Validate input
        if (request.getQuestionText() == null || request.getQuestionText().trim().isEmpty()) {
            throw new RuntimeException("Question text cannot be empty");
        }

        // Cập nhật
        question.setQuestionText(request.getQuestionText());
        question.setUpdatedAt(LocalDateTime.now());

        Question updatedQuestion = questionRepository.save(question);

        // Trả về DTO (tương tự getQAByContentInCourse)
        Long enrollmentUserId = updatedQuestion.getEnrollment().getUserId();
        String authorName = getUserNameFromClient(enrollmentUserId);
        String authorAvatar = getAvatarUserFromClient(enrollmentUserId);

        return QuestionResponse.builder()
                .id(updatedQuestion.getId())
                .authorName(authorName)
                .authorAvatar(authorAvatar)
                .contentId(updatedQuestion.getContentId())
                .questionText(updatedQuestion.getQuestionText())  // Nội dung mới
                .answered(updatedQuestion.getAnswered())
                .createdAt(updatedQuestion.getCreatedAt())
                .updatedAt(updatedQuestion.getUpdatedAt())
                .likeCount(likeRepository.countByQuestionId(updatedQuestion.getId()))
                .liked(hasUserLikedQuestion(updatedQuestion.getId(), enrollmentUserId))
                .build();
    }

    @Transactional
    public AnswerResponse updateAnswer(Long answerId, AnswerUpdateRequest request) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found: " + answerId));

        // Kiểm tra quyền: userId phải khớp answeredBy
        if (!answer.getAnsweredBy().equals(request.getUserId())) {
            throw new RuntimeException("You are not authorized to edit this answer");
        }

        // Validate input
        if (request.getAnswerText() == null || request.getAnswerText().trim().isEmpty()) {
            throw new RuntimeException("Answer text cannot be empty");
        }

        // Cập nhật
        answer.setAnswerText(request.getAnswerText());
        answer.setUpdatedAt(LocalDateTime.now());

        Answer updatedAnswer = answerRepository.save(answer);

        // Trả về DTO
        String answererName = getUserNameFromClient(updatedAnswer.getAnsweredBy());

        return AnswerResponse.builder()
                .id(updatedAnswer.getId())
                .questionId(updatedAnswer.getQuestion().getId())
                .answerText(updatedAnswer.getAnswerText())  // Nội dung mới
                .answeredBy(updatedAnswer.getAnsweredBy())
                .answererName(answererName)
                .createdAt(updatedAnswer.getCreatedAt())
                .updatedAt(updatedAnswer.getUpdatedAt())  // Nếu DTO có
                .likeCount(likeRepository.countByAnswerId(updatedAnswer.getId()))
                .liked(hasUserLikedAnswer(updatedAnswer.getId(), request.getUserId()))
                .build();
    }

    @Transactional
    public void deleteQuestion(Long questionId, Long enrollmentId) {
        Question question = questionRepository.findByIdAndEnrollmentId(questionId, enrollmentId)
                .orElseThrow(() -> new RuntimeException("Question not found or you are not authorized to delete: " + questionId));
        likeRepository.deleteByQuestionId(questionId);

        List<Answer> answers = answerRepository.findAnswersByQuestionId(questionId);

        for (Answer answer : answers) {
            likeRepository.deleteByAnswerId(answer.getId());
            answerRepository.delete(answer);
            log.info("Deleted answer {} and its likes for question {}", answer.getId(), questionId);
        }

        questionRepository.delete(question);

        log.info("Deleted question {} for enrollment {} (with {} answers)", questionId, enrollmentId, answers.size());
    }

    @Transactional
    public void deleteAnswer(Long answerId, Long userId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found: " + answerId));

        if (!answer.getAnsweredBy().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this answer");
        }

        likeRepository.deleteByAnswerId(answerId);

        answerRepository.delete(answer);

        Question question = answer.getQuestion();
        List<Answer> remainingAnswers = answerRepository.findAnswersByQuestionId(question.getId());

        if (remainingAnswers.isEmpty() && question.getAnswered()) {
            question.setAnswered(false);
            question.setUpdatedAt(LocalDateTime.now());
            questionRepository.save(question);
            log.info("Updated question {} to unanswered after deleting answer {}", question.getId(), answerId);
        }

        log.info("Deleted answer {} by user {}", answerId, userId);
    }

}