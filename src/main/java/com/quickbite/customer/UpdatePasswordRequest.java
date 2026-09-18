package com.quickbite.customer;

public record UpdatePasswordRequest(String currentPassword, String newPassword) {
}
