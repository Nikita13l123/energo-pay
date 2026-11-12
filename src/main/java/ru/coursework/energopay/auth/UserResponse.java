package ru.coursework.energopay.auth;

import ru.coursework.energopay.user.Role;
import ru.coursework.energopay.user.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String fio,
        String email,
        Role role,
        LocalDateTime createdAt
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFio(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
