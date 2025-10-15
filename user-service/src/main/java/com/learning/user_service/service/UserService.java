package com.learning.user_service.service;

import com.learning.user_service.dto.AuthResponse;
import com.learning.user_service.dto.LoginRequest;
import com.learning.user_service.dto.UserPage;
import com.learning.user_service.dto.UserResponse;
import com.learning.user_service.entity.User;
import com.learning.user_service.exception.AppException;
import com.learning.user_service.exception.ErrorCode;
import com.learning.user_service.mapper.UserMapper;
import com.learning.user_service.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;
@Slf4j
@Service
public class UserService {

    @Value("${jwt.signerKey}")
    protected String signerKey;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserMapper  userMapper;

    public record  TokenInfo(String token, Date expiryDate){}

    public UserPage findAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findAll(pageable);

        List<UserResponse> userResponses = userPage.getContent().stream()
                .map(userMapper::toUserResponse) // Dùng mapper
                .toList();

        UserPage dto = new UserPage();
        dto.setUser(userResponses);
        dto.setTotalElements(userPage.getTotalElements());
        dto.setTotalPages(userPage.getTotalPages());
        dto.setCurrentPage(userPage.getNumber());

        return dto;
    }

    public User addUser(String username, String name, String email, String password, User.Role role) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        User user = new User();
        user.setUsername(username);
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        return userRepository.save(user);
    }

    public TokenInfo generateToken(User user) {
        if (user == null || user.getUsername() == null) {
            log.error("User null hoặc username rỗng");
            throw new IllegalArgumentException("User không hợp lệ");
        }

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        Date issueTime = new Date();
        Date expireTime = new Date(Instant.ofEpochMilli(issueTime.getTime()).plus(2, ChronoUnit.HOURS).toEpochMilli());
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("hoangtuan.com")
                .issueTime(issueTime)
                .expirationTime(expireTime)
                .jwtID(UUID.randomUUID().toString())
                .claim("user_id", user.getId())
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("role", user.getRole())
                .build();

        JWSObject jwsObject = new JWSObject(header, new Payload(jwtClaimsSet.toJSONObject()));

        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return new TokenInfo(jwsObject.serialize(), expireTime);
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    public AuthResponse authenticate(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            log.warn("Login request null hoặc thiếu fields");
            throw new IllegalArgumentException("Username và password bắt buộc");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("User not found: {}", request.getUsername());
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) {
            log.warn("Invalid password for user: {}", request.getUsername());
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        TokenInfo tokenInfo = generateToken(user);

        TokenInfo refreshToken = generateRefreshToken(user);
        return AuthResponse.builder()
                .accessToken(tokenInfo.token())
                .refreshToken(String.valueOf(refreshToken.token))
                .user(user)
                .authenticated(true)
                .build();
    }


    private TokenInfo generateRefreshToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        Date issueTime = new Date();
        Date expireTime = new Date(Instant.ofEpochMilli(issueTime.getTime()).plus(7, ChronoUnit.DAYS).toEpochMilli());  // 7 ngày
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("hoangtuan.com")
                .issueTime(issueTime)
                .expirationTime(expireTime)
                .jwtID(UUID.randomUUID().toString())
                .claim("type", "refresh")  // Phân biệt refresh
                .build();

        JWSObject jwsObject = new JWSObject(header, new Payload(jwtClaimsSet.toJSONObject()));

        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return new TokenInfo(jwsObject.serialize(), expireTime);
        } catch (JOSEException e) {
            log.error("Cannot create refresh token", e);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    // get user by id
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));
    }


}
