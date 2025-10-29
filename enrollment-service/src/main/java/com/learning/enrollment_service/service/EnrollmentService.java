package com.learning.enrollment_service.service;

import com.learning.enrollment_service.client.ContentClient;
import com.learning.enrollment_service.dto.*;
import com.learning.enrollment_service.entity.*;
import com.learning.enrollment_service.repository.EnrollProgressRepository;
import com.learning.enrollment_service.repository.EnrollmentRepository;
import com.learning.enrollment_service.repository.NoteRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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

    @Transactional
    public Enrollment enroll(EnrollmentRequest request) {
        Optional<Enrollment> existingEnrollment = enrollmentRepository
                .findByUserIdAndCourseId(request.getUserId(), request.getCourseId());

        if (existingEnrollment.isPresent()) {
            throw new RuntimeException("User is already enrolled in this course!");
        }

        List<ContentDTO> contents = contentClient.getContentsByCourseId(request.getCourseId());
        // Sort contents by createdAt to match frontend ordering (ascending)
        contents.sort(Comparator.comparing(ContentDTO::getCreatedAt));
        int totalContentItems = contents.size();

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
        for (ContentDTO content : contents){
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
        Optional<Enrollment> optionalEnrollment =   enrollmentRepository.findById(enrollmentId);
        if(optionalEnrollment.isEmpty()){
            throw new RuntimeException("Enrollment not found!");
        }
        Enrollment enrollment = optionalEnrollment.get();
        if(enrollment.getTotalContentItems() == 0){
            throw  new RuntimeException("Enrollment has no content!");
        }
        Optional<EnrollmentProgress> optionalEnrollmentProgress = enrollProgressRepository.findByEnrollmentIdAndContentItemId(enrollmentId, request.getContentItemId());
        EnrollmentProgress progress;

        if(optionalEnrollmentProgress.isPresent()){
            progress = optionalEnrollmentProgress.get();
        }else{
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

    /**
     * Load detailed progress for the enrollment, including completed contents and current position.
     * Fetches contents from ContentClient to enrich with title/type.
     */
    public EnrollmentProgressDetailsResponse loadProgressDetails(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));

        // Fetch all progress entries
        List<EnrollmentProgress> progressEntries = progressRepository.findByEnrollment(enrollment);

        // Fetch full contents from ContentClient for enrichment
        List<ContentDTO> contents = contentClient.getContentsByCourseId(enrollment.getCourseId());
        // Sort contents by createdAt to match frontend ordering (ascending)
        contents.sort(Comparator.comparing(ContentDTO::getCreatedAt));

        // Map to find current unfinished content (first non-completed after sorted order)
        String currentContentId = enrollment.getCurrentContentId(); // Use saved currentContentId, fallback to first non-completed
        if (currentContentId == null) {
            // Fallback: find first non-completed
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
                    // Find matching progress entry
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
}