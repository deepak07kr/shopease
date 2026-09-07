package com.shopease.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopease.exception.ErrorDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Returns a consistent 403 JSON body when an authenticated user's role does
 * not permit access (e.g. a USER hitting an /api/admin/** endpoint).
 */
@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorDetails errorDetails = new ErrorDetails(
                LocalDateTime.now(),
                "You do not have permission to access this resource",
                request.getRequestURI()
        );
        response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
    }
}
