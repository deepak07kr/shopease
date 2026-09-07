package com.shopease.entity;

/**
 * Distinguishes what an outstanding OTP code on a User was issued for,
 * so a code generated for one purpose can never be replayed for another.
 */
public enum OtpPurpose {
    VERIFY_ACCOUNT,
    RESET_PASSWORD
}
