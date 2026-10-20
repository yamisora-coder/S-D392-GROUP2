package com.group2.aives.domain.model;
import jakarta.persistence.*;import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor
public class SystemSetting {@Id private String id;@Column(columnDefinition="TEXT",nullable=false) private String valueJson;}
