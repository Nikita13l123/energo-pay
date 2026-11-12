package ru.coursework.energopay.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import ru.coursework.energopay.user.UserRepository;
import ru.coursework.energopay.user.UserService;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    private final UserRepository repository;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contexts;

    public AuthController(UserService users, UserRepository repository,
                          AuthenticationManager authenticationManager, SecurityContextRepository contexts) {
        this.users = users;
        this.repository = repository;
        this.authenticationManager = authenticationManager;
        this.contexts = contexts;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(users.register(request)));
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest body,
                              HttpServletRequest request, HttpServletResponse response) {
        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        body.email().trim().toLowerCase(Locale.ROOT), body.password()));
        // Start a fresh session so a pre-login session ID cannot be reused.
        var previousSession = request.getSession(false);
        if (previousSession != null) previousSession.invalidate();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return me(authentication);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return UserResponse.from(repository.findByEmailIgnoreCase(authentication.getName()).orElseThrow());
    }
}
