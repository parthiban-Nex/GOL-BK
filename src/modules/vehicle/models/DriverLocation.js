export default function DriverLocation(sequelize, DataTypes) {
  const DriverLocationType = sequelize.define(
    'vrm_trans_driver_location',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      USER_ID: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      DMS_BOOKING_ID: {
        type: DataTypes.STRING(45),
      },
      LATITUDE: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      LONGITUDE: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      CREATED_TIMESTAMP: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    },
    {
      freezeTableName: true,
      tableName: "vrm_trans_driver_location",
      timestamps: false,
    }
  );

  return DriverLocationType;
}
