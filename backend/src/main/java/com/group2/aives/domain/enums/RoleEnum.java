package com.group2.aives.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum RoleEnum {
    ADMIN,
    LECTURER,
    STUDENT;

    @JsonCreator
    public static RoleEnum fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if ("INSTRUCTOR".equals(normalized) || "TEACHER".equals(normalized)) {
            return LECTURER;
        }
        for (RoleEnum r : values()) {
            if (r.name().equals(normalized)) {
                return r;
            }
        }
        return STUDENT;
    }
}
