export default function gateinVehicleInventoryDatas(sequelize, DataTypes) {
  const gateinVehicleInventory = sequelize.define(
    'vrm_master_gatein_vehicle_inventory',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      NAME: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      CONTENT: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      INPUT_TYPE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      IS_MANDATORY: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_DATE',
      },
      IS_ACTIVE: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return gateinVehicleInventory;
}
