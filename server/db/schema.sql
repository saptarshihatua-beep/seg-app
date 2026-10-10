-- Secure Enhanced Geolocking (SEG) MySQL Database Schema
-- Academic Reference: Project 4a - Design and Analysis of Secure Data Delivery Based on Geo Information

CREATE DATABASE IF NOT EXISTS `seg_geolocking` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `seg_geolocking`;

-- 1. Users Table: Authentication & Role-Based Access Control
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('sender', 'receiver', 'admin') NOT NULL DEFAULT 'receiver',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Documents Table: Stores Encrypted Payload and Geographical Bounds
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NULL,
  `receiver_email` VARCHAR(191) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
  `encrypted_file_reference` VARCHAR(255) NOT NULL,
  `encryption_metadata` TEXT NOT NULL COMMENT 'JSON holding {ct, iv, s, algorithm, mode}',
  `location_address` VARCHAR(255) NOT NULL,
  `polygon_coordinates` TEXT NOT NULL COMMENT 'JSON array of [{lat, lng}] or comma-separated pairs',
  `kml_reference` VARCHAR(255) NULL,
  `status` ENUM('active', 'revoked', 'expired', 'accessed') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_docs_sender` (`sender_id`),
  INDEX `idx_docs_receiver_email` (`receiver_email`),
  INDEX `idx_docs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. AccessTokens Table: Cryptographic Single-Use Time-Limited Access Tokens
CREATE TABLE IF NOT EXISTS `access_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL UNIQUE COMMENT 'SHA-256 hash of the generated raw token',
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  INDEX `idx_tokens_hash` (`token_hash`),
  INDEX `idx_tokens_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. LocationVerification Table: Multi-factor Location Verification Audit Trail
CREATE TABLE IF NOT EXISTS `location_verifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `receiver_id` INT NULL,
  `verification_method` VARCHAR(50) NOT NULL COMMENT 'e.g., GPS_BROWSER, WIFI_BSSID, BLE_BEACON, MULTI_FACTOR',
  `verification_result` VARCHAR(50) NOT NULL COMMENT 'e.g., GRANTED, DENIED_OUT_OF_BOUNDS, DENIED_STALE, DENIED_INACCURATE',
  `verified_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_verif_doc` (`document_id`),
  INDEX `idx_verif_result` (`verification_result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AuditLogs Table: Complete Security Audit Trail
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL COMMENT 'e.g., LOGIN, DOC_UPLOAD, LINK_GENERATED, VERIFICATION_ATTEMPT, DOC_DOWNLOAD',
  `document_id` INT NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_doc` (`document_id`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
