package com.learning.user_service.graphql;

import com.learning.user_service.entity.User;
import com.learning.user_service.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
public class UserGrahqlController {
    @Autowired
    private UserService userService;
    @QueryMapping
    public User getUserById(@Argument Long id) {
        return userService.getUserById(id);
    }
}
