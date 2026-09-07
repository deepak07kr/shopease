package com.shopease.repository;

import com.shopease.entity.Order;
import com.shopease.entity.OrderStatus;
import com.shopease.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'PAID' OR o.status = 'SHIPPED' OR o.status = 'DELIVERED'")
    BigDecimal calculateTotalRevenue();

    Long countByStatus(OrderStatus status);
}
