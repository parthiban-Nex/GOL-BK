export default function pickupDropoffLogData(sequelize, DataTypes) {
  const PickupDropoffLog = sequelize.define(
    'PickupDropoffLog',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      service_booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pickup_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pick_up_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pick_up_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dropoff_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      drop_off_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      drop_off_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'pickup_dropoff_logs',
      timestamps: true,
      underscored: true,
    }
  );

  return PickupDropoffLog;
}
