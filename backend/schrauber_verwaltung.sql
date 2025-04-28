-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-04-2025 a las 07:50:44
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `schrauber_verwaltung`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `type` varchar(64) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `entity_type` varchar(64) NOT NULL,
  `message` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `type`, `entity_id`, `entity_type`, `message`, `created_at`) VALUES
(1, 'screwdriver_create', 24, 'screwdriver', 'Created screwdriver: 8voo', '2025-04-25 05:27:07'),
(4, 'screwdriver_create', 27, 'screwdriver', 'Created screwdriver: 2', '2025-04-25 05:47:58'),
(5, 'screwdriver_create', 28, 'screwdriver', 'Created screwdriver: 3roo', '2025-04-25 05:48:32'),
(6, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 05:50:46'),
(7, 'screwdriver_update', 28, 'screwdriver', 'Edited screwdriver: 3roo', '2025-04-25 05:53:38'),
(8, 'screwdriver_create', 29, 'screwdriver', 'Created screwdriver: 4too', '2025-04-25 05:58:46'),
(9, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 05:58:57'),
(10, 'screwdriver_update', 27, 'screwdriver', 'Edited screwdriver: 2doo', '2025-04-25 06:00:44'),
(11, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 06:05:19'),
(12, 'screwdriver_deactivate', 28, 'screwdriver', 'Deactivated screwdriver: 3roo', '2025-04-25 07:04:38'),
(13, 'screwdriver_activate', 28, 'screwdriver', 'Activated screwdriver: 3roo', '2025-04-25 07:04:38'),
(14, 'screwdriver_deactivate', 29, 'screwdriver', 'Deactivated screwdriver: 4too', '2025-04-25 07:12:57'),
(15, 'screwdriver_update', 29, 'screwdriver', 'Edited screwdriver: 4too', '2025-04-25 07:13:03'),
(16, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to off', '2025-04-25 07:44:47'),
(17, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to on', '2025-04-25 07:54:31'),
(18, 'screwdriver_create', 30, 'screwdriver', 'Created screwdriver: 5too', '2025-04-25 08:13:43'),
(19, 'screwdriver_activate', 29, 'screwdriver', 'Activated screwdriver: 4too', '2025-04-25 08:13:46'),
(20, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 08:14:25'),
(21, 'attribute_create', 23, 'attribute', 'Created attribute: Pruffelnummer', '2025-04-25 08:15:53'),
(22, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to off', '2025-04-25 08:15:59'),
(23, 'attribute_update', 23, 'attribute', 'Updated attribute: Pruffelnummer', '2025-04-25 08:17:39'),
(24, 'attribute_update', 23, 'attribute', 'Updated attribute: Pruffelnummer', '2025-04-25 08:18:15'),
(25, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 08:18:22'),
(26, 'attribute_update', 23, 'attribute', 'Updated attribute: Pruffelnummer', '2025-04-25 08:19:38'),
(27, 'attribute_toggle_state', 23, 'attribute', 'Attribute Pruffelnummer state changed to off', '2025-04-25 08:20:10'),
(28, 'attribute_toggle_state', 23, 'attribute', 'Attribute Pruffelnummer state changed to on', '2025-04-25 08:20:19'),
(29, 'attribute_toggle_state', 23, 'attribute', 'Attribute Pruffelnummer state changed to off', '2025-04-25 08:20:20'),
(30, 'screwdriver_create', 31, 'screwdriver', 'Created screwdriver: 6too', '2025-04-25 08:20:59'),
(31, 'screwdriver_deactivate', 28, 'screwdriver', 'Deactivated screwdriver: 3roo', '2025-04-25 08:22:05'),
(32, 'screwdriver_update', 28, 'screwdriver', 'Edited screwdriver: 3roo', '2025-04-25 08:22:44'),
(33, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to on', '2025-04-25 08:44:27'),
(34, 'attribute_toggle_state', 23, 'attribute', 'Attribute Pruffelnummer state changed to on', '2025-04-25 08:44:29'),
(35, 'attribute_update', 20, 'attribute', 'Updated attribute: IP Adress', '2025-04-25 08:45:59'),
(36, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 08:46:15'),
(37, 'screwdriver_update', 28, 'screwdriver', 'Edited screwdriver: 3roo', '2025-04-25 08:46:35'),
(38, 'screwdriver_create', 32, 'screwdriver', 'Created screwdriver: 7moo', '2025-04-25 08:48:21'),
(39, 'attribute_update', 20, 'attribute', 'Updated attribute: IP Adress', '2025-04-25 08:50:27'),
(40, 'attribute_update', 22, 'attribute', 'Updated attribute: Halle', '2025-04-25 08:50:32'),
(41, 'attribute_create', 24, 'attribute', 'Created attribute: Pruffnummer', '2025-04-25 08:51:06'),
(42, 'attribute_update', 20, 'attribute', 'Updated attribute: IP Adress', '2025-04-25 08:58:40'),
(43, 'attribute_update', 20, 'attribute', 'Updated attribute: IP Adress', '2025-04-25 08:58:59'),
(44, 'attribute_toggle_state', 24, 'attribute', 'Attribute Pruffnummer state changed to off', '2025-04-25 09:06:28'),
(45, 'screwdriver_update', 31, 'screwdriver', 'Edited screwdriver: 6too', '2025-04-25 09:06:38'),
(46, 'screwdriver_update', 31, 'screwdriver', 'Edited screwdriver: 6too', '2025-04-25 09:06:45'),
(47, 'attribute_update', 20, 'attribute', 'Updated attribute: IP Adress', '2025-04-25 09:07:24'),
(48, 'attribute_create', 25, 'attribute', 'Created attribute: IP Adress', '2025-04-25 09:08:43'),
(49, 'attribute_update', 21, 'attribute', 'Updated attribute: MAC-Adress', '2025-04-25 09:25:35'),
(50, 'screwdriver_update', 26, 'screwdriver', 'Edited screwdriver: 1eroo', '2025-04-25 09:26:00'),
(51, 'screwdriver_update', 27, 'screwdriver', 'Edited screwdriver: 2doo', '2025-04-25 09:26:13'),
(52, 'attribute_toggle_state', 24, 'attribute', 'Attribute Pruffnummer state changed to on', '2025-04-25 09:38:23'),
(53, 'screwdriver_activate', 27, 'screwdriver', 'Activated screwdriver: 2doo', '2025-04-25 09:39:38'),
(54, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to off', '2025-04-28 05:19:41'),
(55, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to on', '2025-04-28 05:19:44'),
(56, 'screwdriver_create', 33, 'screwdriver', 'Created screwdriver: 8voo', '2025-04-28 05:20:23'),
(57, 'screwdriver_deactivate', 33, 'screwdriver', 'Deactivated screwdriver: 8voo', '2025-04-28 05:20:31'),
(58, 'screwdriver_activate', 33, 'screwdriver', 'Activated screwdriver: 8voo', '2025-04-28 05:25:20'),
(59, 'screwdriver_deactivate', 33, 'screwdriver', 'Deactivated screwdriver: 8voo', '2025-04-28 05:30:04'),
(60, 'screwdriver_deactivate', 31, 'screwdriver', 'Deactivated screwdriver: 6too', '2025-04-28 05:30:06'),
(61, 'screwdriver_deactivate', 26, 'screwdriver', 'Deactivated screwdriver: 1eroo', '2025-04-28 05:40:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `attributes`
--

CREATE TABLE `attributes` (
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

--
-- Volcado de datos para la tabla `attributes`
--

INSERT INTO `attributes` (`id`, `name`, `description`, `validation_pattern`, `is_required`, `unique`, `state`, `created_at`, `updated_at`, `deleted_at`, `is_parent`) VALUES
(19, 'Abteilung', 'ABC123', '\\b[A-Za-z]{3}\\d{3}\\b', 0, 0, 'on', '2025-04-23 12:29:32', '2025-04-24 09:10:48', NULL, 1),
(21, 'MAC-Adress', '00:1A:2B:3C:4D:5E', '\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b', 1, 1, 'on', '2025-04-24 06:13:10', '2025-04-25 09:25:35', NULL, 0),
(22, 'Halle', 'Standort des Schraubers', '\\b([0-9]{1,3})\\b', 1, 0, 'on', '2025-04-24 10:38:18', '2025-04-28 05:19:44', NULL, 1),
(24, 'Pruffnummer', 'ADSASDA', '\\b[A-Za-z0-9]{1,30}\\b', 1, 0, 'on', '2025-04-25 08:51:06', '2025-04-25 09:38:23', NULL, 0),
(25, 'IP Adress', '0.0.0.0 - 255.255.255.255', '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', 1, 1, 'on', '2025-04-25 09:08:43', '2025-04-25 09:08:43', NULL, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `screwdrivers`
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
-- Volcado de datos para la tabla `screwdrivers`
--

INSERT INTO `screwdrivers` (`id`, `name`, `description`, `state`, `created_at`, `updated_at`, `deleted_at`) VALUES
(26, '1eroo', NULL, 'off', '2025-04-25 05:35:54', '2025-04-28 05:40:39', NULL),
(27, '2doo', NULL, 'on', '2025-04-25 05:47:58', '2025-04-25 09:39:38', NULL),
(28, '3roo', NULL, 'off', '2025-04-25 05:48:32', '2025-04-25 08:22:05', NULL),
(29, '4too', NULL, 'on', '2025-04-25 05:58:46', '2025-04-25 08:13:46', NULL),
(30, '5too', NULL, 'on', '2025-04-25 08:13:43', '2025-04-25 08:13:43', NULL),
(31, '6too', NULL, 'off', '2025-04-25 08:20:59', '2025-04-28 05:30:06', NULL),
(32, '7moo', NULL, 'on', '2025-04-25 08:48:21', '2025-04-25 08:48:21', NULL),
(33, '8voo', NULL, 'off', '2025-04-28 05:20:23', '2025-04-28 05:30:04', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `screwdriver_attributes`
--

CREATE TABLE `screwdriver_attributes` (
  `id` int(11) NOT NULL,
  `screwdriver_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_current` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `screwdriver_attributes`
--

INSERT INTO `screwdriver_attributes` (`id`, `screwdriver_id`, `attribute_id`, `value`, `updated_at`, `is_current`) VALUES
(1, 26, 19, 'AAA000', '2025-04-25 05:50:03', 0),
(2, 26, 22, '1', '2025-04-25 05:50:03', 0),
(4, 26, 21, '00-00-00-00-00-00', '2025-04-25 05:50:03', 0),
(5, 27, 19, 'AAA001', '2025-04-25 05:50:08', 0),
(6, 27, 22, '2', '2025-04-25 05:50:08', 0),
(8, 27, 21, '00-00-00-00-00-01', '2025-04-25 05:50:08', 0),
(9, 28, 19, 'AAA000', '2025-04-25 05:53:38', 0),
(10, 28, 22, '3', '2025-04-25 05:53:38', 0),
(12, 28, 21, '00-00-00-00-00-03', '2025-04-25 05:53:38', 0),
(13, 26, 19, 'AAA000', '2025-04-25 05:50:46', 0),
(15, 26, 21, '00-00-00-00-00-00', '2025-04-25 05:50:46', 0),
(16, 26, 22, '1', '2025-04-25 05:50:46', 0),
(17, 27, 19, 'AAA001', '2025-04-25 09:26:13', 0),
(19, 27, 21, '00-00-00-00-00-01', '2025-04-25 09:26:13', 0),
(20, 27, 22, '2', '2025-04-25 09:26:13', 0),
(21, 26, 19, 'AAA000', '2025-04-25 08:14:25', 0),
(23, 26, 21, '00-00-00-00-00-00', '2025-04-25 08:14:25', 0),
(24, 26, 22, '1', '2025-04-25 08:14:25', 0),
(25, 28, 19, 'AAA002', '2025-04-25 08:22:44', 0),
(27, 28, 21, '00-00-00-00-00-03', '2025-04-25 08:22:44', 0),
(28, 28, 22, '3', '2025-04-25 08:22:44', 0),
(29, 29, 19, 'AAA000', '2025-04-25 07:13:03', 0),
(30, 29, 22, '4', '2025-04-25 07:13:03', 0),
(32, 29, 21, '00-00-00-00-00-04', '2025-04-25 07:13:03', 0),
(33, 29, 19, 'AAA001', '2025-04-25 07:13:03', 1),
(35, 29, 21, '00-00-00-00-00-04', '2025-04-25 07:13:03', 1),
(36, 29, 22, '4', '2025-04-25 07:13:03', 1),
(37, 30, 19, 'AAA001', '2025-04-25 08:13:43', 1),
(38, 30, 22, '2', '2025-04-25 08:13:43', 1),
(40, 30, 21, 'AA-AA-AA-AA-AA-AA', '2025-04-25 08:13:43', 1),
(41, 26, 19, 'AAA002', '2025-04-25 08:18:22', 0),
(43, 26, 21, '00-00-00-00-00-00', '2025-04-25 08:18:22', 0),
(44, 26, 22, '1', '2025-04-25 08:18:22', 0),
(45, 26, 19, 'AAA002', '2025-04-25 08:46:15', 0),
(47, 26, 21, '00-00-00-00-00-00', '2025-04-25 08:46:15', 0),
(48, 31, 19, 'AAA002', '2025-04-25 09:06:38', 0),
(50, 31, 21, '00-00-00-00-00-00', '2025-04-25 09:06:38', 0),
(51, 28, 19, 'AAA001', '2025-04-25 08:46:35', 0),
(53, 28, 21, '00-00-00-00-00-03', '2025-04-25 08:46:35', 0),
(54, 26, 19, 'AAA002', '2025-04-25 09:26:00', 0),
(56, 26, 21, '00-00-00-00-00-00', '2025-04-25 09:26:00', 0),
(57, 26, 22, '2', '2025-04-25 09:26:00', 0),
(58, 28, 19, 'AAA001', '2025-04-25 08:46:35', 1),
(60, 28, 21, '00-00-00-00-00-03', '2025-04-25 08:46:35', 1),
(61, 28, 22, '2', '2025-04-25 08:46:35', 1),
(62, 32, 19, 'AAA003', '2025-04-25 08:48:21', 1),
(63, 32, 22, '3', '2025-04-25 08:48:21', 1),
(65, 32, 21, '11-11-11-11-11-11', '2025-04-25 08:48:21', 1),
(66, 31, 19, 'AAA002', '2025-04-25 09:06:45', 0),
(68, 31, 21, '00-00-00-00-00-00', '2025-04-25 09:06:45', 0),
(69, 31, 22, '4', '2025-04-25 09:06:45', 0),
(70, 31, 19, 'AAA002', '2025-04-25 09:06:45', 1),
(72, 31, 21, '00-00-00-00-00-00', '2025-04-25 09:06:45', 1),
(73, 31, 22, '4', '2025-04-25 09:06:45', 1),
(74, 26, 19, 'AAA002', '2025-04-25 09:26:00', 1),
(75, 26, 21, '00-00-00-00-00-02', '2025-04-25 09:26:00', 1),
(76, 26, 22, '2', '2025-04-25 09:26:00', 1),
(77, 26, 25, '0.0.0.0', '2025-04-25 09:26:00', 1),
(78, 27, 19, 'AAA001', '2025-04-25 09:26:13', 1),
(79, 27, 21, '00-00-00-00-00-01', '2025-04-25 09:26:13', 1),
(80, 27, 22, '2', '2025-04-25 09:26:13', 1),
(81, 27, 25, '0.0.0.1', '2025-04-25 09:26:13', 1),
(82, 33, 19, 'AAA004', '2025-04-28 05:20:23', 1),
(83, 33, 22, '4', '2025-04-28 05:20:23', 1),
(84, 33, 25, '0.0.0.8', '2025-04-28 05:20:23', 1),
(85, 33, 21, '11-11-11-11-11-12', '2025-04-28 05:20:23', 1),
(86, 33, 24, '213213', '2025-04-28 05:20:23', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `attributes`
--
ALTER TABLE `attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_state` (`state`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- Indices de la tabla `screwdrivers`
--
ALTER TABLE `screwdrivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_state` (`state`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- Indices de la tabla `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attribute_id` (`attribute_id`),
  ADD KEY `idx_screwdriver_attribute` (`screwdriver_id`,`attribute_id`),
  ADD KEY `idx_screwdriver_attribute_current` (`screwdriver_id`,`attribute_id`,`is_current`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT de la tabla `attributes`
--
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `screwdrivers`
--
ALTER TABLE `screwdrivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  ADD CONSTRAINT `screwdriver_attributes_ibfk_1` FOREIGN KEY (`screwdriver_id`) REFERENCES `screwdrivers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `screwdriver_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
