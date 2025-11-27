package com.example.demo.repository;

import com.example.demo.model.Product;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ProductRepository {

    private List<Product> products = new ArrayList<>();
    
    public void save(Product product) {
        products.add(product);
    }

    // 顯示所有商品列表
    public List<Product> findAll() {
        return products;
    }

    // 查看商品詳情
    public Product findByIndex(int index) {
        if (index >= 0 && index < products.size()) {
            return products.get(index);
        }
        return null; 
    }
    
}
