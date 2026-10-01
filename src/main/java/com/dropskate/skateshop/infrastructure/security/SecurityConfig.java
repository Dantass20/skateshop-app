package com.dropskate.skateshop.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Desativa o CSRF para permitir requisições POST do front-end
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login.html", "/index.html", "/admin.html", "/css/**", "/js/**", "/img/**", "/api/usuarios/**", "/api/produtos/**").permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}