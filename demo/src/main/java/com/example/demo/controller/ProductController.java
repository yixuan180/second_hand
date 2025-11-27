package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // 允許前端跨網域呼叫
public class ProductController {

    @Autowired
    private ProductService productService;

    // 1. 取得所有商品 (對應 products.html)
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productService.listAll();
    }

    // 2. 取得單一商品詳情 (對應 product_detail.html)
    @GetMapping("/products/{index}")
    public ResponseEntity<?> getProductByIndex(@PathVariable int index) {
        Product product = productService.findByIndex(index);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 3. 商品上架 (對應 upload.html)
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        // 為了簡化，這裡假設前端傳來的 product 已經包含了 seller 資訊
        // 實際開發通常會從 Session 或 Token 抓取當前使用者
        
        String result = productService.createProduct(
                product.getSeller(),
                product.getName(),
                product.getBrand(),
                product.getPrice(),
                product.getConditionLevel(),
                product.getDescription(),
                product.getCategory(),
                product.getMeetLocation(),
                product.getImagePaths()
        );

        if (result == null) {
            // result 為 null 代表沒有錯誤訊息，成功！
            return ResponseEntity.ok(Map.of("message", "上架成功"));
        } else {
            // 回傳錯誤訊息
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
    }
}