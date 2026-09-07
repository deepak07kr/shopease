package com.shopease.security;

import com.shopease.exception.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * This is intentionally dependency-free (no Redis) so the auth system works
 * out of the box in a single-instance Docker Compose deployment. If ShopEase
 * is ever scaled horizontally across multiple backend instances, replace the
 * backing map with a shared store (e.g. Redis) - the call sites in
 * AuthService would not need to change.
 */
@Component
public class RateLimiterService {

    private final ConcurrentHashMap<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    /**
     * Records a hit for {@code key} and throws if more than {@code maxAttempts}
     * have occurred within the trailing {@code windowSeconds}.
     */
    public void checkAndRecord(String key, int maxAttempts, long windowSeconds, String message) {
        Deque<Instant> timestamps = hits.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(windowSeconds);

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxAttempts) {
                throw new TooManyRequestsException(message);
            }
            timestamps.addLast(now);
        }
    }

    /**
     * Same as {@link #checkAndRecord} but returns false instead of throwing when
     * the limit is exceeded. Useful for endpoints (like forgot-password) where a
     * distinguishable error response would enable account enumeration.
     */
    public boolean tryRecord(String key, int maxAttempts, long windowSeconds) {
        Deque<Instant> timestamps = hits.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(windowSeconds);

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxAttempts) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }

    /** Clears attempts for a key, e.g. after a successful login. */
    public void reset(String key) {
        hits.remove(key);
    }
}
