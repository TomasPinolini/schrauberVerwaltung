const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {}

  ActivityLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    screwdriver_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('screwdriver_name') || '';
      },
      set(value) {
        this.setDataValue('screwdriver_name', value);
      }
    }
  }, {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    timestamps: false,
    underscored: true
  });

  return ActivityLog;
};
