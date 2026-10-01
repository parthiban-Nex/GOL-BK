export default function VehicleTypeDatas(sequelize, DataTypes) {
  const VehicleType = sequelize.define(
    'vrm_master_vehicle_type',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      VEHICLE_TYPE: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_TYPE_DESCRIPTION: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  return VehicleType;
}
