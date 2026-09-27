package com.group2.aives.repository;

import com.group2.aives.entity.User;
import com.group2.aives.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCode(String code);
    List<User> findByRole(Role role);
}
