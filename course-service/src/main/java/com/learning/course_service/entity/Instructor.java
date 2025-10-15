package com.learning.course_service.entity;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.learning.course_service.dto.UserDTO;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "instructors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Instructor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)  // Foreign key đến User.id từ user-service
    private Long userId;  // ID từ user-service, để validate

    @Column(length = 100)
    private String username;  // Cache username từ User

    @Column(length = 200)
    private String fullName;  // Cache fullName

    @Column(length = 200)
    private String email;  // Cache email (optional)

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "instructor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Course> courses = new ArrayList<>();

    public Instructor(Long userId, UserDTO userDTO) {
        this.userId = userId;
        this.username = userDTO.getUsername();
        this.fullName = userDTO.getName();
        this.email = userDTO.getEmail();
        this.createdAt = LocalDateTime.now();
    }
}