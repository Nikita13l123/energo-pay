package ru.coursework.energopay.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Имя обязательно")
        @Size(max = 50, message = "Имя должно содержать не более 100 символов")
        String fio,

        @NotBlank(message = "Email обязателен")
        @Email(message = "Некорректный email")
        @Size(max = 100, message = "Email должен содержать не более 100 символов")
        String email,

        @NotBlank(message = "Пароль обязателен")
        @Size(min = 8, max = 30, message = "Пароль должен содержать от 8 до 30 символов")
        String password
) {}