-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 25-04-2025 a las 09:56:22
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
(17, 'attribute_toggle_state', 22, 'attribute', 'Attribute Halle state changed to on', '2025-04-25 07:54:31');

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
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_parent` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `attributes`
--

INSERT INTO `attributes` (`id`, `name`, `description`, `validation_pattern`, `is_required`, `state`, `created_at`, `updated_at`, `deleted_at`, `is_parent`) VALUES
(19, 'Abteilung', 'ABC123', '\\b[A-Za-z]{3}\\d{3}\\b', 0, 'on', '2025-04-23 12:29:32', '2025-04-24 09:10:48', NULL, 1),
(20, 'IP Adress', '192.168.0.1', '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', 1, 'on', '2025-04-24 05:55:20', '2025-04-25 05:12:39', NULL, 0),
(21, 'MAC-Adress', '00:1A:2B:3C:4D:5E', '\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b', 1, 'on', '2025-04-24 06:13:10', '2025-04-24 06:20:41', NULL, 0),
(22, 'Halle', 'Standort des Schraubers', '\\b([0-9]{1,3})\\b', 1, 'on', '2025-04-24 10:38:18', '2025-04-25 07:54:31', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `attribute_values`
--

CREATE TABLE `attribute_values` (
  `id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(26, '1eroo', NULL, 'on', '2025-04-25 05:35:54', '2025-04-25 06:05:19', NULL),
(27, '2doo', NULL, 'off', '2025-04-25 05:47:58', '2025-04-25 06:00:44', NULL),
(28, '3roo', NULL, 'on', '2025-04-25 05:48:32', '2025-04-25 07:04:38', NULL),
(29, '4too', NULL, 'off', '2025-04-25 05:58:46', '2025-04-25 07:12:57', NULL);

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
(3, 26, 20, '0.0.0.1', '2025-04-25 05:50:03', 0),
(4, 26, 21, '00-00-00-00-00-00', '2025-04-25 05:50:03', 0),
(5, 27, 19, 'AAA001', '2025-04-25 05:50:08', 0),
(6, 27, 22, '2', '2025-04-25 05:50:08', 0),
(7, 27, 20, '0.0.0.2', '2025-04-25 05:50:08', 0),
(8, 27, 21, '00-00-00-00-00-01', '2025-04-25 05:50:08', 0),
(9, 28, 19, 'AAA000', '2025-04-25 05:53:38', 0),
(10, 28, 22, '3', '2025-04-25 05:53:38', 0),
(11, 28, 20, '0.0.0.3', '2025-04-25 05:53:38', 0),
(12, 28, 21, '00-00-00-00-00-03', '2025-04-25 05:53:38', 0),
(13, 26, 19, 'AAA000', '2025-04-25 05:50:46', 0),
(14, 26, 20, '0.0.0.1', '2025-04-25 05:50:46', 0),
(15, 26, 21, '00-00-00-00-00-00', '2025-04-25 05:50:46', 0),
(16, 26, 22, '1', '2025-04-25 05:50:46', 0),
(17, 27, 19, 'AAA001', '2025-04-25 05:50:08', 1),
(18, 27, 20, '0.0.0.2', '2025-04-25 05:50:08', 1),
(19, 27, 21, '00-00-00-00-00-01', '2025-04-25 05:50:08', 1),
(20, 27, 22, '2', '2025-04-25 05:50:08', 1),
(21, 26, 19, 'AAA000', '2025-04-25 05:50:46', 1),
(22, 26, 20, '0.0.0.1', '2025-04-25 05:50:46', 1),
(23, 26, 21, '00-00-00-00-00-00', '2025-04-25 05:50:46', 1),
(24, 26, 22, '1', '2025-04-25 05:50:46', 1),
(25, 28, 19, 'AAA002', '2025-04-25 05:53:38', 1),
(26, 28, 20, '0.0.0.3', '2025-04-25 05:53:38', 1),
(27, 28, 21, '00-00-00-00-00-03', '2025-04-25 05:53:38', 1),
(28, 28, 22, '3', '2025-04-25 05:53:38', 1),
(29, 29, 19, 'AAA000', '2025-04-25 07:13:03', 0),
(30, 29, 22, '4', '2025-04-25 07:13:03', 0),
(31, 29, 20, '0.0.0.4', '2025-04-25 07:13:03', 0),
(32, 29, 21, '00-00-00-00-00-04', '2025-04-25 07:13:03', 0),
(33, 29, 19, 'AAA001', '2025-04-25 07:13:03', 1),
(34, 29, 20, '0.0.0.4', '2025-04-25 07:13:03', 1),
(35, 29, 21, '00-00-00-00-00-04', '2025-04-25 07:13:03', 1),
(36, 29, 22, '4', '2025-04-25 07:13:03', 1);

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
-- Indices de la tabla `attribute_values`
--
ALTER TABLE `attribute_values`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attribute_id` (`attribute_id`),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `attributes`
--
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `attribute_values`
--
ALTER TABLE `attribute_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `screwdrivers`
--
ALTER TABLE `screwdrivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `attribute_values`
--
ALTER TABLE `attribute_values`
  ADD CONSTRAINT `attribute_values_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;

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
