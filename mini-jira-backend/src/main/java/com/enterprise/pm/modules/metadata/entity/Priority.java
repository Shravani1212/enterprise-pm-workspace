package com.enterprise.pm.modules.metadata.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "priorities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Priority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "level", nullable = false, unique = true)
    private int level;

    @Column(name = "color", nullable = false, length = 20)
    @Builder.Default
    private String color = "#64748b";

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
