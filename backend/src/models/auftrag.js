const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Auftrag extends Model {
    static associate(models) {
      // Define associations
      Auftrag.belongsTo(models.Screwdriver, {
        foreignKey: 'screwdriver_id',
        as: 'screwdriver'
      });
    }
  }

  Auftrag.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    controller_type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    id_code: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    program_nr: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    program_name: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    material_number: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    serial_number: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    screw_channel: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    result: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    last_step_n: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    last_step_p: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    nominal_torque: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    actual_torque: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    min_torque: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    max_torque: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    nominal_angle: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    actual_angle: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    min_angle: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    max_angle: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    angle_values: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    torque_values: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    cycle: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    screwdriver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'screwdrivers',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Auftrag',
    tableName: 'auftraege',
    timestamps: false
  });

  return Auftrag;
};
