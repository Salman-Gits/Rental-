package com.electrorent.backend.controller;

import com.electrorent.backend.model.Asset;
import com.electrorent.backend.model.Log;
import com.electrorent.backend.repository.AssetRepository;
import com.electrorent.backend.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private AssetRepository assetRepository;

    // Retrieve all checkout & check-in transaction ledgers
    @GetMapping
    public List<Log> getAllLogs() {
        return logRepository.findAll();
    }

    // Process a tool checkout dispatch
    @PostMapping("/checkout")
    public ResponseEntity<?> checkoutTool(@RequestBody Map<String, Object> payload) {
        try {
            Long assetId = Long.valueOf(payload.get("assetId").toString());
            String client = payload.get("client").toString();
            String employee = payload.get("employee").toString();
            String projectSite = payload.getOrDefault("projectSite", "Depot Site").toString();
            Integer quantity = Integer.valueOf(payload.getOrDefault("quantity", "1").toString());
            String notes = payload.getOrDefault("remarks", "").toString();
            String issuedBy = payload.getOrDefault("issuedBy", "Operations Terminal").toString();

            Optional<Asset> assetOpt = assetRepository.findById(assetId);
            if (assetOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Target asset ID not found in inventory register."));
            }

            Asset asset = assetOpt.get();

            if (asset.getAvailableQuantity() < quantity) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Insufficient available stock. Available: " 
                                + asset.getAvailableQuantity() + ", Requested: " + quantity));
            }

            // Deduct from available quantity and update asset status if fully leased
            asset.setAvailableQuantity(asset.getAvailableQuantity() - quantity);
            if (asset.getAvailableQuantity() == 0) {
                asset.setStatus("Issued");
            }
            assetRepository.save(asset);

            // Create a unique log tracking code
            long logCount = logRepository.count();
            String logCode = "LOG-" + (500 + logCount + 1);

            Log log = Log.builder()
                    .logCode(logCode)
                    .assetId(asset.getId())
                    .assetName(asset.getName())
                    .barcode(asset.getBarcode())
                    .client(client)
                    .employee(employee)
                    .projectSite(projectSite)
                    .quantity(quantity)
                    .toolCondition(asset.getToolCondition())
                    .checkoutDate(LocalDate.now())
                    .checkoutTime(LocalTime.now())
                    .status("Active")
                    .issuedBy(issuedBy)
                    .remarks(notes)
                    .build();

            Log savedLog = logRepository.save(log);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedLog);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid request payload or data types: " + e.getMessage()));
        }
    }

    // Process a tool check-in return
    @PostMapping("/checkin/{id}")
    public ResponseEntity<?> checkinTool(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        Optional<Log> logOpt = logRepository.findById(id);
        if (logOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Lease record ID not found."));
        }

        Log log = logOpt.get();
        if ("Returned".equalsIgnoreCase(log.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "This tool lease record is already marked as Returned."));
        }

        String returnedBy = payload.getOrDefault("returnedBy", log.getEmployee()).toString();
        String receivedBy = payload.getOrDefault("receivedBy", "Operations Desk").toString();
        String returnCondition = payload.getOrDefault("toolCondition", log.getToolCondition()).toString();
        String remarks = payload.getOrDefault("remarks", "").toString();

        Optional<Asset> assetOpt = assetRepository.findById(log.getAssetId());
        if (assetOpt.isPresent()) {
            Asset asset = assetOpt.get();
            
            // Refund the checked-out quantity back to inventory availability
            asset.setAvailableQuantity(asset.getAvailableQuantity() + log.getQuantity());
            asset.setToolCondition(returnCondition);
            
            // Change status back to Available if some are back
            if (asset.getAvailableQuantity() > 0 && "Issued".equalsIgnoreCase(asset.getStatus())) {
                asset.setStatus("Available");
            }
            assetRepository.save(asset);
        }

        // Fill in details for returned lease
        LocalDate today = LocalDate.now();
        log.setCheckinDate(today);
        log.setCheckinTime(LocalTime.now());
        log.setReturnedBy(returnedBy);
        log.setReceivedBy(receivedBy);
        log.setToolCondition(returnCondition);
        log.setStatus("Returned");
        log.setRemarks(log.getRemarks() + " | Return Notes: " + remarks);

        // Calculate days used
        long days = ChronoUnit.DAYS.between(log.getCheckoutDate(), today);
        log.setDaysUsed((int) (days <= 0 ? 1 : days));

        Log updatedLog = logRepository.save(log);
        return ResponseEntity.ok(updatedLog);
    }
}
