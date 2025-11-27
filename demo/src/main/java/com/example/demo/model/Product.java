package com.example.demo.model;
import java.util.List;

public class Product {

    private String name;            
    private String brand;            
    private double price;            
    private String conditionLevel;   
    private String description;     
    private String category;            
    private String meetLocation;
    private List<String> imagePaths;
    private User seller; 

public Product(String name,
        String brand,
        double price,
        String conditionLevel,
        String description,
        String category,
        String meetLocation,
        List<String> imagePaths,
        User seller
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
    public User getSeller() { return seller; }
}
