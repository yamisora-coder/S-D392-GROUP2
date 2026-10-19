package com.group2.aives.domain.repository;

import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.Role;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends BaseRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCode(String code);
    List<User> findByRole(Role role);
}
