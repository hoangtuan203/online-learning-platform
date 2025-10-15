package com.learning.course_service.service;

import com.learning.course_service.client.UserClient;
import com.learning.course_service.dto.CoursePage;
import com.learning.course_service.dto.CreateCourseRequest;
import com.learning.course_service.dto.UserDTO;
import com.learning.course_service.entity.Course;
import com.learning.course_service.entity.Instructor;
import com.learning.course_service.repository.CourseRepository;
import com.learning.course_service.repository.InstructorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserClient userClient;
    private final InstructorRepository instructorRepository;
    private final CloudinaryService cloudinaryService;

    private String getTokenFromContext() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null && attributes.getRequest() != null) {
            String authHeader = attributes.getRequest().getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        }
        return null;
    }

    public Course createCourse(CreateCourseRequest request, MultipartFile thumbnail ) {
        try {
            if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Title không được rỗng");
            }
            if (request.getInstructorId() == null) {
                throw new IllegalArgumentException("InstructorId không được null");
            }
            Float priceFloat = request.getPrice();
            if (priceFloat == null || priceFloat < 0) {
                throw new IllegalArgumentException("Price phải là số dương");
            }

            String token = getTokenFromContext();

            UserDTO userDTO = userClient.getUserById(request.getInstructorId(), token);
            if (userDTO == null) {
                throw new IllegalArgumentException("Instructor không tồn tại");
            }

            if (!"INSTRUCTOR".equals(userDTO.getRole()) && !"TEACHER".equals(userDTO.getRole())) {
                throw new IllegalArgumentException("User không có quyền tạo khóa học");
            }

            Instructor instructor = instructorRepository.findByUserId(request.getInstructorId()).orElse(null);
            if (instructor == null) {
                instructor = new Instructor();
                instructor.setUserId(request.getInstructorId());
                instructor.setCreatedAt(LocalDateTime.now());
            }

            instructor.setUsername(userDTO.getUsername());
            log.info(userDTO.getName());
            instructor.setFullName(userDTO.getName());
            instructor.setEmail(userDTO.getEmail());

            instructor = instructorRepository.save(instructor);

            BigDecimal priceValue = BigDecimal.valueOf(priceFloat);

            Course course = new Course();
            course.setTitle(request.getTitle().trim());
            course.setDescription(request.getDescription());
            course.setInstructor(instructor);
            course.setPrice(priceValue);
            course.setCreatedAt(LocalDateTime.now());

            if (thumbnail != null && !thumbnail.isEmpty()) {
                String thumbnailUrl = cloudinaryService.uploadThumbnail(thumbnail);
                course.setThumbnailUrl(thumbnailUrl);
            }

            Course savedCourse = courseRepository.save(course);

            savedCourse.setInstructorDTO(userDTO);

            return savedCourse;

        } catch (feign.FeignException.Unauthorized e) {
            throw new IllegalArgumentException("Unauthorized: Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại.");
        } catch (RuntimeException e) {
            if (e.getMessage().contains("GraphQL error") || e.getMessage().contains("ClassCastException")) {
                throw new IllegalArgumentException("Lỗi gọi user-service: " + e.getMessage());
            }
            throw new RuntimeException("Lỗi tạo khóa học: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error in createCourse: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi không mong muốn khi tạo khóa học: " + e.getMessage());
        }
    }

    public CoursePage findAllCourses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Course> coursePage = courseRepository.findAll(pageable);

        List<Course> content = coursePage.getContent().stream()
                .peek(this::populateInstructor)
                .toList();

        CoursePage dto = new CoursePage();
        dto.setContent(content);
        dto.setTotalElements(coursePage.getTotalElements());
        dto.setTotalPages(coursePage.getTotalPages());
        dto.setCurrentPage(coursePage.getNumber());

        return dto;
    }

    private void populateInstructor(Course course) {
        if (course.getInstructor() != null) {
            // Lấy từ cache Instructor
            UserDTO userDTO = new UserDTO();
            userDTO.setId(course.getInstructor().getUserId());
            userDTO.setUsername(course.getInstructor().getUsername());
            userDTO.setName(course.getInstructor().getFullName());
            userDTO.setEmail(course.getInstructor().getEmail());
            course.setInstructorDTO(userDTO);
        } else {
            String token = getTokenFromContext();
            UserDTO userDTO = userClient.getUserById(course.getInstructor().getId(), token);
            if (userDTO != null) {
                course.setInstructorDTO(userDTO);
            }
        }
    }

    public List<Course> searchCourses(String title) {
        return courseRepository.findByTitleContainingIgnoreCase(title);
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khóa học không tồn tại"));
    }

    public List<Course> findCoursesByInstructor(Long instructorId) {
        return courseRepository.findByInstructorId(instructorId);
    }
}