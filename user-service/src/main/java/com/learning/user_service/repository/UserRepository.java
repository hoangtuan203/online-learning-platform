package com.learning.user_service.repository;

import com.learning.user_service.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findByRole(User.Role role);

    @Query("SELECT u FROM User u WHERE (:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
            "AND (:role IS NULL OR u.role = :role)")
    Page<User> findByNameContainingOrRole(String name, User.Role role, Pageable pageable);
    Optional<User> findByEmailAndOtp(String email, String otp);
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
}
