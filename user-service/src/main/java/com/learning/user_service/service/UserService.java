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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserService {

    @Autowired
    private EmailService emailService;
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

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String GOOGLE_CLIENT_ID;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String GOOGLE_CLIENT_SECRET;

    @Value("${spring.security.oauth2.client.registration.facebook.client-id}")
    private String FACEBOOK_CLIENT_ID;

    @Value("${spring.security.oauth2.client.registration.facebook.client-secret}")
    private String FACEBOOK_CLIENT_SECRET;

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

    public Optional<User> findByEmail(String email){
        return userRepository.findByEmail(email);
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

    public User createUserWithOtp(AddUserRequest request) {  // Đổi tên method để rõ ràng
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email đã tồn tại: " + request.getEmail());
        }

        String username = request.getUsername();
        if (username == null || username.isEmpty()) {
            username = request.getEmail().split("@")[0];
        }

        User user = new User();
        user.setUsername(username);
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? User.Role.valueOf(request.getRole()) : User.Role.STUDENT);
        user.setActive(false);  // Chưa active

        String otp = User.generateOTP();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        // Lưu user
        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ: " + e.getMessage());
        }

        emailService.sendOtpEmail(user.getEmail(), otp);

        return user;
    }

    public boolean verifyOtp(String email, String otp) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (user.isOtpValid(otp)) {
                user.clearOtp();  // Clear OTP và active user
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }

    public ResponseEntity<?> authenticateWithGoogle(String code) {
        if (code == null) {
            return ResponseEntity.badRequest().body("No code provided");
        }

        try {
            // Exchange code để lấy tokens (access_token và id_token)
            Map<String, Object> tokens = exchangeCodeForGoogleTokens(code);
            String accessToken = (String) tokens.get("access_token");
            String idToken = (String) tokens.get("id_token");

            // Lấy user info từ id_token (verify an toàn hơn access_token)
            Map<String, Object> userInfo = verifyAndGetUserInfoFromGoogleIdToken(idToken);
            return handleOAuth2User(userInfo, "google", accessToken, idToken);
        } catch (Exception e) {
            log.error("Error during Google authentication: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error during Google login: " + e.getMessage());
        }
    }

    public ResponseEntity<?> authenticateWithFacebook(String code) {
        if (code == null) {
            return ResponseEntity.badRequest().body("No code provided");
        }

        try {
            String accessToken = getAccessTokenFromFacebook(code);
            Map<String, Object> userInfo = getUserInfoFromFacebook(accessToken);
            return handleOAuth2User(userInfo, "facebook", accessToken, null); // Facebook không có id_token
        } catch (Exception e) {
            log.error("Error during Facebook authentication: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error during Facebook login: " + e.getMessage());
        }
    }

    private ResponseEntity<?> handleOAuth2User(Map<String, Object> userInfo, String provider, String accessToken, String idToken) {
        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String picture = (String) userInfo.get("picture");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không lấy được email từ provider"));
        }

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Cập nhật thông tin nếu cần
            if (!user.getName().equals(name)) {
                user.setName(name);
            }
            if (user.getAvatarUrl() == null || !user.getAvatarUrl().equals(picture)) {
                user.setAvatarUrl(picture);
            }
            userRepository.save(user);

            TokenInfo tokenInfo = generateToken(user);
            return ResponseEntity.ok(Map.of(
                    "userId", user.getId(),
                    "token", tokenInfo.token(),
                    "accessToken", accessToken,
                    "idToken", idToken != null ? idToken : "", // Thêm nếu có
                    "expiryTime", tokenInfo.expiryDate(),
                    "email", email,
                    "name", user.getName(),
                    "picture", picture
            ));
        }

        // Tạo user mới
        User newUser = new User();
        newUser.setName(name);
        newUser.setUsername(generateUniqueUsername(name, email)); // Tạo username unique
        newUser.setPassword("oauth2_default_" + System.currentTimeMillis()); // Random, không dùng
        newUser.setEmail(email);
        newUser.setProvider(provider);
        newUser.setAvatarUrl(picture);
        newUser.setRole(User.Role.STUDENT);
        newUser.setActive(true); // Active ngay cho OAuth
        User savedUser = userRepository.save(newUser);

        TokenInfo tokenInfo = generateToken(savedUser);

        return ResponseEntity.ok(Map.of(
                "userId", savedUser.getId(),
                "token", tokenInfo.token(),
                "accessToken", accessToken,
                "idToken", idToken != null ? idToken : "",
                "expiryTime", tokenInfo.expiryDate(),
                "email", email,
                "name", name,
                "picture", picture
        ));
    }

    // Helper để tạo username unique (ví dụ: name + random hoặc email prefix)
    private String generateUniqueUsername(String name, String email) {
        String base = name.toLowerCase().replaceAll("[^a-z0-9]", "");
        String username = base;
        int counter = 1;
        while (userRepository.existsByUsername(username)) {
            username = base + counter;
            counter++;
        }
        return username;
    }

    private Map<String, Object> exchangeCodeForGoogleTokens(String code) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        String tokenUrl = "https://oauth2.googleapis.com/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", GOOGLE_CLIENT_ID);
        params.add("client_secret", GOOGLE_CLIENT_SECRET);
        params.add("redirect_uri", "http://localhost:5173/oauth2/redirect");
        params.add("grant_type", "authorization_code");
        log.info("Exchange Google code - length: {}, client_id: {}, redirect_uri: http://localhost:5173/oauth2/redirect", code.length(), GOOGLE_CLIENT_ID);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            Map<String, Object> errorBody = response.getBody();
            String error = (String) errorBody.get("error");
            String errorDesc = (String) errorBody.get("error_description");
            log.error("Google exchange failed: {} - {}", error, errorDesc);
            if ("invalid_grant".equals(error)) {
                throw new Exception("Code invalid/expired. Kiểm tra redirect_uri và thử lại trong 10 phút: " + errorDesc);
            }
            throw new Exception("Failed to exchange code: " + errorDesc);
        }

        return response.getBody();
    }

    // Verify id_token và lấy user info từ Google /tokeninfo
    private Map<String, Object> verifyAndGetUserInfoFromGoogleIdToken(String idToken) throws Exception {
        if (idToken == null || idToken.isEmpty()) {
            throw new Exception("No id_token provided");
        }

        RestTemplate restTemplate = new RestTemplate();
        String tokenInfoUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo";
        String verifyUrl = UriComponentsBuilder.fromHttpUrl(tokenInfoUrl)
                .queryParam("id_token", idToken)
                .toUriString();

        log.info("Verifying Google id_token (length: {})", idToken.length());

        ResponseEntity<Map> response = restTemplate.getForEntity(verifyUrl, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            log.error("Google tokeninfo failed: {}", response.getBody());
            throw new Exception("Invalid id_token: " + response.getBody());
        }

        return response.getBody();
    }

    private String getAccessTokenFromFacebook(String code) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        String tokenUrl = "https://graph.facebook.com/v12.0/oauth/access_token"
                + "?client_id=" + FACEBOOK_CLIENT_ID
                + "&client_secret=" + FACEBOOK_CLIENT_SECRET
                + "&redirect_uri=http://localhost:5173/oauth2/callback/facebook"
                + "&code=" + code;

        ResponseEntity<Map> response = restTemplate.getForEntity(tokenUrl, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Failed to fetch access token");
        }

        return (String) response.getBody().get("access_token");
    }

    private Map<String, Object> getUserInfoFromGoogle(String accessToken) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Failed to fetch user info");
        }

        return response.getBody();
    }

    private Map<String, Object> getUserInfoFromFacebook(String accessToken) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        String userInfoUrl = "https://graph.facebook.com/me?fields=id,name,email,picture";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Failed to fetch user info");
        }

        return response.getBody();
    }


    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại với ID: " + id));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            if (!request.getUsername().equals(user.getUsername())) {
                if (userRepository.existsByUsername(request.getUsername())) {
                    throw new IllegalArgumentException("Username đã tồn tại");
                }
            }
            user.setUsername(request.getUsername().trim());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (!request.getEmail().equals(user.getEmail())) {
                if (userRepository.existsByEmail(request.getEmail())) {
                    throw new IllegalArgumentException("Email đã tồn tại");
                }
            }
            user.setEmail(request.getEmail().trim());
        }

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Update role if provided (assuming admin-only, but no check here for simplicity)
        if (request.getRole() != null) {
            try {
                user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Role không hợp lệ: " + request.getRole());
            }
        }

        // Update updatedAt
        user.setUpdatedAt(LocalDateTime.now());

        try {
            User updatedUser = userRepository.save(user);
            return userMapper.toUserResponse(updatedUser);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật user: " + e.getMessage());
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


    public TokenInfo generateToken(User user) {
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
            keyBytes = SIGNER_KEY.getBytes(StandardCharsets.UTF_8); // Explicit UTF-8
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
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes(StandardCharsets.UTF_8))); // Fix: Explicit UTF-8
            String serializedToken = jwsObject.serialize();
            log.info("Generated token for user {}: {} (length: {}, parts: {})",
                    user.getUsername(),
                    serializedToken.substring(0, Math.min(50, serializedToken.length())) + "...",
                    serializedToken.length(),
                    serializedToken.split("\\.").length); // Debug: Check 3 parts (header.payload.signature)
            return new TokenInfo(serializedToken, expirationTime);
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

        TokenInfo tokenRefresh = generateToken(user);
        return AuthResponse.builder().accessToken(tokenRefresh.token).authenticated(true).build();

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

        TokenInfo token = generateToken(user);

        return AuthResponse.builder()
                .accessToken(token.token)
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
        if (token == null || token.trim().isEmpty()) {
            log.error("Token null or empty in verifyToken");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Validate JWT format: header.payload.signature (3 parts separated by 2 dots)
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            log.error("Invalid JWT format - missing delimiters. Parts count: {}, token preview: {}", parts.length, token.substring(0, Math.min(50, token.length())) + "...");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        log.debug("Verifying token preview: {} (length: {}, parts: {})", token.substring(0, Math.min(50, token.length())) + "...", token.length(), parts.length);

        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes(StandardCharsets.UTF_8)); // Fix: Explicit UTF-8

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime().toInstant().plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS).toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date()))) {
            log.warn("Token verification failed for sub: {}", signedJWT.getJWTClaimsSet().getSubject());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

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

        System.out.println("Returning Use rPage: user=" + userResponses.size() + ", totalElements=" + userPage.getTotalElements() + ", totalPages=" + userPage.getTotalPages() + ", currentPage=" + userPage.getNumber());
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