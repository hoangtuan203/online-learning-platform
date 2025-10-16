package com.learning.user_service.mapper;


import com.learning.user_service.dto.AddUserRequest;
import com.learning.user_service.dto.UserResponse;
import com.learning.user_service.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(AddUserRequest request);

    UserResponse toUserResponse(User user);
}
