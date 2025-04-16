-- Create the database
CREATE DATABASE IF NOT EXISTS schrauber_verwaltung;
USE schrauber_verwaltung;

-- Create the screwdrivers table
CREATE TABLE IF NOT EXISTS screwdrivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    parent_id INT NULL,
    type ENUM('category', 'instance') NOT NULL DEFAULT 'category',
    state ENUM('on', 'off') NOT NULL DEFAULT 'on',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES screwdrivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the attributes table
CREATE TABLE IF NOT EXISTS attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    default_value TEXT,
    format_data VARCHAR(255) COMMENT 'Regex pattern for validation',
    is_required BOOLEAN DEFAULT FALSE COMMENT 'If true, this attribute is required for all screwdrivers',
    state ENUM('on', 'off') NOT NULL DEFAULT 'on',
    screwdriver_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (screwdriver_id) REFERENCES screwdrivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the attribute_values table
CREATE TABLE IF NOT EXISTS attribute_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screwdriver_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (screwdriver_id) REFERENCES screwdrivers(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_screwdriver_attribute (screwdriver_id, attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Add type and state to screwdrivers table if they don't exist
ALTER TABLE screwdrivers
    ADD COLUMN IF NOT EXISTS type ENUM('category', 'instance') NOT NULL DEFAULT 'category' AFTER parent_id,
    ADD COLUMN IF NOT EXISTS state ENUM('on', 'off') NOT NULL DEFAULT 'on' AFTER type;

-- Migration: Add state and description to attributes table if they don't exist
ALTER TABLE attributes
    ADD COLUMN IF NOT EXISTS state ENUM('on', 'off') NOT NULL DEFAULT 'on' AFTER is_required,
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER name;

-- Migration: Update existing screwdrivers
-- Set type='instance' for screwdrivers that have attribute values
UPDATE screwdrivers s
SET s.type = 'instance'
WHERE EXISTS (
    SELECT 1 FROM attribute_values av 
    WHERE av.screwdriver_id = s.id
);

-- Set type='category' for screwdrivers that have children
UPDATE screwdrivers s
SET s.type = 'category'
WHERE EXISTS (
    SELECT 1 FROM screwdrivers child 
    WHERE child.parent_id = s.id
);

-- Set state='on' for all existing records if not already set
UPDATE screwdrivers SET state = 'on' WHERE state IS NULL;
UPDATE attributes SET state = 'on' WHERE state IS NULL;

-- Add indexes for better performance
ALTER TABLE screwdrivers
    ADD INDEX idx_type (type),
    ADD INDEX idx_state (state),
    ADD INDEX idx_parent (parent_id);

ALTER TABLE attributes
    ADD INDEX idx_state (state),
    ADD INDEX idx_screwdriver (screwdriver_id);

ALTER TABLE attribute_values
    ADD INDEX idx_screwdriver_attribute (screwdriver_id, attribute_id); 