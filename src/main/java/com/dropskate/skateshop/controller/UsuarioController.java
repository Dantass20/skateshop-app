package com.dropskate.skateshop.controller;

import com.dropskate.skateshop.model.Usuario;
import com.dropskate.skateshop.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody Usuario usuario) {
        // Verifica se o e-mail já está registado no Oracle
        Usuario existente = usuarioService.buscarPorEmail(usuario.getEmail());
        if (existente != null) {
            return ResponseEntity.status(400).body("Este e-mail já está cadastrado!");
        }

        Usuario novoUsuario = usuarioService.salvar(usuario);
        return ResponseEntity.ok(novoUsuario);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario usuarioLogin) {
        Usuario usuario = usuarioService.buscarPorEmail(usuarioLogin.getEmail());

        if (usuario != null && usuario.getSenha().equals(usuarioLogin.getSenha())) {
            return ResponseEntity.ok(usuario);
        }

        return ResponseEntity.status(401).body("E-mail ou senha inválidos.");
    }
}