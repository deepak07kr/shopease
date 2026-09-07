package com.shopease.exception;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class ErrorDetails {
    private boolean success = false;
    private LocalDateTime timestamp;
    private String message;
    private String path;
    private Map<String, String> errors;

    public ErrorDetails(LocalDateTime timestamp, String message, String path) {
        this.timestamp = timestamp;
        this.message = message;
        this.path = path;
    }

    public ErrorDetails(LocalDateTime timestamp, String message, String path, Map<String, String> errors) {
        this.timestamp = timestamp;
        this.message = message;
        this.path = path;
        this.errors = errors;
    }
}
