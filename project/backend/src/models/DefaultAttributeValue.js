const pool = require('../config/database');

class DefaultAttributeValue {
    static async create(attributeId, value, description = null) {
        const [result] = await pool.query(
            'INSERT INTO default_attribute_values (attribute_id, value, description) VALUES (?, ?, ?)',
            [attributeId, value, description]
        );
        return result.insertId;
    }

    static async findByAttributeId(attributeId) {
        const [rows] = await pool.query(
            'SELECT * FROM default_attribute_values WHERE attribute_id = ? AND state = "on"',
            [attributeId]
        );
        return rows;
    }

    static async update(id, value, description) {
        await pool.query(
            'UPDATE default_attribute_values SET value = ?, description = ? WHERE id = ?',
            [value, description, id]
        );
        return true;
    }

    static async delete(id) {
        await pool.query(
            'UPDATE default_attribute_values SET state = "off" WHERE id = ?',
            [id]
        );
        return true;
    }
}

module.exports = DefaultAttributeValue; 