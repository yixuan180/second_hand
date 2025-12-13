package com.example.demo.repository;

import com.example.demo.model.Product;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class ProductRepository {

    private List<Product> products = new ArrayList<>();
    private AtomicLong idCounter = new AtomicLong(1); // ID 計數器
    
    public void save(Product product) {
        // 如果是新商品（ID 為 null），自動分配 ID
        if (product.getId() == null) {
            product.setId(idCounter.getAndIncrement());
            products.add(product);
        } else {
            // 如果 ID 存在，則更新現有商品
            for (int i = 0; i < products.size(); i++) {
                if (products.get(i).getId() != null && products.get(i).getId().equals(product.getId())) {
                    products.set(i, product);
                    return;
                }
            }
            // 如果沒找到，仍然添加新商品
            products.add(product);
        }
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
    
    // 根據 ID 查找商品
    public Product findById(long id) {
        for (Product p : products) {
            if (p.getId() != null && p.getId().equals(id)) {
                return p;
            }
        }
        return null;
    }
    
}
