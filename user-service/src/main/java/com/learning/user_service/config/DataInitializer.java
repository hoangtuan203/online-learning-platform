package com.learning.user_service.config;

import com.learning.user_service.entity.User;
import com.learning.user_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {

            boolean existsAdmin = userRepository.findByRole(User.Role.ADMIN).stream()
                    .anyMatch(user -> user.getRole() == User.Role.ADMIN);

            if (!existsAdmin) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setName("Admin User");
                admin.setEmail("admin@gmail.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(User.Role.ADMIN);
                admin.setCreatedAt(LocalDateTime.now());
                admin.setUpdatedAt(LocalDateTime.now());

                userRepository.save(admin);
                System.out.println("Tài khoản ADMIN mặc định đã được tạo: username=admin, password=admin123");
            } else {
                System.out.println("Tài khoản ADMIN đã tồn tại, bỏ qua.");
            }
        };
    }
}
