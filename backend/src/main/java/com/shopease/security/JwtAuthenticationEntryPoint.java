package com.shopease.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopease.exception.ErrorDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Ensures that hitting a protected endpoint without a valid access token
 * returns a consistent 401 JSON body instead of Spring Security's default
 * (which would otherwise be an empty 403).
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorDetails errorDetails = new ErrorDetails(
                LocalDateTime.now(),
                "Authentication is required to access this resource",
                request.getRequestURI()
        );
        response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
    }
}
