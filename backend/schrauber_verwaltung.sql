-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 24, 2025 at 09:36 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `schrauber_verwaltung`
--

-- --------------------------------------------------------

--
-- Table structure for table `attributes`
--

CREATE TABLE `attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `validation_pattern` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_parent` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `attribute_values`
--

CREATE TABLE `attribute_values` (
  `id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attributes`
--

INSERT INTO `attributes` (`id`, `name`, `description`, `validation_pattern`, `is_required`, `state`, `created_at`, `updated_at`, `deleted_at`, `is_parent`) VALUES
(19, 'Abteilung', 'ABC123', '\\b[A-Za-z]{3}\\d{3}\\b', 0, 'on', '2025-04-23 12:29:32', '2025-04-23 12:50:42', NULL, 1),
(20, 'IP Adress', '192.168.0.1', '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', 1, 'on', '2025-04-24 05:55:20', '2025-04-24 05:55:20', NULL, 0),
(21, 'MAC-Adress', '00:1A:2B:3C:4D:5E', '\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b', 1, 'on', '2025-04-24 06:13:10', '2025-04-24 06:20:41', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `screwdrivers`
--

CREATE TABLE `screwdrivers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `screwdrivers`
--

INSERT INTO `screwdrivers` (`id`, `name`, `description`, `state`, `created_at`, `updated_at`, `deleted_at`) VALUES
(16, '1eroo', 'FirstOne', 'off', '2025-04-23 12:30:06', '2025-04-24 06:38:59', NULL),
(18, '3roo', 'ThirdOne', 'on', '2025-04-23 17:43:45', '2025-04-24 04:55:49', NULL),
(19, '2doo', 'SecondOne', 'on', '2025-04-23 17:43:52', '2025-04-24 07:33:45', NULL),
(20, '4too', NULL, 'on', '2025-04-24 05:42:34', '2025-04-24 05:42:34', NULL),
(21, '5too', NULL, 'on', '2025-04-24 06:00:18', '2025-04-24 06:00:18', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `screwdriver_attributes`
--

CREATE TABLE `screwdriver_attributes` (
  `id` int(11) NOT NULL,
  `screwdriver_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `is_current` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `screwdriver_attributes`
--

INSERT INTO `screwdriver_attributes` (`id`, `screwdriver_id`, `attribute_id`, `value`, `is_current`, `updated_at`) VALUES
(1, 16, 19, 'AAA000', 0, '2025-04-24 05:15:02'),
(2, 19, 19, 'AAA001', 0, '2025-04-24 05:59:34'),
(3, 18, 19, 'AAA002', 0, '2025-04-24 04:56:01'),
(4, 18, 19, 'AAA003', 0, '2025-04-24 05:59:38'),
(5, 16, 19, 'AAA000', 0, '2025-04-24 05:39:30'),
(6, 16, 19, 'AAA000', 0, '2025-04-24 05:42:46'),
(7, 20, 19, 'AAA004', 0, '2025-04-24 05:59:44'),
(8, 16, 19, 'AAA001', 0, '2025-04-24 05:53:47'),
(9, 16, 19, 'AAA001', 0, '2025-04-24 05:59:28'),
(10, 16, 19, 'AAA001', 0, '2025-04-24 06:20:58'),
(11, 16, 20, '0.0.0.0', 0, '2025-04-24 06:20:58'),
(12, 19, 19, 'AAA001', 0, '2025-04-24 07:33:52'),
(13, 19, 20, '0.0.0.1', 0, '2025-04-24 07:33:52'),
(14, 18, 19, 'AAA003', 0, '2025-04-24 07:19:39'),
(15, 18, 20, '0.0.0.2', 0, '2025-04-24 07:19:39'),
(16, 20, 19, 'AAA004', 1, '2025-04-24 05:59:55'),
(17, 20, 20, '0.0.0.4', 1, '2025-04-24 05:59:55'),
(18, 21, 19, 'AAA005', 1, '2025-04-24 06:04:25'),
(19, 21, 20, '0.0.0.5', 1, '2025-04-24 06:04:25'),
(20, 16, 19, 'AAA001', 1, '2025-04-24 06:20:58'),
(21, 16, 20, '0.0.0.0', 1, '2025-04-24 06:20:58'),
(22, 16, 21, '00-11-22-33-44-55', 1, '2025-04-24 06:20:58'),
(23, 18, 19, 'AAA003', 1, '2025-04-24 07:19:39'),
(24, 18, 20, '0.0.0.2', 1, '2025-04-24 07:19:39'),
(25, 18, 21, '00-00-00-00-00-00', 1, '2025-04-24 07:19:39'),
(26, 19, 19, 'AAA001', 1, '2025-04-24 07:33:52'),
(27, 19, 20, '0.0.0.1', 1, '2025-04-24 07:33:52'),
(28, 19, 21, '11-11-11-11-11-11', 1, '2025-04-24 07:33:52');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attributes`
--
ALTER TABLE `attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_state` (`state`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- Indexes for table `attribute_values`
--
ALTER TABLE `attribute_values`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attribute_id` (`attribute_id`),
  ADD KEY `idx_state` (`state`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD CONSTRAINT `attribute_values_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;

--
-- Indexes for table `screwdrivers`
--
ALTER TABLE `screwdrivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_state` (`state`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- Indexes for table `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attribute_id` (`attribute_id`),
  ADD KEY `idx_screwdriver_attribute` (`screwdriver_id`,`attribute_id`),
  ADD KEY `idx_screwdriver_attribute_current` (`screwdriver_id`,`attribute_id`,`is_current`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attributes`
--
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `attribute_values`
--
ALTER TABLE `attribute_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `screwdrivers`
--
ALTER TABLE `screwdrivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  ADD CONSTRAINT `screwdriver_attributes_ibfk_1` FOREIGN KEY (`screwdriver_id`) REFERENCES `screwdrivers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `screwdriver_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
