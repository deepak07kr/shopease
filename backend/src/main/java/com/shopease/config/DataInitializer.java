package com.shopease.config;

import com.shopease.entity.Category;
import com.shopease.entity.Product;
import com.shopease.entity.Role;
import com.shopease.entity.User;
import com.shopease.repository.CategoryRepository;
import com.shopease.repository.ProductRepository;
import com.shopease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (categoryRepository.count() == 0) {
            seedCategoriesAndProducts();
        }
    }

    private void seedUsers() {
        User admin = User.builder()
                .name("Admin User")
                .email("admin@shopease.com")
                .phone("+10000000001")
                .password(passwordEncoder.encode("Admin@123"))
                .role(Role.ROLE_ADMIN)
                .enabled(true)
                .verified(true)
                .build();
        userRepository.save(admin);

        User user = User.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("+10000000002")
                .password(passwordEncoder.encode("User@1234"))
                .role(Role.ROLE_USER)
                .enabled(true)
                .verified(true)
                .build();
        userRepository.save(user);
    }

    private void seedCategoriesAndProducts() {
        Category electronics = categoryRepository.save(Category.builder().name("Electronics").description("Gadgets, Devices, and Consumer Electronics").build());
        Category fashion = categoryRepository.save(Category.builder().name("Fashion").description("Clothing, Footwear, and Accessories").build());
        Category home = categoryRepository.save(Category.builder().name("Home & Living").description("Furniture, Decor, and Appliances").build());
        Category books = categoryRepository.save(Category.builder().name("Books").description("Fiction, Non-Fiction, and Educational Books").build());

        productRepository.save(Product.builder()
                .name("Wireless Noise-Canceling Headphones")
                .description("Premium over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.")
                .price(new BigDecimal("4999.00"))
                .stock(45)
                .category(electronics)
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Smart Fitness Watch Ultra")
                .description("Waterproof smartwatch with AMOLED display, heart rate monitor, GPS, and sleep tracking.")
                .price(new BigDecimal("2999.00"))
                .stock(30)
                .category(electronics)
                .imageUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Ultra-Thin 15.6\" Laptop")
                .description("Intel Core i7, 16GB RAM, 512GB SSD, FHD IPS Display, lightweight aluminum chassis.")
                .price(new BigDecimal("64999.00"))
                .stock(12)
                .category(electronics)
                .imageUrl("https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Classic Leather Jacket")
                .description("100% genuine leather jacket with asymmetric zipper closure and comfortable inner lining.")
                .price(new BigDecimal("3499.00"))
                .stock(20)
                .category(fashion)
                .imageUrl("https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Urban Runner Sneakers")
                .description("Lightweight breathable running shoes with high-density cushioning and non-slip sole.")
                .price(new BigDecimal("1899.00"))
                .stock(50)
                .category(fashion)
                .imageUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Ergonomic Mesh Office Chair")
                .description("High-back mesh chair with adjustable lumbar support, 3D armrests, and recline function.")
                .price(new BigDecimal("8999.00"))
                .stock(15)
                .category(home)
                .imageUrl("https://images.unsplash.com/photo-1580481072645-022f9a6d1296?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Automatic Espresso Coffee Machine")
                .description("15-bar pressure Italian pump espresso maker with milk frother and dual temperature control.")
                .price(new BigDecimal("12499.00"))
                .stock(8)
                .category(home)
                .imageUrl("https://images.unsplash.com/photo-1517668808822-9ebe02f2a698?w=600")
                .build());

        productRepository.save(Product.builder()
                .name("Clean Code by Robert C. Martin")
                .description("A Handbook of Agile Software Craftsmanship - Essential reading for professional software engineers.")
                .price(new BigDecimal("699.00"))
                .stock(100)
                .category(books)
                .imageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600")
                .build());
    }
}
