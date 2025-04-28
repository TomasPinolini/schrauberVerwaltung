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
