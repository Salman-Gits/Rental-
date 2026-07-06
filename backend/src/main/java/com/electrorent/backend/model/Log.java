package com.electrorent.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "operation_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Log {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "log_code", unique = true, nullable = false, length = 50)
    private String logCode; // e.g. "LOG-501"

    @Column(name = "asset_id", nullable = false)
    private Long assetId;

    @Column(name = "asset_name", nullable = false, length = 255)
    private String assetName;

    @Column(nullable = false, length = 100)
    private String barcode;

    @Column(nullable = false, length = 100)
    private String client;

    @Column(nullable = false, length = 100)
    private String employee;

    @Column(name = "project_site", length = 255)
    private String projectSite;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "tool_condition", length = 50)
    private String toolCondition;

    @Column(name = "checkout_date", nullable = false)
    private LocalDate checkoutDate;

    @Column(name = "checkout_time", nullable = false)
    private LocalTime checkoutTime;

    @Column(name = "checkin_date")
    private LocalDate checkinDate;

    @Column(name = "checkin_time")
    private LocalTime checkinTime;

    @Column(name = "returned_by", length = 100)
    private String returnedBy;

    @Column(name = "received_by", length = 100)
    private String receivedBy;

    @Column(name = "issued_by", length = 100)
    private String issuedBy;

    @Column(name = "days_used")
    private Integer daysUsed;

    @Column(nullable = false, length = 50)
    private String status; // e.g. "Active", "Returned"

    @Column(columnDefinition = "TEXT")
    private String remarks;
}
