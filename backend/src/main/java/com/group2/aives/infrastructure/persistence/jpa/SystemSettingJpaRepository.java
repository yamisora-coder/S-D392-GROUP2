package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.SystemSetting;import org.springframework.data.jpa.repository.JpaRepository;
public interface SystemSettingJpaRepository extends JpaRepository<SystemSetting,String> {}
