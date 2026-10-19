package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.Role;
import com.group2.aives.domain.repository.UserRepository;
import com.group2.aives.infrastructure.persistence.jpa.SpringDataUserRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepositoryAdapter extends JpaRepositoryAdapter<User, UUID> implements UserRepository {

    private final SpringDataUserRepository jpa;

    public UserRepositoryAdapter(SpringDataUserRepository jpa) {
        super(jpa);
        this.jpa = jpa;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpa.findByEmail(email);
    }

    @Override
    public Optional<User> findByCode(String code) {
        return jpa.findByCode(code);
    }

    @Override
    public List<User> findByRole(Role role) {
        return jpa.findByRole(role);
    }
}
