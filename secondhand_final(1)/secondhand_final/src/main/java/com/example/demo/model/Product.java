package com.example.demo.model;

import java.util.List;
import com.example.demo.model.Member;
import lombok.Data;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;

@Entity
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;  
    private String description;                  
    private double price;   
    private String sellerUsername;   
    private String contactInfo;      
    private String conditionLevel;   
    private String brand;     
    private String category;            
    private String meetLocation;
    private String tradeTime; 
    private Member seller;

    @ElementCollection 
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id")) // 指定儲存圖片路徑的表名和關聯方式
    @Column(name = "image_path") 
    private List<String> imagePaths; 
    
    private boolean approved = false; // 審核狀態，預設為未審核
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED
    private String rejectionReason; // 拒絕原因
    
    public Product(String name,
                   String brand,
                   double price,
                   String conditionLevel,
                   String description,
                   String category,
                   String meetLocation,
                   List<String> imagePaths,
                   Member seller
    ){
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.conditionLevel = conditionLevel;
        this.description = description;
        this.category = category;
        this.meetLocation = meetLocation;
        this.imagePaths = imagePaths;
        this.seller = seller;
    }

    public String getName() { return name; }
    public String getBrand() { return brand; }
    public double getPrice() { return price; }
    public String getConditionLevel() { return conditionLevel; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getMeetLocation() { return meetLocation; }
    public List<String> getImagePaths() { return imagePaths; }
    public Member getSeller() { return seller; }
    public Long getId() { return id; }
    public String getTradeTime() { return tradeTime; }
    
    public void setId(Long id) { this.id = id; }
    public void setTradeTime(String tradeTime) { this.tradeTime = tradeTime; }

    public void setSeller(Member seller) {
        this.seller = seller;
    }
    
    public boolean isApproved() {
        return approved;
    }
    
    public void setApproved(boolean approved) {
        this.approved = approved;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
