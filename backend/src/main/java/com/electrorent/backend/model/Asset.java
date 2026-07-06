package com.electrorent.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Asset name is required")
    @Column(nullable = false, length = 255)
    private String name;

    @NotBlank(message = "Category is required")
    @Column(nullable = false, length = 100)
    private String category;

    @NotBlank(message = "Unique Barcode identifier is required")
    @Column(unique = true, nullable = false, length = 100)
    private String barcode;

    @Column(length = 100)
    private String model;

    @Column(length = 100)
    private String brand;

    @NotNull(message = "Purchase date is required")
    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @NotNull(message = "Purchase cost is required")
    @Min(value = 0, message = "Purchase cost cannot be negative")
    @Column(name = "purchase_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchaseCost;

    @NotNull(message = "Quantity cannot be empty")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Column(nullable = false)
    private Integer quantity;

    @NotNull(message = "Available quantity cannot be empty")
    @Min(value = 0, message = "Available quantity cannot be negative")
    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Column(length = 100)
    private String vendor;

    @Column(length = 255)
    private String location;

    @NotBlank(message = "Tool mechanical condition is required")
    @Column(nullable = false, length = 50)
    @JsonProperty("condition")
    private String toolCondition; // e.g. "Excellent", "Good", "Fair", "Needs Repair"

    @NotBlank(message = "Current checkout status is required")
    @Column(nullable = false, length = 50)
    private String status; // e.g. "Available", "Issued", "Under Maintenance", "Lost"

    @Column(columnDefinition = "TEXT")
    private String notes;
}
