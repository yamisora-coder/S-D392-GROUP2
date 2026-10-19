package com.group2.aives.domain.model;

import com.group2.aives.domain.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false, unique = true)
    private String code; // MSSV hoặc Mã Giảng viên

    // Mật khẩu đã băm (PBKDF2). Nullable để tương thích dữ liệu cũ khi ddl-auto=update.
    @Column(name = "password_hash")
    private String passwordHash;

    // Trạng thái tài khoản: null/true = ACTIVE, false = LOCKED
    @Column(name = "active")
    private Boolean active;

    public boolean isAccountActive() {
        return active == null || active;
    }

    public void changeRole(Role newRole) {
        if (newRole == null) {
            throw new IllegalArgumentException("Vai trò (Role) không được để trống!");
        }
        this.role = newRole;
    }

    public void toggleActive() {
        this.active = !isAccountActive();
    }

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
