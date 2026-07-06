package com.electrorent.backend.repository;

import com.electrorent.backend.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    Optional<Asset> findByBarcode(String barcode);
    List<Asset> findByCategory(String category);
    List<Asset> findByStatus(String status);
}
