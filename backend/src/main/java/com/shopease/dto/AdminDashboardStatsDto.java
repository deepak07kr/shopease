package com.shopease.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsDto {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalUsers;
    private Long totalProducts;
    private Long pendingOrders;
    private Long paidOrders;
    private Long shippedOrders;
    private Long lowStockProductsCount;
}
