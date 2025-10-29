package com.learning.enrollment_service.controller;

import com.learning.enrollment_service.dto.*;
import com.learning.enrollment_service.entity.Enrollment;
import com.learning.enrollment_service.entity.EnrollmentProgress;
import com.learning.enrollment_service.entity.Note;
import com.learning.enrollment_service.service.EnrollmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@Slf4j
@RestController
@RequestMapping("/enrolls")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @PostMapping("/register")
    public ResponseEntity<EnrollResponse> enroll(@RequestBody EnrollmentRequest request) {
        try {
            Enrollment enrollment = enrollmentService.enroll(request);
            EnrollResponse response = new EnrollResponse(
                    "Enrollment successful",
                    enrollment.getId().toString()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            EnrollResponse errorResponse = new EnrollResponse(e.getMessage(), null);
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    @GetMapping("/check")
    public ResponseEntity<EnrollmentStatusDTO> checkEnrollment(
            @RequestParam("userId") Long userId,
            @RequestParam("courseId") Long courseId

    ) {
        EnrollmentRequest request = new EnrollmentRequest(courseId, userId);
        return ResponseEntity.ok(enrollmentService.checkEnrollment(request));
    }

    @PostMapping("/{enrollmentId}/progress")
    public ResponseEntity<?> updateProcess(@PathVariable Long enrollmentId,
                                           @RequestBody UpdateProgressRequest request){
        try {
            if(request.getContentItemId() == null){
                return ResponseEntity.badRequest().body("Content item id is null");
            }
            Enrollment updatedEnrollment = enrollmentService.uploadEnrollment(enrollmentId, request);
            return ResponseEntity.ok(Map.of(
                    "enrollmentId", updatedEnrollment.getId(),
                    "progressPercentage", updatedEnrollment.getProgressPercentage(),
                    "status", updatedEnrollment.getStatus().name(),
                    "completedContentItems", updatedEnrollment.getEnrollmentProgresses().stream()
                            .filter(EnrollmentProgress::getCompleted).count()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error updating progress: " + e.getMessage());
        }
    }

    @GetMapping("/{enrollmentId}/current-position")
    public ResponseEntity<CurrentPositionResponse> getCurrentPosition(@PathVariable Long enrollmentId) {
        try {
            CurrentPositionResponse response = enrollmentService.getCurrentPosition(enrollmentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(CurrentPositionResponse.builder().build());
        }
    }

    @PostMapping("/{enrollmentId}/current-position")
    public ResponseEntity<?> updateCurrentPosition(
            @PathVariable Long enrollmentId,
            @RequestBody CurrentPositionRequest request) {
        try {
            if (request.getCurrentContentId() == null) {
                return ResponseEntity.badRequest().body("Current content ID is required.");
            }
            enrollmentService.updateCurrentPosition(enrollmentId, request.getCurrentContentId());
            return ResponseEntity.ok(Map.of("message", "Current position updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error updating current position: " + e.getMessage());
        }
    }


    @GetMapping("/{enrollmentId}/progress-details")
    public ResponseEntity<EnrollmentProgressDetailsResponse> loadProgressDetails(@PathVariable Long enrollmentId) {
        try {
            EnrollmentProgressDetailsResponse response = enrollmentService.loadProgressDetails(enrollmentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error loading progress details for enrollment {}: {}", enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().body(EnrollmentProgressDetailsResponse.builder().build());
        }
    }

    @GetMapping("/{enrollmentId}/progress")
    public ResponseEntity<?> getProgress(@PathVariable Long enrollmentId) {
        try {
            EnrollmentProgressDetailsResponse details = enrollmentService.loadProgressDetails(enrollmentId);

            Map<String, Object> body = Map.of(
                    "enrollmentId", details.getEnrollmentId(),
                    "progressPercentage", details.getProgressPercentage(),
                    "status", details.getStatus(),
                    "completedContentItems", details.getCompletedContentItems()
            );

            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            log.error("Error loading progress summary for enrollment {}: {}", enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", "Error loading progress: " + e.getMessage()));
        }
    }


    @PostMapping("/{enrollmentId}/notes")
    public ResponseEntity<NoteResponse> addNote(
            @PathVariable Long enrollmentId,
            @RequestBody NoteRequest request) {
        try {
            Note savedNote = enrollmentService.addNote(enrollmentId, request);
            return ResponseEntity.ok(NoteResponse.builder()
                    .id(savedNote.getId())
                    .contentId(savedNote.getContentId())
                    .contentTitle(savedNote.getContentTitle())
                    .courseTitle(savedNote.getCourseTitle())
                    .timestamp(savedNote.getTimestamp())
                    .noteText(savedNote.getNoteText())
                    .createdAt(savedNote.getCreatedAt())
                    .build());
        } catch (RuntimeException e) {
            log.error("Error adding note for enrollment {}: {}", enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/{enrollmentId}/notes")
    public ResponseEntity<List<NoteResponse>> getNotes(@PathVariable Long enrollmentId) {
        try {
            List<NoteResponse> notes = enrollmentService.getNotes(enrollmentId);
            return ResponseEntity.ok(notes);
        } catch (RuntimeException e) {
            log.error("Error getting notes for enrollment {}: {}", enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/{enrollmentId}/notes/{contentId}")
    public ResponseEntity<List<NoteResponse>> getNotesByContent(
            @PathVariable Long enrollmentId,
            @PathVariable String contentId) {
        try {
            List<NoteResponse> notes = enrollmentService.getNotesByContent(enrollmentId, contentId);
            return ResponseEntity.ok(notes);
        } catch (RuntimeException e) {
            log.error("Error getting notes for enrollment {} and content {}: {}", enrollmentId, contentId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    @PutMapping("/{enrollmentId}/notes/{noteId}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable Long enrollmentId,
            @PathVariable Long noteId,
            @RequestBody NoteRequest request) {
        try {
            Note updatedNote = enrollmentService.updateNote(enrollmentId, noteId, request);
            NoteResponse response = NoteResponse.builder()
                    .id(updatedNote.getId())
                    .contentId(updatedNote.getContentId())
                    .contentTitle(updatedNote.getContentTitle())
                    .courseTitle(updatedNote.getCourseTitle())
                    .timestamp(updatedNote.getTimestamp())
                    .noteText(updatedNote.getNoteText())
                    .createdAt(updatedNote.getCreatedAt())
                    .build();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating note {} for enrollment {}: {}", noteId, enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    @DeleteMapping("/{enrollmentId}/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long enrollmentId, @PathVariable Long noteId) {
        try {
            enrollmentService.deleteNote(enrollmentId, noteId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error deleting note {} for enrollment {}: {}", noteId, enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{enrollmentId}/notes/filtered")
    public ResponseEntity<List<NoteResponse>> getFilteredNotes(
            @PathVariable Long enrollmentId,
            @RequestParam(required = false) String contentId,
            @RequestParam(defaultValue = "newest") String sortBy) { // Default 'newest'
        try {
            List<NoteResponse> notes = enrollmentService.getFilteredNotes(enrollmentId, contentId, sortBy);
            return ResponseEntity.ok(notes);
        } catch (RuntimeException e) {
            log.error("Error getting filtered notes for enrollment {}: {}", enrollmentId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
