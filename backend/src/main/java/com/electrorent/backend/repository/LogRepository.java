package com.electrorent.backend.repository;

import com.electrorent.backend.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    Optional<Log> findByLogCode(String logCode);
    List<Log> findByStatus(String status); // e.g. "Active" (not checked in yet) or "Returned"
    List<Log> findByEmployee(String employee);
}
