-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-04-2025 a las 08:50:21
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

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
-- Estructura de tabla para la tabla `attributes`
--

CREATE TABLE `attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `data_type` enum('string','number','boolean','date') NOT NULL,
  `validation_pattern` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `state` enum('on','off') DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `attributes`
--

INSERT INTO `attributes` (`id`, `name`, `description`, `data_type`, `validation_pattern`, `is_required`, `state`, `created_at`, `updated_at`, `deleted_at`) VALUES
(11, 'Abteilung', 'Name der Abteilung', 'string', '^[A-Za-z0-9\\\\s]+$', 1, 'on', '2025-04-17 07:47:44', '2025-04-17 07:47:44', NULL),
(12, 'Halle', 'Name der Halle\"', 'string', '^[A-Za-z0-9\\\\s]+$', 1, 'off', '2025-04-17 07:48:20', '2025-04-17 08:25:22', '2025-04-17 07:50:29'),
(13, 'Hallo', 'Name der Halle', 'string', '^[A-Za-z0-9\\\\s]+$', 1, 'off', '2025-04-17 07:51:05', '2025-04-17 08:25:28', '2025-04-17 08:15:04'),
(14, 'IP-Adresse', 'IPv4', 'string', '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$', 1, 'on', '2025-04-17 07:51:28', '2025-04-17 07:51:36', NULL),
(15, 'Datum', 'Seit wann funktioniert er.', 'date', '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/([0-9]{4})$', 1, 'on', '2025-04-17 07:53:25', '2025-04-17 08:04:57', NULL),
(16, 'Pruffmittelnummer', 'fdsöonjfdjnfljds', 'string', '^.{0,10}$', 1, 'on', '2025-04-17 09:40:36', '2025-04-17 09:40:36', NULL);

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
(7, 'Schrauber', 'dwqdwq', 'off', '2025-04-17 09:16:14', '2025-04-17 10:04:56', NULL),
(13, 'Schrauber:', 'dwqdwq', 'on', '2025-04-17 10:28:19', '2025-04-17 10:28:19', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `screwdriver_attributes`
--

CREATE TABLE `screwdriver_attributes` (
  `id` int(11) NOT NULL,
  `screwdriver_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `state` enum('on','off') NOT NULL DEFAULT 'on',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `screwdriver_attributes`
--

INSERT INTO `screwdriver_attributes` (`id`, `screwdriver_id`, `attribute_id`, `value`, `state`, `created_at`, `updated_at`) VALUES
(4, 13, 11, 'AAA', 'on', '2025-04-17 10:28:19', '2025-04-17 10:28:19'),
(5, 13, 15, '02/02/2025', 'on', '2025-04-17 10:28:19', '2025-04-17 10:28:19'),
(6, 13, 14, '0.0.0.0', 'on', '2025-04-17 10:28:19', '2025-04-17 10:28:19'),
(7, 13, 16, '123', 'on', '2025-04-17 10:28:19', '2025-04-17 10:28:19');

--
-- Índices para tablas volcadas
--

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
  ADD KEY `idx_state` (`state`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `attributes`
--
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `screwdrivers`
--
ALTER TABLE `screwdrivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `screwdriver_attributes`
--
ALTER TABLE `screwdriver_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
