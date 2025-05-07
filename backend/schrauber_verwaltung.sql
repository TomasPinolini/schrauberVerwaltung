-- Database Schema for Schrauber Verwaltung
-- Version: 1.0
-- Date: 2025-05-06

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
-- Table structure for `activity_logs`
--

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL,
  `type` varchar(64) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `entity_type` varchar(64) NOT NULL,
  `message` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for `attributes`
--

CREATE TABLE IF NOT EXISTS `attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `validation_pattern` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `unique` tinyint(1) DEFAULT 0,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_parent` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for `auftraege`
--

CREATE TABLE IF NOT EXISTS `auftraege` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `controller_type` varchar(64) NOT NULL,
  `date` datetime NOT NULL,
  `id_code` varchar(64) NOT NULL,
  `program_nr` varchar(32) DEFAULT NULL,
  `program_name` varchar(128) DEFAULT NULL,
  `material_number` varchar(64) DEFAULT NULL,
  `serial_number` varchar(64) DEFAULT NULL,
  `screw_channel` varchar(16) DEFAULT NULL,
  `result` varchar(16) DEFAULT NULL,
  `last_step_n` varchar(16) DEFAULT NULL,
  `last_step_p` varchar(16) DEFAULT NULL,
  `nominal_torque` float DEFAULT NULL,
  `actual_torque` float DEFAULT NULL,
  `min_torque` float DEFAULT NULL,
  `max_torque` float DEFAULT NULL,
  `nominal_angle` float DEFAULT NULL,
  `actual_angle` float DEFAULT NULL,
  `min_angle` float DEFAULT NULL,
  `max_angle` float DEFAULT NULL,
  `angle_values` LONGTEXT DEFAULT NULL,
  `torque_values` LONGTEXT DEFAULT NULL,
  `cycle` varchar(32) DEFAULT NULL,
  `screwdriver_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for `screwdrivers`
--

CREATE TABLE IF NOT EXISTS `screwdrivers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for `screwdriver_attributes`
--

CREATE TABLE IF NOT EXISTS `screwdriver_attributes` (
  `id` int(11) NOT NULL,
  `screwdriver_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_current` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`) -- Primary key for activity_logs
  ;

--
-- Indexes for table `attributes`
--
ALTER TABLE `attributes`
  ADD PRIMARY KEY (`id`) -- Primary key for attributes
  , ADD KEY `idx_state` (`state`)
  , ADD KEY `idx_deleted_at` (`deleted_at`)
  ;

--
-- Indexes for table `auftraege`
--
-- Add indexes to auftraege table
ALTER TABLE `auftraege`
  ADD KEY `idx_controller_type` (`controller_type`)
  , ADD KEY `idx_date` (`date`)
  , ADD KEY `idx_result` (`result`)
  , ADD KEY `idx_id_code` (`id_code`)
  , ADD KEY `idx_screwdriver_id` (`screwdriver_id`)
  ;

--
-- Indexes for table `screwdrivers`
--
ALTER TABLE `screwdrivers`
  ADD PRIMARY KEY (`id`) -- Primary key for screwdrivers
  , ADD KEY `idx_state` (`state`)
  , ADD KEY `idx_deleted_at` (`deleted_at`)
  ;

--
-- Indexes for table `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  ADD PRIMARY KEY (`id`) -- Primary key for screwdriver_attributes
  , ADD KEY `attribute_id` (`attribute_id`)
  , ADD KEY `idx_screwdriver_attribute` (`screwdriver_id`,`attribute_id`)
  , ADD KEY `idx_screwdriver_attribute_current` (`screwdriver_id`,`attribute_id`,`is_current`)
  ;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
-- Set auto increment for activity_logs
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `attributes`
--
-- Set auto increment for attributes
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `auftraege`
--
-- Set auto increment for auftraege
ALTER TABLE `auftraege`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `screwdrivers`
--
-- Set auto increment for screwdrivers
ALTER TABLE `screwdrivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `screwdriver_attributes`
--
-- Set auto increment for screwdriver_attributes
ALTER TABLE `screwdriver_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auftraege`
--
-- Add foreign key constraint to auftraege table if it doesn't exist
ALTER TABLE `auftraege`
  ADD CONSTRAINT `auftraege_ibfk_1` FOREIGN KEY (`screwdriver_id`) REFERENCES `screwdrivers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `screwdriver_attributes`
--
-- Add foreign key constraints to screwdriver_attributes table if they don't exist
ALTER TABLE `screwdriver_attributes`
  ADD CONSTRAINT `screwdriver_attributes_ibfk_1` FOREIGN KEY (`screwdriver_id`) REFERENCES `screwdrivers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `screwdriver_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
