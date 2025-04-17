-- Create the database
CREATE DATABASE IF NOT EXISTS schrauber_verwaltung;
USE schrauber_verwaltung;

-- Create the screwdrivers table
CREATE TABLE IF NOT EXISTS screwdrivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    state ENUM('on', 'off') DEFAULT 'on',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the attributes table
CREATE TABLE IF NOT EXISTS attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type ENUM('string', 'number', 'boolean', 'date') NOT NULL,
    validation_pattern VARCHAR(255),
    is_required BOOLEAN DEFAULT FALSE,
    state ENUM('on', 'off') DEFAULT 'on',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the screwdriver_attributes table (junction table)
CREATE TABLE IF NOT EXISTS screwdriver_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screwdriver_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value VARCHAR(255) NOT NULL,
    state ENUM('on', 'off') DEFAULT 'on',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (screwdriver_id) REFERENCES screwdrivers(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes
ALTER TABLE screwdrivers
    ADD INDEX idx_state (state);

ALTER TABLE attributes
    ADD INDEX idx_state (state);

ALTER TABLE screwdriver_attributes
    ADD INDEX idx_screwdriver_attribute (screwdriver_id, attribute_id),
    ADD INDEX idx_state (state);

-- Insert some default attributes
INSERT INTO attributes (name, description, data_type, validation_pattern, is_required) VALUES
('Halle', 'Name der Halle', 'string', '^[A-Za-z0-9\\s]+$', TRUE),
('Abteilung', 'Name der Abteilung', 'string', '^[A-Za-z0-9\\s]+$', TRUE),
('Prüfmittel', 'Bezeichnung des Prüfmittels', 'string', '^[A-Za-z0-9\\s]+$', TRUE),
('MAC', 'MAC-Adresse', 'string', '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', TRUE),
('IP', 'IP-Adresse', 'string', '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$', TRUE); 