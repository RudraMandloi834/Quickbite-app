package com.quickbite.auth;

public record ResetPasswordRequest(String token, String newPassword) {}
