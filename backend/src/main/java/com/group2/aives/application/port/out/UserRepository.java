package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.Role;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRolesContains(Role role);
    List<User> findByRoles_RoleName(RoleEnum roleName);
}
