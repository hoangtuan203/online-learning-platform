package com.learning.user_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = false, nullable = false, length = 50)
    private String username;

    @Column(unique = false, nullable = false, length = 50)
    private String name;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String password;  // Hash bằng BCrypt trong service

    @Column(name = "avatar_url", length = 500, nullable = true)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.STUDENT;

    @JsonIgnore
    @Column(name = "otp", length = 6, nullable = true)
    private String otp;

    @Column(name = "otp_expiry", nullable = true)
    private LocalDateTime otpExpiry;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = false;


    @Column(name = "provider", length = 20, nullable = true)  // google, facebook
    private String provider;

    @Column(name = "provider_id", length = 100, nullable = true)  // ID từ provider
    private String providerId;


    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Role {
        STUDENT, INSTRUCTOR, ADMIN
    }

    public static String generateOTP() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
    }

    public boolean isOtpValid(String inputOtp) {
        return isActive || (otp != null && otp.equals(inputOtp) && otpExpiry != null &&
                LocalDateTime.now().isBefore(otpExpiry));
    }

    public void clearOtp() {
        this.otp = null;
        this.otpExpiry = null;
        this.isActive = true;
        this.updatedAt = LocalDateTime.now();
    }

    public User(String name, String email, String provider, String providerId) {
        this.name = name;
        this.email = email;
        this.provider = provider;
        this.providerId = providerId;
        this.username = email.split("@")[0];  // Derive username từ email
        this.isActive = true;  // Social user active ngay
        this.password = null;  // Không cần password
    }
}