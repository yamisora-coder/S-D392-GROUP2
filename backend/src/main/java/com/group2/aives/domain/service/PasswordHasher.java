package com.group2.aives.domain.service;

/**
 * Port băm/kiểm tra mật khẩu. Domain chỉ biết abstraction này;
 * thuật toán cụ thể được cài đặt ở tầng infrastructure.
 */
public interface PasswordHasher {
    String hash(String rawPassword);

    boolean matches(String rawPassword, String hashedPassword);
}
