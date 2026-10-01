package com.dropskate.skateshop.controller;

import com.dropskate.skateshop.model.Produto;
import com.dropskate.skateshop.repository.ProdutoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoRepository produtoRepository;

    public ProdutoController(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @GetMapping
    public List<Produto> listar() {
        return produtoRepository.findAll();
    }

    @PostMapping
    public Produto cadastrar(@RequestBody Produto produto) {
        return produtoRepository.save(produto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @RequestBody Produto produtoDetalhes) {
        return produtoRepository.findById(id).map(produto -> {
            produto.setTitle(produtoDetalhes.getTitle());
            produto.setCategory(produtoDetalhes.getCategory());
            produto.setPrice(produtoDetalhes.getPrice());
            produto.setStock(produtoDetalhes.getStock());
            produto.setImage(produtoDetalhes.getImage());
            produto.setDescription(produtoDetalhes.getDescription());
            Produto atualizado = produtoRepository.save(produto);
            return ResponseEntity.ok(atualizado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        if (produtoRepository.existsById(id)) {
            produtoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}