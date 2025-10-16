package com.learning.user_service.controller;

import com.learning.user_service.dto.AuthResponse;
import com.learning.user_service.dto.LoginRequest;
import com.learning.user_service.dto.UserPage;
import com.learning.user_service.entity.User;
import com.learning.user_service.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Controller
public class UserGraphQLController {

    @Autowired
    private UserService userService;

    @QueryMapping
    public UserPage findAllUsers(@Argument Integer page, @Argument Integer size) {
        return userService.findAllUsers(page != null ? page : 0, size != null ? size : 5);
    }


    @MutationMapping
    public AuthResponse login(@Argument("input") LoginRequest request) {
        try {
            if (request == null || request.getUsername() == null || request.getPassword() == null) {
                throw new IllegalArgumentException("Username và password không được null");
            }
            return userService.authenticate(request);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {

            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi đăng nhập: " + e.getMessage());
        }
    }

    @QueryMapping
    public User getUserById(@Argument Long id) {
        return userService.getUserById(id);
    }

    @QueryMapping
    public UserPage searchUsers(
            @Argument String name,
            @Argument User.Role role,
            @Argument Integer page,
            @Argument Integer size) {
        if ((name == null || name.trim().isEmpty()) && role == null) {
            throw new IllegalArgumentException("At least one of name or role is required");
        }
        int effectivePage = (page != null) ? page : 0;
        int effectiveSize = (size != null) ? size : 5;
        return userService.searchUsers(name, role, effectivePage, effectiveSize);
    }

}
