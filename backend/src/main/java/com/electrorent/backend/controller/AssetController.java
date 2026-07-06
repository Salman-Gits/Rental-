package com.electrorent.backend.controller;

import com.electrorent.backend.model.Asset;
import com.electrorent.backend.repository.AssetRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @Autowired
    private AssetRepository assetRepository;

    // Retrieve all active fleet assets
    @GetMapping
    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    // Retrieve a single asset by database PK
    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable Long id) {
        return assetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Retrieve a single asset by barcoded identifier
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<Asset> getAssetByBarcode(@PathVariable String barcode) {
        return assetRepository.findByBarcode(barcode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create / register new fleet asset (ADMIN ONLY - checked by client header)
    @PostMapping
    public ResponseEntity<?> registerAsset(
            @RequestHeader(value = "X-Operator-Role", defaultValue = "User") String role,
            @Valid @RequestBody Asset asset) {
        
        if (!"Admin".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access Denied: Standard operators cannot register assets. Please log in as Admin."));
        }

        if (assetRepository.findByBarcode(asset.getBarcode()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Barcode must be unique. The barcode '" + asset.getBarcode() + "' is already registered."));
        }

        // Initialize available quantity matching full quantity initially
        if (asset.getAvailableQuantity() == null) {
            asset.setAvailableQuantity(asset.getQuantity());
        }

        Asset savedAsset = assetRepository.save(asset);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAsset);
    }

    // Edit asset details (ADMIN ONLY)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(
            @PathVariable Long id,
            @RequestHeader(value = "X-Operator-Role", defaultValue = "User") String role,
            @Valid @RequestBody Asset assetDetails) {

        if (!"Admin".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access Denied: Only administrators can modify asset entries."));
        }

        Optional<Asset> assetOpt = assetRepository.findById(id);
        if (assetOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Asset existingAsset = assetOpt.get();
        existingAsset.setName(assetDetails.getName());
        existingAsset.setCategory(assetDetails.getCategory());
        existingAsset.setBrand(assetDetails.getBrand());
        existingAsset.setModel(assetDetails.getModel());
        existingAsset.setPurchaseDate(assetDetails.getPurchaseDate());
        existingAsset.setPurchaseCost(assetDetails.getPurchaseCost());
        
        // Handle quantity adjustment safely
        int qtyDiff = assetDetails.getQuantity() - existingAsset.getQuantity();
        existingAsset.setQuantity(assetDetails.getQuantity());
        existingAsset.setAvailableQuantity(existingAsset.getAvailableQuantity() + qtyDiff);
        
        existingAsset.setVendor(assetDetails.getVendor());
        existingAsset.setLocation(assetDetails.getLocation());
        existingAsset.setToolCondition(assetDetails.getToolCondition());
        existingAsset.setStatus(assetDetails.getStatus());
        existingAsset.setNotes(assetDetails.getNotes());

        Asset updatedAsset = assetRepository.save(existingAsset);
        return ResponseEntity.ok(updatedAsset);
    }

    // Delete asset from list (ADMIN ONLY)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(
            @PathVariable Long id,
            @RequestHeader(value = "X-Operator-Role", defaultValue = "User") String role) {

        if (!"Admin".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access Denied: Only administrators can delete assets from the register."));
        }

        if (!assetRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        assetRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Asset ID " + id + " successfully purged from database."));
    }
}
