export default function DriverPickpDrop(sequelize, DataTypes) {
  const DriverPickUpDrop = sequelize.define(
    'vrm_trans_driver_pickup_drop',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      DMS_BOOKING_ID: {
        type: DataTypes.STRING(45),
      },
      EVENT_TIME: {
        type: DataTypes.STRING(45),
      },
      EVENT: {
        type: DataTypes.STRING(45),
      },
      LATITUDE: {
        type: DataTypes.STRING(45),
      },
      LONGITUDE: {
        type: DataTypes.STRING(45),
      },
      USER: {
        type: DataTypes.STRING(45),
      },
      CREATED_DATE: {
        type: DataTypes.STRING(45),
      },
    },
    {
      freezeTableName: true,
      tableName: "vrm_trans_driver_pickup_drop",
      timestamps: false,
    }
  );

  return DriverPickUpDrop;
}
