package com.shopease.service;

import com.shopease.dto.CartDTOs.*;
import com.shopease.entity.CartItem;
import com.shopease.entity.Product;
import com.shopease.entity.User;
import com.shopease.exception.BadRequestException;
import com.shopease.exception.ResourceNotFoundException;
import com.shopease.repository.CartRepository;
import com.shopease.repository.ProductRepository;
import com.shopease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(Long userId) {
        User user = getUser(userId);
        List<CartItem> cartItems = cartRepository.findByUser(user);
        return buildCartResponse(cartItems);
    }

    @Transactional
    public CartResponse addToCart(Long userId, CartItemRequest request) {
        User user = getUser(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Requested quantity exceeds available stock (" + product.getStock() + ")");
        }

        Optional<CartItem> existingItem = cartRepository.findByUserAndProduct(user, product);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            if (product.getStock() < newQty) {
                throw new BadRequestException("Cannot add more. Total in cart exceeds available stock (" + product.getStock() + ")");
            }
            item.setQuantity(newQty);
            cartRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cartRepository.save(newItem);
        }

        return getCart(userId);
    }

    @Transactional
    public CartResponse updateQuantity(Long userId, Long cartItemId, Integer quantity) {
        if (quantity <= 0) {
            return removeFromCart(userId, cartItemId);
        }

        CartItem cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getUser().getId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        if (cartItem.getProduct().getStock() < quantity) {
            throw new BadRequestException("Requested quantity exceeds available stock (" + cartItem.getProduct().getStock() + ")");
        }

        cartItem.setQuantity(quantity);
        cartRepository.save(cartItem);
        return getCart(userId);
    }

    @Transactional
    public CartResponse removeFromCart(Long userId, Long cartItemId) {
        CartItem cartItem = cartRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getUser().getId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        cartRepository.delete(cartItem);
        return getCart(userId);
    }

    @Transactional
    public void clearCart(Long userId) {
        User user = getUser(userId);
        cartRepository.deleteByUser(user);
    }

    /**
     * Merges a guest's browser-local cart into their newly-authenticated user
     * cart, right after login/register. Quantities for products already in the
     * user's cart are summed with the guest quantities (deduplicating by
     * product), and every merged line is capped at available stock so we never
     * create an over-sell. Guest items are never allowed to overwrite/discard
     * anything already saved against the account - everything is additive.
     */
    @Transactional
    public CartResponse mergeGuestCart(Long userId, List<CartItemRequest> guestItems) {
        User user = getUser(userId);

        for (CartItemRequest guestItem : guestItems) {
            Product product = productRepository.findById(guestItem.getProductId()).orElse(null);
            if (product == null) {
                continue; // product no longer exists - silently skip rather than fail the whole merge
            }

            Optional<CartItem> existingItem = cartRepository.findByUserAndProduct(user, product);
            if (existingItem.isPresent()) {
                CartItem item = existingItem.get();
                int mergedQty = item.getQuantity() + guestItem.getQuantity();
                item.setQuantity(Math.min(mergedQty, Math.max(product.getStock(), 0)));
                if (item.getQuantity() > 0) {
                    cartRepository.save(item);
                }
            } else {
                int qty = Math.min(guestItem.getQuantity(), Math.max(product.getStock(), 0));
                if (qty > 0) {
                    cartRepository.save(CartItem.builder()
                            .user(user)
                            .product(product)
                            .quantity(qty)
                            .build());
                }
            }
        }

        return getCart(userId);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartItemDto> itemDtos = items.stream().map(item -> {
            BigDecimal price = item.getProduct().getPrice();
            BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            return CartItemDto.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .productPrice(price)
                    .productImage(item.getProduct().getImageUrl())
                    .quantity(item.getQuantity())
                    .itemTotal(itemTotal)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal cartTotal = itemDtos.stream()
                .map(CartItemDto::getItemTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = itemDtos.stream()
                .mapToInt(CartItemDto::getQuantity)
                .sum();

        return CartResponse.builder()
                .items(itemDtos)
                .cartTotal(cartTotal)
                .totalQuantity(totalQuantity)
                .build();
    }
}
