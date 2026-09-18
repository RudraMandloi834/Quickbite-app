package com.quickbite.restaurant;

public record ApprovalResponse(Restaurant restaurant, String username, String temporaryPassword) {}
