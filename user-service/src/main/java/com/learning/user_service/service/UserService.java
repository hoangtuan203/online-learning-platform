package com.learning.user_service.service;

import com.learning.user_service.dto.*;
import com.learning.user_service.entity.InvalidatedToken;
import com.learning.user_service.entity.User;
import com.learning.user_service.exception.AppException;
import com.learning.user_service.exception.ErrorCode;
import com.learning.user_service.mapper.UserMapper;
import com.learning.user_service.repository.InvalidatedTokenRepository;
import com.learning.user_service.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.openid.connect.sdk.AuthenticationResponse;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserService {

    private final InvalidatedTokenRepository invalidatedTokenRepository;
    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;
    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;
    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    private UserMapper userMapper;
    private CloudinaryService cloudinaryService;

    public UserService(UserRepository userRepository, UserMapper userMapper, CloudinaryService cloudinaryService,
                       PasswordEncoder passwordEncoder, InvalidatedTokenRepository invalidatedTokenRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.cloudinaryService = cloudinaryService;
        this.passwordEncoder = passwordEncoder;
        this.invalidatedTokenRepository = invalidatedTokenRepository;
    }

    public record TokenInfo(String token, Date expiryDate) {
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (AppException e) {
            isValid = false;
        }

        return IntrospectResponse.builder().valid(isValid).build();
    }


    public UserPage findAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findAll(pageable);

        List<UserResponse> userResponses = userPage.getContent().stream()
                .map(userMapper::toUserResponse)
                .toList();

        UserPage dto = new UserPage();
        dto.setUser(userResponses);
        dto.setTotalElements(userPage.getTotalElements());
        dto.setTotalPages(userPage.getTotalPages());
        dto.setCurrentPage(userPage.getNumber());

        return dto;
    }

    public User addUser(AddUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        String roleStr = request.getRole();
        User.Role role;
        try {
            role = User.Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Role không hợp lệ: " + roleStr);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        try {
            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi lưu user vào database: " + e.getMessage());
        }
    }


    public String uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại với ID: " + userId));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không hợp lệ");
        }

        try {
            String avatarUrl = cloudinaryService.uploadAvatarUser(file);
            user.setAvatarUrl(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            return avatarUrl;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi upload avatar: " + e.getMessage());
        }
    }


    private String generateToken(User user) {
        if (user == null || user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            log.error("User null hoặc username rỗng");
            throw new IllegalArgumentException("User không hợp lệ");
        }

        if (VALID_DURATION <= 0) {
            log.error("VALID_DURATION không hợp lệ: {}", VALID_DURATION);
            throw new IllegalArgumentException("Thời hạn token không hợp lệ");
        }

        byte[] keyBytes;
        try {
            keyBytes = SIGNER_KEY.getBytes("UTF-8");
        } catch (Exception e) {
            log.error("Lỗi encoding signer key", e);
            throw new RuntimeException("Lỗi encoding secret key", e);
        }
        Key signingKey = new SecretKeySpec(keyBytes, "HmacSHA512");  // Match HS512

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        Date issueTime = new Date();
        Date expirationTime = new Date(Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli());

        String scope = buildScope(user);
        if (scope == null || scope.trim().isEmpty()) {
            log.warn("Scope empty cho user {}, fallback 'ROLE_USER'", user.getUsername());
            scope = "ROLE_USER";  // Fallback để tránh permission error
        }

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("devteria.com")
                .issueTime(issueTime)
                .expirationTime(expirationTime)
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", scope)
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY));
            String token = jwsObject.serialize();
            log.info("Generated token cho user: {} với scope: {}", user.getUsername(), scope);
            return token;
        } catch (JOSEException e) {
            log.error("Cannot create token cho user: {} - JOSE error: {}", user.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo token: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error tạo token cho user: {}", user.getUsername(), e);
            throw new RuntimeException("Lỗi bất ngờ khi tạo token", e);
        }
    }

    public AuthResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyToken(request.getToken(), true);
        var jit = signedJWT.getJWTClaimsSet().getJWTID();
        var expireTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken
                .builder().id(jit).expiryTime(expireTime).build();
        invalidatedTokenRepository.save(invalidatedToken);

        var username = signedJWT.getJWTClaimsSet().getSubject();
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        var tokenRefresh = generateToken(user);
        return AuthResponse.builder().accessToken(tokenRefresh).authenticated(true).build();

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

        log.info("Found user: {} with role: {}", user.getUsername(), user.getRole());

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) {
            log.warn("Invalid password for user: {}", user.getUsername());
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        log.info("User {} authenticated successfully", user.getUsername());

        String token = generateToken(user);

        return AuthResponse.builder()
                .accessToken(token)
                .user(user)
                .authenticated(true)
                .build();
    }

    private String buildScope(User user) {
        if (user.getRole() != null) {
            return "ROLE_" + user.getRole().toString();
        }
        return "ROLE_USER";
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT
                .getJWTClaimsSet()
                .getIssueTime()
                .toInstant()
                .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                .toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date()))) throw new AppException(ErrorCode.UNAUTHENTICATED);


        return signedJWT;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));
    }

    @Cacheable(value = "users", key = "#name != null ? #name : 'null' + '-' + #role != null ? #role.name() : 'null' + '-' + #page + '-' + #size")
    public UserPage searchUsers(String name, User.Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByNameContainingOrRole(name, role, pageable);

        List<UserResponse> userResponses = userPage.getContent().stream()
                .map(userMapper::toUserResponse)
                .toList();

        UserPage dto = new UserPage();
        dto.setUser(userResponses);
        dto.setTotalElements(userPage.getTotalElements());
        dto.setTotalPages(userPage.getTotalPages());
        dto.setCurrentPage(userPage.getNumber());

        System.out.println("Returning UserPage: user=" + userResponses.size() + ", totalElements=" + userPage.getTotalElements() + ", totalPages=" + userPage.getTotalPages() + ", currentPage=" + userPage.getNumber());
        return dto;
    }

    //get info user
    public UserResponse getInfoUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if(user != null){
            return userMapper.toUserResponse(user);
        }
        return null;
    }
}
