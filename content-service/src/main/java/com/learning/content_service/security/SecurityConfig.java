package com.learning.content_service.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final String[] PUBLIC_ENDPOINTS = { "/api/public", "/api/content-course/create" };  // ← THÊM endpoint vào permitAll
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()  // ← permitAll cho public và create
                        .anyRequest().authenticated()  // ← BỎ authenticated() riêng cho create
                )
                .csrf(csrf -> csrf.disable())
                .httpBasic(withDefaults -> {})
                .formLogin(form -> form.disable());

        return http.build();
    }


    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Or pass strength: new BCryptPasswordEncoder(12)
    }
}