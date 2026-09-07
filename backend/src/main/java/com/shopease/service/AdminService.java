package com.shopease.service;

import com.shopease.dto.AdminDashboardStatsDto;
import com.shopease.dto.UserDto;
import com.shopease.entity.OrderStatus;
import com.shopease.entity.Product;
import com.shopease.repository.OrderRepository;
import com.shopease.repository.ProductRepository;
import com.shopease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public AdminDashboardStatsDto getDashboardStats() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        Long totalOrders = orderRepository.count();
        Long totalUsers = userRepository.count();
        Long totalProducts = productRepository.count();

        Long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        Long paidOrders = orderRepository.countByStatus(OrderStatus.PAID);
        Long shippedOrders = orderRepository.countByStatus(OrderStatus.SHIPPED);

        Long lowStockProductsCount = productRepository.findAll().stream()
                .filter(p -> p.getStock() < 10)
                .count();

        return AdminDashboardStatsDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalUsers(totalUsers)
                .totalProducts(totalProducts)
                .pendingOrders(pendingOrders)
                .paidOrders(paidOrders)
                .shippedOrders(shippedOrders)
                .lowStockProductsCount(lowStockProductsCount)
                .build();
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
