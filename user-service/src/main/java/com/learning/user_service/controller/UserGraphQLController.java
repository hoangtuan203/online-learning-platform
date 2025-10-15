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
    public User addUser(
            @Argument String username,
            @Argument String name,
            @Argument String email,
            @Argument String password,
            @Argument User.Role role
            ) {
        return userService.addUser(username, name, email, password, role);
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

}
